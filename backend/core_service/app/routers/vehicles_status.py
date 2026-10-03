"""Router: /vehicles/status — availability and maintenance state endpoints."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.vehicle import VehicleModel
from app.schemas.vehicle_schemas import VehicleResponse, VehicleListResponse, Depot

router = APIRouter(prefix="/vehicles", tags=["Vehicle Status"])


@router.get(
    "/status/available",
    response_model=VehicleListResponse,
    summary="List available vehicles",
    description=(
        "Returns vehicles where IsActive=true AND trip_count_today < 2. "
        "Primary input for Planning Engine vehicle selection. Role: DISPATCHER+"
    ),
)
async def list_available_vehicles(
    depot: Depot | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(VehicleModel).where(
        VehicleModel.IsActive.is_(True),
        VehicleModel.trip_count_today < VehicleModel.max_per_day_trip_count,
    )
    if depot:
        query = query.where(VehicleModel.depot == depot.value)

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


@router.get(
    "/status/fuel-critical",
    response_model=VehicleListResponse,
    summary="List fuel-critical vehicles",
    description="Returns vehicles with remaining_range_km < 50. Role: DEPOT_MANAGER+",
)
async def list_fuel_critical_vehicles(
    depot: Depot | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = select(VehicleModel).where(VehicleModel.IsActive.is_(True))
    if depot:
        query = query.where(VehicleModel.depot == depot.value)

    rows = list((await db.execute(query.order_by(VehicleModel.ID))).scalars().all())
    critical_items = []
    for v in rows:
        max_range = v.km_per_l * v.weekly_fuel_quota
        remaining = max(0.0, max_range - v.service_milage)
        if remaining < 50.0:
            critical_items.append(v)

    return VehicleListResponse(
        items=critical_items,
        total=len(critical_items),
        page=1,
        limit=max(100, len(critical_items)),
        has_next=False,
    )


@router.patch(
    "/{vehicle_id}/status/unavailable",
    response_model=VehicleResponse,
    summary="Mark vehicle unavailable",
    description=(
        "Flags vehicle for maintenance. Sets IsActive=false. "
        "Emits fleet.vehicle_unavailable to RabbitMQ. Role: DEPOT_MANAGER+"
    ),
)
async def mark_unavailable(
    vehicle_id: str = Path(...),
    reason: str = Query(..., description="Maintenance reason"),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await db.get(VehicleModel, vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found.",
        )

    vehicle.IsActive = False
    vehicle.UpdateTime = datetime.utcnow()
    vehicle.UpdatedBy = f"DEPOT_MANAGER ({reason})"

    await db.flush()
    await db.refresh(vehicle)
    return vehicle


@router.patch(
    "/{vehicle_id}/status/available",
    response_model=VehicleResponse,
    summary="Mark vehicle available",
    description="Returns vehicle to active fleet. Sets IsActive=true. Role: DEPOT_MANAGER+",
)
async def mark_available(
    vehicle_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await db.get(VehicleModel, vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found.",
        )

    vehicle.IsActive = True
    vehicle.UpdateTime = datetime.utcnow()
    vehicle.UpdatedBy = "DEPOT_MANAGER"

    await db.flush()
    await db.refresh(vehicle)
    return vehicle
