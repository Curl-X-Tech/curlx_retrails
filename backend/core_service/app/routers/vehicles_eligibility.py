"""Router: /vehicles/eligibility and /vehicles/eligible — constraint checking endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.vehicle import VehicleModel
from app.schemas.vehicle_schemas import (
    EligibilityRequest,
    EligibilityResponse,
    VehicleListResponse,
    VehicleType,
    TempCondition,
    ParkingConstraint,
    Depot,
)

router = APIRouter(prefix="/vehicles", tags=["Vehicle Eligibility"])


def _check_vehicle_eligibility(
    vehicle: VehicleModel,
    depot: str,
    parking_constraint: str,
    temp_requirement: str,
    round_trip_km: float,
) -> tuple[bool, str]:
    # 1. Depot match
    if vehicle.depot != depot:
        return False, f"wrong depot ({vehicle.depot} ≠ {depot})"

    # 2. Parking constraint
    if parking_constraint == "van_only" and vehicle.type != "van":
        return False, f"parking_constraint={parking_constraint} requires van"

    # 3. Temperature capability
    if vehicle.temp_condition != "reefer" and temp_requirement != "ambient":
        return False, f"temp={vehicle.temp_condition} cannot carry {temp_requirement}"

    # 4. Daily trip limit
    if vehicle.trip_count_today >= vehicle.max_per_day_trip_count:
        return False, "daily trip limit reached"

    # 5. Weekly fuel quota
    max_range = vehicle.km_per_l * vehicle.weekly_fuel_quota
    if vehicle.service_milage + round_trip_km > max_range:
        return False, f"fuel exhausted ({vehicle.service_milage:.1f}+{round_trip_km:.1f} > {max_range:.1f} km)"

    return True, "ok"


@router.post(
    "/{vehicle_id}/eligibility",
    response_model=EligibilityResponse,
    summary="Check vehicle eligibility for a trip spec",
    description=(
        "Runs all 5 hard constraints: depot match, parking access, temp capability, "
        "daily trip limit, fuel quota. "
        "Mirrors Vehicle.is_eligible_for(). Role: DISPATCHER+"
    ),
)
async def check_eligibility(
    vehicle_id: str = Path(...),
    payload: EligibilityRequest = ...,
    db: AsyncSession = Depends(get_db),
):
    vehicle = await db.get(VehicleModel, vehicle_id)
    if not vehicle or not vehicle.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{vehicle_id}' not found.",
        )

    eligible, reason = _check_vehicle_eligibility(
        vehicle,
        payload.depot.value,
        payload.parking_constraint.value,
        payload.temp_requirement,
        payload.round_trip_km,
    )

    return EligibilityResponse(eligible=eligible, reason=reason)


@router.get(
    "/eligible",
    response_model=VehicleListResponse,
    summary="Find eligible vehicles for a trip spec",
    description=(
        "Returns all vehicles passing all constraints for the given filters. "
        "Used by Planning Engine to find candidate vehicles. Role: DISPATCHER+"
    ),
)
async def find_eligible_vehicles(
    depot: Depot = Query(...),
    vehicle_type: VehicleType | None = Query(default=None),
    temp_condition: TempCondition | None = Query(default=None),
    parking_constraint: ParkingConstraint | None = Query(default=None),
    min_remaining_range_km: float | None = Query(default=None, description="Min remaining km required"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(VehicleModel).where(
        VehicleModel.depot == depot.value,
        VehicleModel.IsActive.is_(True),
        VehicleModel.trip_count_today < VehicleModel.max_per_day_trip_count,
    )

    if vehicle_type:
        query = query.where(VehicleModel.type == vehicle_type.value)
    if temp_condition:
        query = query.where(VehicleModel.temp_condition == temp_condition.value)
    if parking_constraint and parking_constraint.value == "van_only":
        query = query.where(VehicleModel.type == "van")

    all_candidates = list((await db.execute(query.order_by(VehicleModel.ID))).scalars().all())

    # Filter by remaining range if specified
    filtered = []
    for v in all_candidates:
        max_range = v.km_per_l * v.weekly_fuel_quota
        rem_range = max(0.0, max_range - v.service_milage)
        if min_remaining_range_km is not None and rem_range < min_remaining_range_km:
            continue
        filtered.append(v)

    total = len(filtered)
    offset = (page - 1) * limit
    items = filtered[offset : offset + limit]

    return VehicleListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )
