"""
Router: /dispatch/drivers — driver management and check-in.
"""

from __future__ import annotations

import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from app.models.audit import DispatchAuditLogModel
from app.models.dispatch import LiveTripModel
from app.models.driver import DriverModel
from app.schemas.dispatch_schemas import (
    DriverAssignResponse,
    DriverCheckinRequest,
    DriverCreate,
    DriverListResponse,
    DriverResponse,
)

router = APIRouter(prefix="/drivers", tags=["Drivers"])
endpoint_router = APIRouter(prefix="/fleet/drivers", tags=["Drivers"])


@router.post(
    "",
    response_model=DriverResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new driver",
    description="Adds a driver to the system. Role: SUPERADMIN",
)
async def create_driver(
    payload: DriverCreate,
    db: AsyncSession = Depends(get_db),
):
    # Check duplicate license
    existing = (
        (await db.execute(select(DriverModel).where(DriverModel.license_no == payload.license_no))).scalars().first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Driver with license number '{payload.license_no}' already exists.",
        )

    driver_id = f"DRV-{uuid.uuid4().hex[:6].upper()}"
    driver = DriverModel(
        ID=driver_id,
        name=payload.name,
        license_no=payload.license_no,
        phone=payload.phone,
        depot=payload.depot,
        is_active=payload.is_active,
        checked_in=False,
    )
    db.add(driver)
    await db.flush()
    await db.refresh(driver)

    return driver


@endpoint_router.get("")
@router.get(
    "",
    response_model=DriverListResponse,
    summary="List all drivers",
    description="Returns all registered drivers. Role: DISPATCHER+",
)
async def list_drivers(
    depot: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(DriverModel).where(DriverModel.IsActive.is_(True))

    if depot:
        query = query.where(DriverModel.depot == depot)
    if is_active is not None:
        query = query.where(DriverModel.is_active == is_active)

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    stmt = query.order_by(DriverModel.name).offset(offset).limit(limit)
    items = list((await db.execute(stmt)).scalars().all())

    return DriverListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/{driver_id}",
    response_model=DriverResponse,
    summary="Get driver detail",
)
async def get_driver(
    driver_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(DriverModel).where(DriverModel.ID == driver_id, DriverModel.IsActive.is_(True))
    driver = (await db.execute(stmt)).scalars().first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver '{driver_id}' not found.",
        )
    return driver


@router.post(
    "/{driver_id}/assign/{trip_id}",
    response_model=DriverAssignResponse,
    summary="Assign a driver to a trip",
    description=(
        "Links a driver_id to a trip's run sheet. "
        "Validates driver is active and not already assigned to 2 trips today. "
        "Role: DISPATCHER+"
    ),
)
async def assign_driver_to_trip(
    driver_id: str = Path(...),
    trip_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    # 1. Fetch driver
    driver_stmt = select(DriverModel).where(DriverModel.ID == driver_id, DriverModel.IsActive.is_(True))
    driver = (await db.execute(driver_stmt)).scalars().first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver '{driver_id}' not found.",
        )
    if not driver.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver '{driver.name}' ({driver_id}) is marked inactive.",
        )

    # 2. Fetch trip
    trip_stmt = select(LiveTripModel).where(
        or_(LiveTripModel.trip_id == trip_id, LiveTripModel.ID == trip_id),
        LiveTripModel.IsActive.is_(True),
    )
    trip = (await db.execute(trip_stmt)).scalars().first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip '{trip_id}' not found.",
        )

    # 3. Check daily limit (max 2 trips per driver per operating day)
    today = trip.trip_date or datetime.date.today().isoformat()
    active_trips_stmt = select(func.count()).select_from(
        select(LiveTripModel)
        .where(
            LiveTripModel.driver_id == driver_id,
            LiveTripModel.trip_date == today,
            LiveTripModel.trip_id != trip.trip_id,
            LiveTripModel.live_status != "cancelled",
            LiveTripModel.IsActive.is_(True),
        )
        .subquery()
    )
    driver_day_trips = (await db.execute(active_trips_stmt)).scalar_one()
    if driver_day_trips >= 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Driver limit exceeded: driver '{driver.name}' already has {driver_day_trips}/2 "
                f"trips assigned on {today}."
            ),
        )

    # 4. Assign driver to trip
    prev_driver = trip.driver_id
    trip.driver_id = driver_id
    trip.UpdateTime = datetime.datetime.utcnow()

    audit = DispatchAuditLogModel(
        ID=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        actor="DISPATCHER",
        action="DRIVER_ASSIGNED",
        trip_id=trip.trip_id,
        vehicle_id=trip.vehicle_id,
        driver_id=driver_id,
        details=f"Assigned driver {driver.name} ({driver_id}) to trip {trip.trip_id}. Previous driver: {prev_driver}",
    )
    db.add(audit)
    await db.flush()

    return DriverAssignResponse(
        driver_id=driver_id,
        trip_id=trip.trip_id,
        assigned=True,
        message=f"Driver '{driver.name}' successfully assigned to trip '{trip.trip_id}'.",
    )


@router.post(
    "/{driver_id}/checkin",
    response_model=DriverResponse,
    summary="Record driver check-in at depot",
    description=(
        "Records driver arrival at depot before starting trips. Sets driver status to checked-in. Role: DRIVER+"
    ),
)
async def driver_checkin(
    driver_id: str = Path(...),
    payload: DriverCheckinRequest = ...,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(DriverModel).where(DriverModel.ID == driver_id, DriverModel.IsActive.is_(True))
    driver = (await db.execute(stmt)).scalars().first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver '{driver_id}' not found.",
        )

    driver.checked_in = True
    driver.last_checkin_time = payload.checkin_time
    driver.checkin_depot = payload.depot
    driver.UpdateTime = datetime.datetime.utcnow()

    audit = DispatchAuditLogModel(
        ID=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        actor=driver_id,
        action="DRIVER_CHECKIN",
        driver_id=driver_id,
        details=f"Driver checked in at {payload.depot} at {payload.checkin_time}",
    )
    db.add(audit)
    await db.flush()

    return driver
