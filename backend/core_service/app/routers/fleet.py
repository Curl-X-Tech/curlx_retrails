import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.core.timezone import utc_now
from app.core.users import current_active_user
from app.entities.depot import Depot
from app.entities.staff_profile import StaffProfile
from app.entities.user import User
from app.entities.vehicle import Vehicle
from app.guards import require_dispatcher
from app.schemas.fleet import (
    DriverRead,
    VehicleCreate,
    VehicleRead,
    VehicleStatus,
    VehicleTemp,
    VehicleType,
    VehicleUpdate,
)

router = APIRouter(prefix="/fleet", tags=["fleet"])

SessionDep = Annotated[AsyncSession, Depends(get_async_session)]
AuthDep = Annotated[User, Depends(current_active_user)]
DispatcherDep = Annotated[User, Depends(require_dispatcher)]

VEHICLE_FIELD_MAP = {"assigned_depot_id": "depot_id"}


async def _require_depot(session: AsyncSession, depot_id: uuid.UUID) -> None:
    if await session.get(Depot, depot_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DEPOT_NOT_FOUND")


async def _require_driver(session: AsyncSession, driver_id: uuid.UUID) -> None:
    driver = await session.get(StaffProfile, driver_id)
    if driver is None or driver.role != "driver":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DRIVER_NOT_FOUND")


async def _next_vehicle_id(session: AsyncSession) -> str:
    total = (await session.execute(select(func.count()).select_from(Vehicle))).scalar_one()
    existing = set((await session.execute(select(Vehicle.vehicle_id))).scalars())
    number = total + 1
    while f"VEH{number:03d}" in existing:
        number += 1
    return f"VEH{number:03d}"


@router.get("/vehicles", response_model=list[VehicleRead], summary="List vehicles")
async def list_vehicles(
    _user: AuthDep,
    session: SessionDep,
    depot_id: uuid.UUID | None = None,
    type: Annotated[VehicleType | None, Query()] = None,
    temp: VehicleTemp | None = None,
    vehicle_status: Annotated[VehicleStatus | None, Query(alias="status")] = None,
    is_active: bool | None = None,
) -> list[Vehicle]:
    query = select(Vehicle).order_by(Vehicle.vehicle_id.asc())
    if depot_id:
        query = query.where(Vehicle.depot_id == depot_id)
    if type:
        query = query.where(Vehicle.type == type)
    if temp:
        query = query.where(Vehicle.temp == temp)
    if vehicle_status:
        query = query.where(Vehicle.status == vehicle_status)
    if is_active is not None:
        query = query.where(Vehicle.is_active == is_active)
    return list((await session.execute(query)).scalars().all())


@router.get("/vehicles/{id}", response_model=VehicleRead, summary="Get a vehicle")
async def get_vehicle(id: str, _user: AuthDep, session: SessionDep) -> Vehicle:
    try:
        vehicle = await session.get(Vehicle, uuid.UUID(id))
    except ValueError:
        vehicle = (await session.execute(select(Vehicle).where(Vehicle.vehicle_id == id))).scalar_one_or_none()
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VEHICLE_NOT_FOUND")
    return vehicle


@router.post("/vehicles", response_model=VehicleRead, status_code=status.HTTP_201_CREATED, summary="Register a vehicle")
async def create_vehicle(payload: VehicleCreate, user: DispatcherDep, session: SessionDep) -> Vehicle:
    await _require_depot(session, payload.assigned_depot_id)
    if payload.assigned_driver_id:
        await _require_driver(session, payload.assigned_driver_id)
    data = payload.model_dump(exclude={"assigned_depot_id", "vehicle_id"})
    vehicle = Vehicle(
        **data,
        depot_id=payload.assigned_depot_id,
        vehicle_id=payload.vehicle_id or await _next_vehicle_id(session),
        name=payload.reg_number,
        created_by=user.id,
        updated_by=user.id,
    )
    session.add(vehicle)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="VEHICLE_ALREADY_EXISTS")
    await session.refresh(vehicle)
    return vehicle


@router.patch("/vehicles/{id}", response_model=VehicleRead, summary="Update a vehicle")
async def update_vehicle(id: uuid.UUID, payload: VehicleUpdate, user: DispatcherDep, session: SessionDep) -> Vehicle:
    vehicle = await session.get(Vehicle, id)
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VEHICLE_NOT_FOUND")
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("assigned_depot_id"):
        await _require_depot(session, changes["assigned_depot_id"])
    if changes.get("assigned_driver_id"):
        await _require_driver(session, changes["assigned_driver_id"])
    for field, value in changes.items():
        if value is None and field not in ("assigned_driver_id",):
            continue
        setattr(vehicle, VEHICLE_FIELD_MAP.get(field, field), value)
    vehicle.updated_by = user.id
    vehicle.updated_at = utc_now()
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="VEHICLE_ALREADY_EXISTS")
    await session.refresh(vehicle)
    return vehicle


@router.get("/drivers", response_model=list[DriverRead], summary="List drivers")
async def list_drivers(
    _user: AuthDep,
    session: SessionDep,
    depot_id: uuid.UUID | None = None,
    is_active: bool | None = None,
) -> list[StaffProfile]:
    query = select(StaffProfile).where(StaffProfile.role == "driver").order_by(StaffProfile.employee_code.asc())
    if depot_id:
        query = query.where(StaffProfile.depot_id == depot_id)
    if is_active is not None:
        query = query.where(StaffProfile.is_active == is_active)
    return list((await session.execute(query)).scalars().all())
