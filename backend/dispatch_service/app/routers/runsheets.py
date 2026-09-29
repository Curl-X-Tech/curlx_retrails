"""
Router: /dispatch/runsheets — view-only run sheet endpoints.
"""

from __future__ import annotations

import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.dispatch import LiveTripModel
from app.schemas.dispatch_schemas import (
    RunSheetListResponse,
    RunSheetResponse,
    StopDetail,
    StopStatus,
    TripLiveStatus,
)

router = APIRouter(prefix="/runsheets", tags=["Run Sheets"])


def _to_runsheet_response(trip: LiveTripModel) -> RunSheetResponse:
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

    return RunSheetResponse(
        trip_id=trip.trip_id,
        vehicle_id=trip.vehicle_id,
        driver_id=trip.driver_id,
        depot=trip.depot,
        district=trip.district,
        brand=trip.brand,
        planned_dispatch=trip.planned_dispatch,
        live_status=TripLiveStatus(trip.live_status),
        stops=stops_list,
        allocated_from=trip.allocated_from,
        plan_id=trip.plan_id,
    )


@router.get(
    "",
    response_model=RunSheetListResponse,
    summary="List all run sheets",
    description="Returns today's run sheets by default. Role: DISPATCHER+",
)
async def list_runsheets(
    date:   str | None   = Query(default=None, description="ISO date YYYY-MM-DD, defaults to today"),
    depot:  str | None   = Query(default=None),
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

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    stmt = query.order_by(LiveTripModel.planned_dispatch, LiveTripModel.trip_id).offset(offset).limit(limit)
    records = list((await db.execute(stmt)).scalars().all())

    items = [_to_runsheet_response(r) for r in records]

    return RunSheetListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/{trip_id}",
    response_model=RunSheetResponse,
    summary="Get full run sheet for a trip",
    description="Returns planned stop sequence with live status overlay. Role: DRIVER+",
)
async def get_runsheet(
    trip_id: str = Path(...),
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
            detail=f"Run sheet for trip '{trip_id}' not found.",
        )
    return _to_runsheet_response(trip)


@router.get(
    "/by-vehicle/{vehicle_id}",
    response_model=RunSheetListResponse,
    summary="All run sheets for a vehicle today",
    description="Returns up to 2 run sheets (daily trip limit). Role: DISPATCHER+",
)
async def runsheets_by_vehicle(
    vehicle_id: str          = Path(...),
    date:       str | None   = Query(default=None),
    db:         AsyncSession = Depends(get_db),
):
    target_date = date or datetime.date.today().isoformat()
    query = select(LiveTripModel).where(
        LiveTripModel.vehicle_id == vehicle_id,
        LiveTripModel.IsActive.is_(True),
    )
    if date:
        query = query.where(LiveTripModel.trip_date == target_date)

    records = list((await db.execute(query.order_by(LiveTripModel.planned_dispatch))).scalars().all())
    items = [_to_runsheet_response(r) for r in records]

    return RunSheetListResponse(
        items=items,
        total=len(items),
        page=1,
        limit=50,
        has_next=False,
    )


@router.get(
    "/by-depot/{depot}",
    response_model=RunSheetListResponse,
    summary="All run sheets for a depot today",
    description="Full depot operational view for managers. Role: DEPOT_MANAGER+",
)
async def runsheets_by_depot(
    depot: str          = Path(...),
    date:  str | None   = Query(default=None),
    page:  int          = Query(default=1, ge=1),
    limit: int          = Query(default=100, ge=1, le=500),
    db:    AsyncSession = Depends(get_db),
):
    target_date = date or datetime.date.today().isoformat()
    query = select(LiveTripModel).where(
        LiveTripModel.depot == depot,
        LiveTripModel.IsActive.is_(True),
    )
    if date:
        query = query.where(LiveTripModel.trip_date == target_date)

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    records = list((await db.execute(query.order_by(LiveTripModel.planned_dispatch).offset(offset).limit(limit))).scalars().all())
    items = [_to_runsheet_response(r) for r in records]

    return RunSheetListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/by-driver/{driver_id}",
    response_model=RunSheetListResponse,
    summary="All run sheets assigned to a driver",
    description="Role: DISPATCHER+",
)
async def runsheets_by_driver(
    driver_id: str          = Path(...),
    date:      str | None   = Query(default=None),
    db:        AsyncSession = Depends(get_db),
):
    query = select(LiveTripModel).where(
        LiveTripModel.driver_id == driver_id,
        LiveTripModel.IsActive.is_(True),
    )
    if date:
        query = query.where(LiveTripModel.trip_date == date)

    records = list((await db.execute(query.order_by(LiveTripModel.planned_dispatch))).scalars().all())
    items = [_to_runsheet_response(r) for r in records]

    return RunSheetListResponse(
        items=items,
        total=len(items),
        page=1,
        limit=50,
        has_next=False,
    )
