import uuid
from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.core.timezone import utc_now
from app.entities.customer_order import CustomerOrder
from app.entities.staff_profile import StaffProfile
from app.entities.trip import RouteLeg, Trip
from app.entities.user import User
from app.guards import require_dispatcher, require_system_admin
from app.services.allocation import (
    SOLVER_STATE,
    get_engine_status,
    run_allocation_engine,
    update_cron_schedule,
)
from app.services.checklist import ensure_checklist
from app.services.dispatcher_scope import is_scoped, trip_scope
from app.services.manual_allocation import allocate_orders
from app.services.trip_views import allocation_detail, allocation_summary, load_context, load_contexts

router = APIRouter(prefix="/allocations", tags=["allocations"])

SessionDep = Annotated[AsyncSession, Depends(get_async_session)]
DispatcherDep = Annotated[User, Depends(require_dispatcher)]


class VehicleOverride(BaseModel):
    vehicle_id: uuid.UUID
    status: str


class OptimizeRequest(BaseModel):
    operating_date: date
    depot_id: uuid.UUID
    order_ids: list[uuid.UUID] | None = None
    vehicle_overrides: list[VehicleOverride] = []
    simulation: bool = False
    solver_type: Literal["ortools", "heuristic"] = "ortools"


class ManualAllocateRequest(BaseModel):
    order_ids: list[uuid.UUID] = Field(min_length=1)
    vehicle_id: uuid.UUID
    driver_id: uuid.UUID | None = None
    operating_date: date


class ScheduleCronRequest(BaseModel):
    cutoff_time: str
    timezone: str
    is_enabled: bool


async def _filtered_trips(
    session: AsyncSession,
    user: User | None,
    dispatch_date: date | None,
    depot_id: uuid.UUID | None,
    brand_id: uuid.UUID | None,
    district_id: uuid.UUID | None,
    trip_status: str | None,
) -> list[Trip]:
    query = select(Trip).order_by(Trip.dispatch_date.desc(), Trip.trip_code)
    if is_scoped(user):
        query = query.where(trip_scope(user))
    for column, value in (
        (Trip.dispatch_date, dispatch_date),
        (Trip.depot_id, depot_id),
        (Trip.brand_id, brand_id),
        (Trip.district_id, district_id),
        (Trip.status, trip_status if trip_status and trip_status != "all" else None),
    ):
        if value is not None:
            query = query.where(column == value)
    return list((await session.execute(query)).scalars().all())


@router.get("/summary")
async def allocations_summary(
    session: SessionDep,
    user: DispatcherDep,
    dispatch_date: date | None = None,
    depot_id: uuid.UUID | None = None,
):
    trips = await _filtered_trips(session, user, dispatch_date, depot_id, None, None, None)
    summaries = [allocation_summary(c) for c in await load_contexts(session, trips)]
    count = len(summaries) or 1
    return {
        "total_trips": len(summaries),
        "active_trips": sum(s["status"] in ("loading", "dispatched", "in_transit") for s in summaries),
        "completed_trips": sum(s["status"] == "completed" for s in summaries),
        "total_packages_allocated": sum(s["total_packages"] for s in summaries),
        "total_weight_kg": round(sum(s["total_payload_kg"] for s in summaries), 2),
        "total_volume_m3": round(sum(s["total_volume_m3"] for s in summaries), 3),
        "total_cargo_value_lkr": round(sum(s["cargo_value_lkr"] for s in summaries), 2),
        "avg_weight_utilization_pct": round(sum(s["weight_utilization_pct"] for s in summaries) / count, 1),
        "avg_volume_utilization_pct": round(sum(s["volume_utilization_pct"] for s in summaries) / count, 1),
        "fully_utilized_trips": sum(s["weight_utilization_pct"] >= 90 for s in summaries),
    }


@router.get("/engine/status")
async def solver_status(_: DispatcherDep):
    return get_engine_status()


@router.post("/engine/schedule")
async def schedule_cron(payload: ScheduleCronRequest, _: Annotated[User, Depends(require_system_admin)]):
    hour, _sep, minute = payload.cutoff_time.partition(":")
    if not (hour.isdigit() and minute.isdigit() and int(hour) < 24 and int(minute) < 60):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="INVALID_CUTOFF_TIME")
    updated = update_cron_schedule(payload.cutoff_time, payload.timezone, payload.is_enabled)
    return {
        "success": True,
        "scheduled_at": utc_now().isoformat(),
        "cron_expression": f"{int(minute)} {int(hour)} * * *",
        "message": "Daily allocation enabled" if payload.is_enabled else "Daily allocation disabled",
        "config": updated,
    }


@router.post("/optimize")
async def optimize(payload: OptimizeRequest, session: SessionDep, user: DispatcherDep):
    staff_id = (
        await session.execute(select(StaffProfile.id).where(StaffProfile.user_id == user.id))
    ).scalar_one_or_none()
    unavailable = {o.vehicle_id for o in payload.vehicle_overrides if o.status == "in_workshop"}
    SOLVER_STATE.update(status="running", progress_pct=0, operating_date=payload.operating_date.isoformat())
    try:
        result = await run_allocation_engine(
            session=session,
            operating_date=payload.operating_date,
            depot_id=payload.depot_id,
            order_ids=payload.order_ids,
            unavailable_vehicle_ids=unavailable,
            staff_id=staff_id,
            user_id=user.id,
            simulation=payload.simulation,
            solver_type=payload.solver_type,
        )
    except Exception:
        SOLVER_STATE.update(status="failed")
        raise

    if not payload.simulation:
        await session.commit()

    SOLVER_STATE.update(
        status="completed",
        progress_pct=100,
        last_run_at=utc_now().isoformat(),
        trips_generated=result["summary"]["total_trips_created"],
        orders_deferred=result["summary"]["deferred_orders_count"],
        execution_time_ms=result["execution_time_ms"],
    )
    return result


@router.get("")
async def list_allocations(
    session: SessionDep,
    user: DispatcherDep,
    dispatch_date: date | None = None,
    depot_id: uuid.UUID | None = None,
    brand_id: uuid.UUID | None = None,
    district_id: uuid.UUID | None = None,
    status_filter: Annotated[str | None, Query(alias="status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
):
    trips = await _filtered_trips(session, user, dispatch_date, depot_id, brand_id, district_id, status_filter)
    window = trips[(page - 1) * limit : page * limit]
    return [allocation_summary(c) for c in await load_contexts(session, window)]


@router.post("/manual", status_code=status.HTTP_201_CREATED)
async def manual_allocation(payload: ManualAllocateRequest, session: SessionDep, user: DispatcherDep):
    trip = await allocate_orders(
        session, user, payload.order_ids, payload.vehicle_id, payload.driver_id, payload.operating_date
    )
    await session.commit()
    return {
        "success": True,
        "trip_id": str(trip.id),
        "trip_code": trip.trip_code,
        "status": trip.status,
        "allocated_order_count": len(payload.order_ids),
    }


async def _owned_trip(session: AsyncSession, user: User | None, trip_id: uuid.UUID) -> Trip:
    query = select(Trip).where(Trip.id == trip_id)
    if is_scoped(user):
        query = query.where(trip_scope(user))
    trip = (await session.execute(query)).scalar_one_or_none()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TRIP_NOT_FOUND")
    return trip


@router.get("/{trip_id}")
async def get_allocation(trip_id: uuid.UUID, session: SessionDep, user: DispatcherDep):
    await _owned_trip(session, user, trip_id)
    return allocation_detail(await load_context(session, trip_id))


@router.post("/{trip_id}/confirm")
async def confirm_allocation(trip_id: uuid.UUID, session: SessionDep, user: DispatcherDep):
    trip = await _owned_trip(session, user, trip_id)
    if trip.status != "scheduled":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="TRIP_NOT_SCHEDULED")
    now = utc_now()
    trip.status = "loading"
    trip.updated_at, trip.updated_by = now, user.id
    legs = (await session.execute(select(RouteLeg.order_id).where(RouteLeg.trip_id == trip_id))).scalars().all()
    for order in (
        (await session.execute(select(CustomerOrder).where(CustomerOrder.id.in_([o for o in legs if o]))))
        .scalars()
        .all()
    ):
        order.status = "allocated"
    await ensure_checklist(session, trip_id)
    await session.commit()
    return {"success": True, "trip_id": str(trip_id), "status": trip.status, "confirmed_at": now.isoformat()}
