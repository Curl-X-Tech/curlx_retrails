"""Router: /vehicles — CRUD for Vehicle entities."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.vehicle import VehicleModel
from app.schemas.vehicle_schemas import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
    VehicleListResponse,
    VehicleType,
    TempCondition,
    Depot,
)

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])
endpoint_router = APIRouter(prefix="/fleet/vehicles", tags=["Vehicles"])


@endpoint_router.post("")
@router.post(
    "",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new vehicle",
    description="Adds a vehicle to the fleet registry. Role: SUPERADMIN",
)
async def create_vehicle(
    payload: VehicleCreate,
    db: AsyncSession = Depends(get_db),
):
    import uuid

    vehicle_id = f"VEH-{uuid.uuid4().hex[:6].upper()}"

    vehicle = VehicleModel(
        ID=vehicle_id,
        CreateTime=datetime.utcnow(),
        UpdateTime=datetime.utcnow(),
        CreatedBy="SUPERADMIN",
        UpdatedBy="SUPERADMIN",
        IsActive=True,
        type=payload.type.value,
        temp_condition=payload.temp_condition.value,
        weight_cap_kg=payload.weight_cap_kg,
        volume_cap_m3=payload.volume_cap_m3,
        fuel_type=payload.fuel_type,
        km_per_l=payload.km_per_l,
        weekly_fuel_quota=payload.weekly_fuel_quota,
        depot=payload.depot.value,
        service_milage=payload.service_milage,
        trip_count_today=0,
        max_per_day_trip_count=2,
    )
    db.add(vehicle)
    await db.flush()
    await db.refresh(vehicle)
    return vehicle


@endpoint_router.get("")
@router.get(
    "",
    response_model=VehicleListResponse,
    summary="List vehicles with filters",
    description="Returns paginated vehicles. All filters optional. Role: DISPATCHER+",
)
async def list_vehicles(
    depot: Depot | None = Query(default=None),
    vehicle_type: VehicleType | None = Query(default=None, alias="type"),
    temp_condition: TempCondition | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(VehicleModel)
    if is_active is not None:
        query = query.where(VehicleModel.IsActive == is_active)
    else:
        query = query.where(VehicleModel.IsActive.is_(True))

    if depot:
        query = query.where(VehicleModel.depot == depot.value)
    if vehicle_type:
        query = query.where(VehicleModel.type == vehicle_type.value)
    if temp_condition:
        query = query.where(VehicleModel.temp_condition == temp_condition.value)

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    items = list((await db.execute(query.order_by(VehicleModel.ID).offset(offset).limit(limit))).scalars().all())

    return VehicleListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@endpoint_router.get("/{id}")
@router.get(
    "/{id}",
    response_model=VehicleResponse,
    summary="Get vehicle by ID",
)
async def get_vehicle(
    id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await db.get(VehicleModel, id)
    if not vehicle or not vehicle.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{id}' not found.",
        )
    return vehicle


@endpoint_router.patch("/{id}")
@router.patch(
    "/{id}",
    response_model=VehicleResponse,
    summary="Update mutable vehicle specs",
    description="Allowed: weight_cap_kg, volume_cap_m3, km_per_l, weekly_fuel_quota. Role: DEPOT_MANAGER+",
)
async def update_vehicle(
    id: str = Path(...),
    payload: VehicleUpdate = ...,
    db: AsyncSession = Depends(get_db),
):
    vehicle = await db.get(VehicleModel, id)
    if not vehicle or not vehicle.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{id}' not found.",
        )

    if payload.weight_cap_kg is not None:
        vehicle.weight_cap_kg = payload.weight_cap_kg
    if payload.volume_cap_m3 is not None:
        vehicle.volume_cap_m3 = payload.volume_cap_m3
    if payload.km_per_l is not None:
        vehicle.km_per_l = payload.km_per_l
    if payload.weekly_fuel_quota is not None:
        vehicle.weekly_fuel_quota = payload.weekly_fuel_quota

    vehicle.UpdateTime = datetime.utcnow()
    vehicle.UpdatedBy = "DEPOT_MANAGER"

    await db.flush()
    await db.refresh(vehicle)
    return vehicle


@router.delete(
    "/{vehicle_id}",
    status_code=status.HTTP_200_OK,
    summary="Retire a vehicle",
    description="Soft-delete: sets IsActive=false. Role: SUPERADMIN",
)
async def delete_vehicle(
    vehicle_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await db.get(VehicleModel, vehicle_id)
    if not vehicle or not vehicle.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found.",
        )

    vehicle.IsActive = False
    vehicle.UpdateTime = datetime.utcnow()
    vehicle.UpdatedBy = "SUPERADMIN"
    await db.flush()

    return {"id": vehicle_id, "deleted": True, "message": f"Vehicle '{vehicle_id}' retired (IsActive=false)."}
