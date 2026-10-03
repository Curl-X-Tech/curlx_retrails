"""Router: /vehicles/{id}/quota and /vehicles/{id}/daily — fuel quota and daily trip reset endpoints."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.vehicle import VehicleModel
from app.schemas.vehicle_schemas import MileageUpdate, QuotaResponse, VehicleResponse

router = APIRouter(prefix="/vehicles", tags=["Vehicle Quota"])


@router.get(
    "/{vehicle_id}/quota",
    response_model=QuotaResponse,
    summary="Get vehicle fuel quota state",
    description=(
        "Returns service_milage, max_weekly_range_km, remaining_range_km, "
        "trip_count_today, trips_remaining_today. Role: DISPATCHER+"
    ),
)
async def get_vehicle_quota(
    vehicle_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await db.get(VehicleModel, vehicle_id)
    if not vehicle or not vehicle.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found.",
        )

    max_range = round(vehicle.km_per_l * vehicle.weekly_fuel_quota, 2)
    rem_range = round(max(0.0, max_range - vehicle.service_milage), 2)
    trips_rem = max(0, vehicle.max_per_day_trip_count - vehicle.trip_count_today)

    return QuotaResponse(
        vehicle_id=vehicle.ID,
        service_milage=round(vehicle.service_milage, 2),
        max_weekly_range_km=max_range,
        remaining_range_km=rem_range,
        trip_count_today=vehicle.trip_count_today,
        trips_remaining_today=trips_rem,
    )


@router.patch(
    "/{vehicle_id}/quota/mileage",
    response_model=VehicleResponse,
    summary="Manual mileage correction",
    description=(
        "Authorized correction of service_milage. "
        "Requires correction_note for audit trail. "
        "Emits fleet.vehicle_updated. Role: DEPOT_MANAGER+"
    ),
)
async def correct_mileage(
    vehicle_id: str = Path(...),
    payload: MileageUpdate = ...,
    db: AsyncSession = Depends(get_db),
):
    vehicle = await db.get(VehicleModel, vehicle_id)
    if not vehicle or not vehicle.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found.",
        )

    vehicle.service_milage = payload.service_milage
    vehicle.UpdateTime = datetime.utcnow()
    vehicle.UpdatedBy = f"DEPOT_MANAGER ({payload.correction_note})"

    await db.flush()
    await db.refresh(vehicle)
    return vehicle


@router.post(
    "/{vehicle_id}/quota/reset-weekly",
    response_model=VehicleResponse,
    summary="Reset weekly fuel quota",
    description=(
        "Resets service_milage=0 at ISO week rollover. Should be triggered by a scheduled job. Role: SUPERADMIN"
    ),
)
async def reset_weekly_quota(
    vehicle_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await db.get(VehicleModel, vehicle_id)
    if not vehicle or not vehicle.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found.",
        )

    vehicle.service_milage = 0.0
    vehicle.UpdateTime = datetime.utcnow()
    vehicle.UpdatedBy = "SYSTEM_WEEKLY_RESET"

    await db.flush()
    await db.refresh(vehicle)
    return vehicle


@router.post(
    "/{vehicle_id}/daily/reset",
    response_model=VehicleResponse,
    summary="Reset daily trip count",
    description=(
        "Resets trip_count_today=0 at the start of each operating day. "
        "Should be triggered by a scheduled job. Role: DEPOT_MANAGER+"
    ),
)
async def reset_daily_count(
    vehicle_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await db.get(VehicleModel, vehicle_id)
    if not vehicle or not vehicle.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found.",
        )

    vehicle.trip_count_today = 0
    vehicle.UpdateTime = datetime.utcnow()
    vehicle.UpdatedBy = "SYSTEM_DAILY_RESET"

    await db.flush()
    await db.refresh(vehicle)
    return vehicle
