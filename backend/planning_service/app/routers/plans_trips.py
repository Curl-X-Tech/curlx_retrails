"""Router: /plans/{plan_id}/trips — trip management within a plan."""

import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from app.core.data_provider import (
    fetch_orders,
    fetch_outlets,
    fetch_routes,
    fetch_service_allowances,
    fetch_vehicles,
)
from app.models.plan import AuditLogModel, PlannedTripModel
from app.schemas.planning_schemas import (
    AllocationSource,
    TripAssignRequest,
    TripAssignResponse,
    TripDetailResponse,
    TripSchedule,
    TripSummary,
)
from app.domain.Planner import PlanValidator
from app.domain.Trip import Trip

router = APIRouter(prefix="/plans/{plan_id}/trips", tags=["Plan Trips"])


def _format_schedule_for_response(sched: dict | None) -> TripSchedule | None:
    if not sched:
        return None
    return TripSchedule(
        dispatch_time=sched.get("departure_hhmm") or sched.get("dispatch_time") or "06:00",
        return_time=sched.get("return_to_depot_hhmm") or sched.get("return_time") or "12:00",
        stops=[
            {
                "outlet_id": s.get("outlet_id", ""),
                "arrival": s.get("arrive_hhmm") or s.get("arrival") or "00:00",
                "departure": s.get("depart_hhmm") or s.get("departure") or "00:00",
            }
            for s in sched.get("stops", [])
        ],
    )


@router.get(
    "",
    response_model=list[TripSummary],
    summary="List all trips in a plan",
    description="Returns all trip summaries for a given plan. Role: DISPATCHER+",
)
async def list_plan_trips(
    plan_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(PlannedTripModel)
        .where(PlannedTripModel.plan_id == plan_id, PlannedTripModel.IsActive.is_(True))
        .order_by(PlannedTripModel.trip_id)
    )
    trips = list((await db.execute(stmt)).scalars().all())
    return trips


@router.get(
    "/deferred",
    response_model=list[TripSummary],
    summary="List deferred trips (allocation_day > 1)",
    description="Returns only trips that could not be fulfilled on Day 1. Role: DISPATCHER+",
)
async def list_deferred_trips(
    plan_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(PlannedTripModel)
        .where(
            PlannedTripModel.plan_id == plan_id,
            PlannedTripModel.IsActive.is_(True),
            (PlannedTripModel.vehicle_id.is_(None)) | (PlannedTripModel.allocation_day > 1),
        )
        .order_by(PlannedTripModel.allocation_day, PlannedTripModel.trip_id)
    )
    trips = list((await db.execute(stmt)).scalars().all())
    return trips


@router.get(
    "/by-depot/{depot}",
    response_model=list[TripSummary],
    summary="Filter trips by depot",
    description="Returns trips belonging to the given depot. Role: DISPATCHER+",
)
async def trips_by_depot(
    plan_id: str = Path(...),
    depot: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(PlannedTripModel)
        .where(
            PlannedTripModel.plan_id == plan_id,
            PlannedTripModel.depot == depot,
            PlannedTripModel.IsActive.is_(True),
        )
        .order_by(PlannedTripModel.trip_id)
    )
    trips = list((await db.execute(stmt)).scalars().all())
    return trips


@router.get(
    "/by-district/{district}",
    response_model=list[TripSummary],
    summary="Filter trips by district",
    description="Returns trips destined for the given district. Role: DISPATCHER+",
)
async def trips_by_district(
    plan_id: str = Path(...),
    district: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(PlannedTripModel)
        .where(
            PlannedTripModel.plan_id == plan_id,
            PlannedTripModel.district == district,
            PlannedTripModel.IsActive.is_(True),
        )
        .order_by(PlannedTripModel.trip_id)
    )
    trips = list((await db.execute(stmt)).scalars().all())
    return trips


@router.get(
    "/{trip_id}",
    response_model=TripDetailResponse,
    summary="Get trip detail with stop schedule",
    description="Returns full trip detail including stop timeline. Role: DISPATCHER+",
)
async def get_trip_detail(
    plan_id: str = Path(...),
    trip_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(PlannedTripModel).where(
        PlannedTripModel.plan_id == plan_id,
        (PlannedTripModel.trip_id == trip_id) | (PlannedTripModel.ID == trip_id),
        PlannedTripModel.IsActive.is_(True),
    )
    trip = (await db.execute(stmt)).scalars().first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip '{trip_id}' not found in plan '{plan_id}'.",
        )

    sched = _format_schedule_for_response(trip.stop_schedule)

    return TripDetailResponse(
        trip_id=trip.trip_id,
        depot=trip.depot,
        district=trip.district,
        brand=trip.brand,
        vehicle_id=trip.vehicle_id,
        allocation_day=trip.allocation_day,
        allocation_source=AllocationSource(trip.allocation_source),
        is_locked=trip.is_locked,
        locked_by=trip.locked_by,
        locked_at=trip.locked_at,
        override_reason=trip.override_reason,
        allocation_error=trip.allocation_error,
        order_ids=trip.order_ids,
        stop_schedule=sched,
    )


@router.patch(
    "/{trip_id}/assign",
    response_model=TripAssignResponse,
    summary="Manual vehicle reassignment",
    description=(
        "Runs PlanValidator (all 10 business constraints) before committing. "
        "If is_valid=false, the assignment is REJECTED and not persisted. "
        "Role: DISPATCHER+"
    ),
)
async def assign_trip(
    plan_id: str = Path(...),
    trip_id: str = Path(...),
    payload: TripAssignRequest = ...,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(PlannedTripModel).where(
        PlannedTripModel.plan_id == plan_id,
        (PlannedTripModel.trip_id == trip_id) | (PlannedTripModel.ID == trip_id),
        PlannedTripModel.IsActive.is_(True),
    )
    trip = (await db.execute(stmt)).scalars().first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip '{trip_id}' not found in plan '{plan_id}'.",
        )

    # Load master data for validation
    outlets = await fetch_outlets()
    routes = await fetch_routes()
    vehicles = await fetch_vehicles()
    service_allowances = await fetch_service_allowances()
    orders = await fetch_orders(order_ids=trip.order_ids)

    # Find vehicle
    vehicle = next((v for v in vehicles if v.ID == payload.vehicle_id), None)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{payload.vehicle_id}' not found.",
        )

    # Find route
    matching_route = next((r for r in routes if r.district == trip.district and r.depot == trip.depot), None)

    # Construct domain Trip
    domain_trip = Trip(
        ID=trip.trip_id,
        CreateTime=trip.CreateTime,
        UpdateTime=trip.UpdateTime,
        CreatedBy=trip.CreatedBy,
        UpdatedBy=trip.UpdatedBy,
        IsActive=True,
        route=matching_route,
        order_queue=orders,
        outlets=outlets,
    )

    # Fetch other trips in plan for collision and count checks
    all_plan_trips_stmt = select(PlannedTripModel).where(
        PlannedTripModel.plan_id == plan_id,
        PlannedTripModel.ID != trip.ID,
        PlannedTripModel.IsActive.is_(True),
    )
    all_other_models = list((await db.execute(all_plan_trips_stmt)).scalars().all())

    other_domain_trips = []
    for ot in all_other_models:
        if ot.vehicle_id == payload.vehicle_id and ot.allocation_day == payload.allocation_day:
            ot_v = next((v for v in vehicles if v.ID == ot.vehicle_id), None)
            ot_r = next((r for r in routes if r.district == ot.district and r.depot == ot.depot), None)
            ot_orders = await fetch_orders(order_ids=ot.order_ids)
            other_domain_trips.append(
                Trip(
                    ID=ot.trip_id,
                    CreateTime=ot.CreateTime,
                    UpdateTime=ot.UpdateTime,
                    CreatedBy=ot.CreatedBy,
                    UpdatedBy=ot.UpdatedBy,
                    IsActive=True,
                    route=ot_r,
                    vehicle=ot_v,
                    order_queue=ot_orders,
                    outlets=outlets,
                )
            )

    # Validate assignment against 10 business constraints
    validation_res = PlanValidator.validate_trip_assignment(
        trip=domain_trip,
        vehicle=vehicle,
        allocation_day=payload.allocation_day,
        existing_trips=other_domain_trips,
        outlets=outlets,
        service_allowances=service_allowances,
    )

    now = datetime.datetime.utcnow()

    if not validation_res.is_valid:
        # Rejected — create rejection audit log
        audit = AuditLogModel(
            ID=f"AUD-{uuid.uuid4().hex[:8].upper()}",
            plan_id=plan_id,
            timestamp=now,
            actor="DISPATCHER",
            action="MANUAL_ASSIGN_REJECTED",
            trip_id=trip.trip_id,
            vehicle_id=payload.vehicle_id,
            details=f"Assignment rejected: {'; '.join(validation_res.errors)}",
            is_valid=False,
        )
        db.add(audit)
        await db.commit()

        return TripAssignResponse(
            is_valid=False,
            errors=validation_res.errors,
            warnings=validation_res.warnings,
            schedule=None,
        )

    # Valid — persist commit
    formatted_sched = _format_schedule_for_response(validation_res.schedule)

    trip.vehicle_id = payload.vehicle_id
    trip.allocation_day = payload.allocation_day
    trip.allocation_source = "MANUAL"
    trip.is_locked = True
    trip.locked_by = "DISPATCHER"
    trip.locked_at = now
    trip.override_reason = payload.override_reason
    trip.allocation_error = None
    trip.stop_schedule = formatted_sched.dict() if formatted_sched else None
    trip.UpdateTime = now
    trip.UpdatedBy = "DISPATCHER"

    audit = AuditLogModel(
        ID=f"AUD-{uuid.uuid4().hex[:8].upper()}",
        plan_id=plan_id,
        timestamp=now,
        actor="DISPATCHER",
        action="MANUAL_ASSIGN_COMMITTED",
        trip_id=trip.trip_id,
        vehicle_id=payload.vehicle_id,
        details=f"Assigned to {payload.vehicle_id} on day {payload.allocation_day}. Reason: {payload.override_reason}",
        is_valid=True,
    )
    db.add(audit)
    await db.commit()

    return TripAssignResponse(
        is_valid=True,
        errors=[],
        warnings=validation_res.warnings,
        schedule=formatted_sched,
    )


@router.patch(
    "/{trip_id}/unlock",
    response_model=TripDetailResponse,
    summary="Remove manual lock from a trip",
    description="Clears is_locked=true so the trip can be re-evaluated. Role: DEPOT_MANAGER+",
)
async def unlock_trip(
    plan_id: str = Path(...),
    trip_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(PlannedTripModel).where(
        PlannedTripModel.plan_id == plan_id,
        (PlannedTripModel.trip_id == trip_id) | (PlannedTripModel.ID == trip_id),
        PlannedTripModel.IsActive.is_(True),
    )
    trip = (await db.execute(stmt)).scalars().first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip '{trip_id}' not found in plan '{plan_id}'.",
        )

    now = datetime.datetime.utcnow()
    trip.is_locked = False
    trip.locked_by = None
    trip.locked_at = None
    trip.UpdateTime = now
    trip.UpdatedBy = "DEPOT_MANAGER"

    audit = AuditLogModel(
        ID=f"AUD-{uuid.uuid4().hex[:8].upper()}",
        plan_id=plan_id,
        timestamp=now,
        actor="DEPOT_MANAGER",
        action="UNLOCK_TRIP",
        trip_id=trip.trip_id,
        vehicle_id=trip.vehicle_id,
        details="Manual lock removed from trip.",
        is_valid=True,
    )
    db.add(audit)
    await db.commit()

    sched = _format_schedule_for_response(trip.stop_schedule)

    return TripDetailResponse(
        trip_id=trip.trip_id,
        depot=trip.depot,
        district=trip.district,
        brand=trip.brand,
        vehicle_id=trip.vehicle_id,
        allocation_day=trip.allocation_day,
        allocation_source=AllocationSource(trip.allocation_source),
        is_locked=trip.is_locked,
        locked_by=trip.locked_by,
        locked_at=trip.locked_at,
        override_reason=trip.override_reason,
        allocation_error=trip.allocation_error,
        order_ids=trip.order_ids,
        stop_schedule=sched,
    )
