"""
Router: /dispatch/trips — live trip lifecycle endpoints (depart, arrive, complete, delay).
"""

from __future__ import annotations

import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from app.core.events import emit_event
from app.models.audit import DispatchAuditLogModel
from app.models.dispatch import LiveTripModel
from app.schemas.dispatch_schemas import (
    DelayReport,
    DepartRequest,
    StopArriveRequest,
    StopCompleteRequest,
    StopDetail,
    StopStatus,
    TripCompleteRequest,
    TripListResponse,
    TripLiveResponse,
    TripLiveStatus,
)

router = APIRouter(prefix="/trips", tags=["Trip Lifecycle"])


def _to_trip_live_response(trip: LiveTripModel) -> TripLiveResponse:
    stops_list: list[StopDetail] = []
    for s in (trip.stops or []):
        stops_list.append(
            StopDetail(
                outlet_id=s.get("outlet_id", ""),
                planned_arrival=s.get("planned_arrival") or s.get("arrival") or "07:00",
                planned_departure=s.get("planned_departure") or s.get("departure") or "07:30",
                actual_arrival=s.get("actual_arrival"),
                actual_departure=s.get("actual_departure"),
                status=StopStatus(s.get("status", "pending")),
                delivered_weight_kg=s.get("delivered_weight_kg"),
                delivery_note=s.get("delivery_note"),
            )
        )

    return TripLiveResponse(
        trip_id=trip.trip_id,
        vehicle_id=trip.vehicle_id,
        driver_id=trip.driver_id,
        depot=trip.depot,
        district=trip.district,
        brand=trip.brand,
        live_status=TripLiveStatus(trip.live_status),
        departed_at=trip.departed_at,
        completed_at=trip.completed_at,
        delay_minutes=trip.delay_minutes,
        stops=stops_list,
        plan_id=trip.plan_id,
        is_manual=trip.is_manual,
    )


async def _get_live_trip_or_404(trip_id: str, db: AsyncSession) -> LiveTripModel:
    stmt = select(LiveTripModel).where(
        or_(LiveTripModel.trip_id == trip_id, LiveTripModel.ID == trip_id),
        LiveTripModel.IsActive.is_(True),
    )
    trip = (await db.execute(stmt)).scalars().first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip '{trip_id}' not found.",
        )
    return trip


@router.get(
    "",
    response_model=TripListResponse,
    summary="List all trips with live status",
    description="Returns all trips with real-time status. Role: DISPATCHER+",
)
async def list_trips(
    date:   str | None   = Query(default=None, description="ISO date YYYY-MM-DD, defaults to today"),
    depot:  str | None   = Query(default=None),
    status: str | None   = Query(default=None, description="scheduled|departed|in_transit|completed|cancelled|delayed"),
    page:   int          = Query(default=1, ge=1),
    limit:  int          = Query(default=50, ge=1, le=500),
    db:     AsyncSession = Depends(get_db),
):
    target_date = date or datetime.date.today().isoformat()
    query = select(LiveTripModel).where(LiveTripModel.IsActive.is_(True))

    if date:
        query = query.where(LiveTripModel.trip_date == target_date)
    if depot:
        query = query.where(LiveTripModel.depot == depot)
    if status:
        query = query.where(LiveTripModel.live_status == status)

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    stmt = query.order_by(LiveTripModel.planned_dispatch, LiveTripModel.trip_id).offset(offset).limit(limit)
    records = list((await db.execute(stmt)).scalars().all())

    items = [_to_trip_live_response(r) for r in records]

    return TripListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/{trip_id}",
    response_model=TripLiveResponse,
    summary="Get trip with live stop progress",
    description="Returns full trip detail with real-time stop statuses. Role: DISPATCHER+",
)
async def get_trip(
    trip_id: str = Path(...),
    db:      AsyncSession = Depends(get_db),
):
    trip = await _get_live_trip_or_404(trip_id, db)
    return _to_trip_live_response(trip)


@router.post(
    "/{trip_id}/depart",
    response_model=TripLiveResponse,
    summary="Record vehicle departure from depot",
    description=(
        "Starts the trip clock. Sets live_status=departed. "
        "Emits trip.departed to RabbitMQ trip.events exchange. Role: DRIVER+"
    ),
)
async def depart_trip(
    trip_id: str           = Path(...),
    payload: DepartRequest = ...,
    db:      AsyncSession  = Depends(get_db),
):
    trip = await _get_live_trip_or_404(trip_id, db)

    if trip.live_status in ("completed", "cancelled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot depart trip in '{trip.live_status}' state.",
        )

    now = datetime.datetime.utcnow()
    trip.live_status = "departed"
    trip.departed_at = payload.actual_departure_time
    if payload.odometer_km is not None:
        trip.odometer_start_km = payload.odometer_km
    trip.UpdateTime = now

    audit = DispatchAuditLogModel(
        ID=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        actor=trip.driver_id or "DRIVER",
        action="TRIP_DEPARTED",
        trip_id=trip.trip_id,
        vehicle_id=trip.vehicle_id,
        driver_id=trip.driver_id,
        details=f"Departed at {payload.actual_departure_time}, odometer: {payload.odometer_km}",
    )
    db.add(audit)
    await db.flush()

    await emit_event(
        "trip.departed",
        {
            "trip_id": trip.trip_id,
            "vehicle_id": trip.vehicle_id,
            "driver_id": trip.driver_id,
            "depot": trip.depot,
            "departed_at": payload.actual_departure_time,
            "odometer_km": payload.odometer_km,
        },
    )

    return _to_trip_live_response(trip)


@router.post(
    "/{trip_id}/stops/{outlet_id}/arrive",
    response_model=TripLiveResponse,
    summary="Record vehicle arrival at a stop",
    description="Sets stop status=arrived, records actual_arrival_time. Role: DRIVER+",
)
async def arrive_at_stop(
    trip_id:   str               = Path(...),
    outlet_id: str               = Path(...),
    payload:   StopArriveRequest = ...,
    db:        AsyncSession      = Depends(get_db),
):
    trip = await _get_live_trip_or_404(trip_id, db)

    updated_stops = list(trip.stops or [])
    found = False
    for s in updated_stops:
        if s.get("outlet_id") == outlet_id:
            s["actual_arrival"] = payload.actual_arrival_time
            s["status"] = "arrived"
            found = True
            break

    if not found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outlet '{outlet_id}' not found in stop sequence for trip '{trip_id}'.",
        )

    trip.stops = updated_stops
    if trip.live_status != "completed":
        trip.live_status = "in_transit"
    trip.UpdateTime = datetime.datetime.utcnow()

    audit = DispatchAuditLogModel(
        ID=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        actor=trip.driver_id or "DRIVER",
        action="STOP_ARRIVED",
        trip_id=trip.trip_id,
        vehicle_id=trip.vehicle_id,
        driver_id=trip.driver_id,
        details=f"Arrived at outlet {outlet_id} at {payload.actual_arrival_time}",
    )
    db.add(audit)
    await db.flush()

    return _to_trip_live_response(trip)


@router.post(
    "/{trip_id}/stops/{outlet_id}/complete",
    response_model=TripLiveResponse,
    summary="Mark stop delivery as complete",
    description=(
        "Sets stop status=completed, records actual_departure_time. "
        "Emits trip.stop_completed to RabbitMQ. Role: DRIVER+"
    ),
)
async def complete_stop(
    trip_id:   str                 = Path(...),
    outlet_id: str                 = Path(...),
    payload:   StopCompleteRequest = ...,
    db:        AsyncSession        = Depends(get_db),
):
    trip = await _get_live_trip_or_404(trip_id, db)

    updated_stops = list(trip.stops or [])
    completed_stop = None
    for s in updated_stops:
        if s.get("outlet_id") == outlet_id:
            s["actual_departure"] = payload.actual_departure_time
            s["delivered_weight_kg"] = payload.delivered_weight_kg
            s["delivery_note"] = payload.delivery_note
            s["status"] = "completed"
            completed_stop = s
            break

    if not completed_stop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outlet '{outlet_id}' not found in stop sequence for trip '{trip_id}'.",
        )

    trip.stops = updated_stops
    if trip.live_status != "completed":
        trip.live_status = "in_transit"
    trip.UpdateTime = datetime.datetime.utcnow()

    audit = DispatchAuditLogModel(
        ID=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        actor=trip.driver_id or "DRIVER",
        action="STOP_COMPLETED",
        trip_id=trip.trip_id,
        vehicle_id=trip.vehicle_id,
        driver_id=trip.driver_id,
        details=f"Completed stop {outlet_id} at {payload.actual_departure_time}. Weight: {payload.delivered_weight_kg}kg",
    )
    db.add(audit)
    await db.flush()

    await emit_event(
        "trip.stop_completed",
        {
            "trip_id": trip.trip_id,
            "vehicle_id": trip.vehicle_id,
            "driver_id": trip.driver_id,
            "outlet_id": outlet_id,
            "order_id": completed_stop.get("order_id"),
            "departure_time": payload.actual_departure_time,
            "delivered_weight_kg": payload.delivered_weight_kg,
        },
    )

    return _to_trip_live_response(trip)


@router.post(
    "/{trip_id}/complete",
    response_model=TripLiveResponse,
    summary="Record vehicle return to depot",
    description=(
        "Closes the trip. Sets live_status=completed. "
        "Emits trip.completed to RabbitMQ — triggers Order Service to mark orders delivered. "
        "Role: DRIVER+"
    ),
)
async def complete_trip(
    trip_id: str                 = Path(...),
    payload: TripCompleteRequest = ...,
    db:      AsyncSession        = Depends(get_db),
):
    trip = await _get_live_trip_or_404(trip_id, db)

    if trip.live_status == "completed":
        return _to_trip_live_response(trip)

    now = datetime.datetime.utcnow()
    trip.live_status = "completed"
    trip.completed_at = payload.return_time
    if payload.odometer_km is not None:
        trip.odometer_end_km = payload.odometer_km

    # Mark any pending stops as completed
    updated_stops = list(trip.stops or [])
    order_ids: list[str] = []
    for s in updated_stops:
        if s.get("status") != "completed":
            s["status"] = "completed"
            if not s.get("actual_departure"):
                s["actual_departure"] = payload.return_time
        if s.get("order_id"):
            order_ids.append(s["order_id"])

    trip.stops = updated_stops
    trip.UpdateTime = now

    audit = DispatchAuditLogModel(
        ID=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        actor=trip.driver_id or "DRIVER",
        action="TRIP_COMPLETED",
        trip_id=trip.trip_id,
        vehicle_id=trip.vehicle_id,
        driver_id=trip.driver_id,
        details=f"Returned to depot at {payload.return_time}, odometer: {payload.odometer_km}",
    )
    db.add(audit)
    await db.flush()

    await emit_event(
        "trip.completed",
        {
            "trip_id": trip.trip_id,
            "vehicle_id": trip.vehicle_id,
            "driver_id": trip.driver_id,
            "depot": trip.depot,
            "return_time": payload.return_time,
            "order_ids": order_ids,
        },
    )

    return _to_trip_live_response(trip)


@router.post(
    "/{trip_id}/delay",
    response_model=TripLiveResponse,
    summary="Report a trip delay",
    description=(
        "Records delay reason and estimated_delay_min. Sets live_status=delayed. "
        "Emits trip.delayed. Role: DRIVER+"
    ),
)
async def report_delay(
    trip_id: str          = Path(...),
    payload: DelayReport  = ...,
    db:      AsyncSession = Depends(get_db),
):
    trip = await _get_live_trip_or_404(trip_id, db)

    trip.live_status = "delayed"
    trip.delay_minutes += payload.estimated_delay_min
    trip.delay_reason = payload.reason
    trip.UpdateTime = datetime.datetime.utcnow()

    audit = DispatchAuditLogModel(
        ID=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        actor=trip.driver_id or "DRIVER",
        action="DELAY_REPORTED",
        trip_id=trip.trip_id,
        vehicle_id=trip.vehicle_id,
        driver_id=trip.driver_id,
        details=f"Delay +{payload.estimated_delay_min} min: {payload.reason}",
    )
    db.add(audit)
    await db.flush()

    await emit_event(
        "trip.delayed",
        {
            "trip_id": trip.trip_id,
            "vehicle_id": trip.vehicle_id,
            "driver_id": trip.driver_id,
            "delay_minutes": trip.delay_minutes,
            "reason": payload.reason,
        },
    )

    return _to_trip_live_response(trip)
