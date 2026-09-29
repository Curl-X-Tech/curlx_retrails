"""
Router: /dispatch/trips/manual — ad-hoc trip creation and emergency vehicle reassignment.

These trips bypass the Planning Engine entirely.
They are created directly in the Dispatcher Service by authorized managers.
"""

from __future__ import annotations

import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from app.models.audit import DispatchAuditLogModel
from app.models.dispatch import LiveTripModel
from app.schemas.dispatch_schemas import (
    ManualTripCreate,
    StopDetail,
    StopStatus,
    TripLiveResponse,
    TripLiveStatus,
    VehicleReassignRequest,
)

router = APIRouter(prefix="/trips", tags=["Manual Trips"])


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


@router.post(
    "/manual",
    response_model=TripLiveResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an ad-hoc manual trip",
    description=(
        "Creates a trip directly in the Dispatcher Service without a Planning Engine plan. "
        "Requires mandatory override_reason and authorized_by for full audit trail. "
        "Role: DEPOT_MANAGER+"
    ),
)
async def create_manual_trip(
    payload: ManualTripCreate,
    db:      AsyncSession = Depends(get_db),
):
    trip_id = f"TRP-MAN-{uuid.uuid4().hex[:6].upper()}"
    dispatch_time = payload.scheduled_dispatch
    if len(dispatch_time) > 5 and "T" in dispatch_time:
        try:
            dt = datetime.datetime.fromisoformat(dispatch_time.replace("Z", "+00:00"))
            dispatch_time = dt.strftime("%H:%M")
        except Exception:
            dispatch_time = "06:00"

    # Construct sequential stops with 30-minute intervals
    stops = []
    base_hour, base_min = 6, 0
    try:
        parts = dispatch_time.split(":")
        base_hour, base_min = int(parts[0]), int(parts[1])
    except Exception:
        pass

    curr_total_min = base_hour * 60 + base_min
    for idx, outlet_id in enumerate(payload.outlet_ids):
        arr_min = curr_total_min + 30
        dep_min = arr_min + 20
        curr_total_min = dep_min

        arr_hhmm = f"{(arr_min // 60) % 24:02d}:{arr_min % 60:02d}"
        dep_hhmm = f"{(dep_min // 60) % 24:02d}:{dep_min % 60:02d}"

        stops.append({
            "outlet_id": outlet_id,
            "planned_arrival": arr_hhmm,
            "planned_departure": dep_hhmm,
            "actual_arrival": None,
            "actual_departure": None,
            "status": "pending",
        })

    ret_min = curr_total_min + 30
    ret_hhmm = f"{(ret_min // 60) % 24:02d}:{ret_min % 60:02d}"

    live_trip = LiveTripModel(
        ID=trip_id,
        trip_id=trip_id,
        vehicle_id=payload.vehicle_id,
        driver_id=None,
        depot=payload.depot,
        district=payload.district,
        brand=payload.brand,
        trip_date=datetime.date.today().isoformat(),
        planned_dispatch=dispatch_time,
        planned_return=ret_hhmm,
        live_status="scheduled",
        stops=stops,
        allocated_from="MANUAL",
        plan_id=None,
        is_manual=True,
        override_reason=payload.override_reason,
        authorized_by=payload.authorized_by,
        CreatedBy=payload.authorized_by,
        UpdatedBy=payload.authorized_by,
    )
    db.add(live_trip)

    audit = DispatchAuditLogModel(
        ID=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        actor=payload.authorized_by,
        action="MANUAL_TRIP_CREATED",
        trip_id=trip_id,
        vehicle_id=payload.vehicle_id,
        details=f"Manual trip created. Outlets: {payload.outlet_ids}. Reason: {payload.override_reason}",
    )
    db.add(audit)
    await db.flush()
    await db.refresh(live_trip)

    return _to_trip_live_response(live_trip)


@router.patch(
    "/{trip_id}/vehicle",
    response_model=TripLiveResponse,
    summary="Emergency vehicle re-assignment on an active trip",
    description=(
        "Re-assigns a different vehicle to a trip. "
        "Only allowed before departure (live_status=scheduled). "
        "Role: DEPOT_MANAGER+"
    ),
)
async def reassign_vehicle(
    trip_id: str                    = Path(...),
    payload: VehicleReassignRequest = ...,
    db:      AsyncSession           = Depends(get_db),
):
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

    if trip.live_status != "scheduled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reassign vehicle for trip in '{trip.live_status}' state (only 'scheduled' allowed).",
        )

    old_vehicle = trip.vehicle_id
    trip.vehicle_id = payload.new_vehicle_id
    trip.UpdateTime = datetime.datetime.utcnow()
    trip.UpdatedBy = payload.authorized_by

    audit = DispatchAuditLogModel(
        ID=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        actor=payload.authorized_by,
        action="VEHICLE_REASSIGNED",
        trip_id=trip.trip_id,
        vehicle_id=payload.new_vehicle_id,
        details=f"Vehicle changed from {old_vehicle} to {payload.new_vehicle_id}. Reason: {payload.reason}",
    )
    db.add(audit)
    await db.flush()

    return _to_trip_live_response(trip)


@router.delete(
    "/{trip_id}",
    status_code=status.HTTP_200_OK,
    summary="Cancel a trip before departure",
    description=(
        "Cancels a scheduled trip. Only allowed when live_status=scheduled. "
        "Sets live_status=cancelled. Role: DEPOT_MANAGER+"
    ),
)
async def cancel_trip(
    trip_id: str          = Path(...),
    db:      AsyncSession = Depends(get_db),
):
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

    if trip.live_status != "scheduled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel trip in '{trip.live_status}' status. Only scheduled trips may be cancelled.",
        )

    trip.live_status = "cancelled"
    trip.UpdateTime = datetime.datetime.utcnow()

    audit = DispatchAuditLogModel(
        ID=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        actor="DEPOT_MANAGER",
        action="TRIP_CANCELLED",
        trip_id=trip.trip_id,
        vehicle_id=trip.vehicle_id,
        details="Trip cancelled before departure",
    )
    db.add(audit)
    await db.flush()

    return {
        "status": "cancelled",
        "trip_id": trip.trip_id,
        "message": f"Trip '{trip.trip_id}' successfully cancelled.",
    }
