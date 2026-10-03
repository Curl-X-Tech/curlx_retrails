"""Router: /plans/validate — dry-run validation endpoints (no commits)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.data_provider import (
    fetch_orders,
    fetch_outlets,
    fetch_routes,
    fetch_service_allowances,
    fetch_vehicles,
)
from app.models.plan import PlannedTripModel
from app.schemas.planning_schemas import (
    TripSchedule,
    ValidateCapacityRequest,
    ValidateTimeWindowRequest,
    ValidateTripAssignmentRequest,
    ValidationResponse,
)
from app.domain.Planner import PlanValidator
from app.domain.Trip import Trip

router = APIRouter(prefix="/plans/validate", tags=["Plan Validation"])


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


@router.post(
    "/trip-assignment",
    response_model=ValidationResponse,
    summary="Dry-run: validate trip vehicle assignment",
    description="Runs the full 10-constraint check WITHOUT committing the assignment.",
)
async def validate_trip_assignment(
    payload: ValidateTripAssignmentRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(PlannedTripModel).where(
        PlannedTripModel.plan_id == payload.plan_id,
        (PlannedTripModel.trip_id == payload.trip_id) | (PlannedTripModel.ID == payload.trip_id),
        PlannedTripModel.IsActive.is_(True),
    )
    trip = (await db.execute(stmt)).scalars().first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip '{payload.trip_id}' not found in plan '{payload.plan_id}'.",
        )

    outlets = await fetch_outlets()
    routes = await fetch_routes()
    vehicles = await fetch_vehicles()
    service_allowances = await fetch_service_allowances()
    orders = await fetch_orders(order_ids=trip.order_ids)

    vehicle = next((v for v in vehicles if v.ID == payload.vehicle_id), None)
    if not vehicle:
        return ValidationResponse(
            is_valid=False,
            errors=[f"Vehicle '{payload.vehicle_id}' not found."],
            warnings=[],
            schedule=None,
        )

    matching_route = next((r for r in routes if r.district == trip.district and r.depot == trip.depot), None)

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

    # Fetch other trips assigned to this vehicle
    other_stmt = select(PlannedTripModel).where(
        PlannedTripModel.plan_id == payload.plan_id,
        PlannedTripModel.vehicle_id == payload.vehicle_id,
        PlannedTripModel.ID != trip.ID,
        PlannedTripModel.IsActive.is_(True),
    )
    other_models = list((await db.execute(other_stmt)).scalars().all())

    other_domain_trips = []
    for ot in other_models:
        if ot.allocation_day == payload.allocation_day:
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
                    vehicle=vehicle,
                    order_queue=ot_orders,
                    outlets=outlets,
                )
            )

    result = PlanValidator.validate_trip_assignment(
        trip=domain_trip,
        vehicle=vehicle,
        allocation_day=payload.allocation_day,
        existing_trips=other_domain_trips,
        outlets=outlets,
        service_allowances=service_allowances,
    )

    formatted_sched = _format_schedule_for_response(result.schedule)

    return ValidationResponse(
        is_valid=result.is_valid,
        errors=result.errors,
        warnings=result.warnings,
        schedule=formatted_sched,
    )


@router.post(
    "/vehicle-capacity",
    response_model=ValidationResponse,
    summary="Dry-run: check if orders fit a vehicle",
    description="Checks weight_kg <= vehicle.weight_cap_kg and volume_m3 <= vehicle.volume_cap_m3.",
)
async def validate_vehicle_capacity(
    payload: ValidateCapacityRequest,
):
    vehicles = await fetch_vehicles()
    vehicle = next((v for v in vehicles if v.ID == payload.vehicle_id), None)
    if not vehicle:
        return ValidationResponse(
            is_valid=False,
            errors=[f"Vehicle '{payload.vehicle_id}' not found."],
            warnings=[],
            schedule=None,
        )

    orders = await fetch_orders(order_ids=payload.order_ids)
    if not orders:
        return ValidationResponse(
            is_valid=False,
            errors=["No valid orders found for the given order_ids."],
            warnings=[],
            schedule=None,
        )

    errors = []
    total_weight = sum(o.get_weight() for o in orders)
    total_volume = sum(o.get_volume() for o in orders)

    if total_weight > vehicle.weight_cap_kg:
        errors.append(
            f"Weight overload: orders weight {total_weight:.1f}kg exceeds vehicle limit {vehicle.weight_cap_kg:.1f}kg."
        )

    if total_volume > vehicle.volume_cap_m3:
        errors.append(
            f"Volume overload: orders volume {total_volume:.2f}m3 exceeds vehicle limit {vehicle.volume_cap_m3:.2f}m3."
        )

    requires_reefer = any(o.get_temp_condition() in ("chilled", "frozen") for o in orders)
    if requires_reefer and vehicle.temp_condition != "reefer":
        errors.append(
            f"Temperature violation: chilled/frozen orders require a reefer vehicle, but {vehicle.ID} is {vehicle.temp_condition}."
        )

    return ValidationResponse(
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=[],
        schedule=None,
    )


@router.post(
    "/time-window",
    response_model=ValidationResponse,
    summary="Dry-run: simulate stop schedule for a trip and vehicle",
    description="Simulates the stop timeline and checks that all deliveries complete before window close.",
)
async def validate_time_window(
    payload: ValidateTimeWindowRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(PlannedTripModel).where(
        PlannedTripModel.plan_id == payload.plan_id,
        (PlannedTripModel.trip_id == payload.trip_id) | (PlannedTripModel.ID == payload.trip_id),
        PlannedTripModel.IsActive.is_(True),
    )
    trip = (await db.execute(stmt)).scalars().first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip '{payload.trip_id}' not found in plan '{payload.plan_id}'.",
        )

    outlets = await fetch_outlets()
    routes = await fetch_routes()
    service_allowances = await fetch_service_allowances()
    orders = await fetch_orders(order_ids=trip.order_ids)

    matching_route = next((r for r in routes if r.district == trip.district and r.depot == trip.depot), None)

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

    sched = domain_trip.plan_stop_sequence(outlets, service_allowances)
    if not sched:
        return ValidationResponse(
            is_valid=False,
            errors=["Unable to generate schedule for trip."],
            warnings=[],
            schedule=None,
        )

    errors = []
    if sched.get("has_violations"):
        for stop in sched.get("stops", []):
            if not stop.get("on_time"):
                errors.append(
                    f"Late stop {stop['seq']} at {stop['outlet_id']}: arrives {stop['arrive_hhmm']}, "
                    f"window closes {stop['window_close']}, late by {stop['late_by_min']} min."
                )

    formatted_sched = _format_schedule_for_response(sched)

    return ValidationResponse(
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=[],
        schedule=formatted_sched,
    )
