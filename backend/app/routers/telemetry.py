import uuid
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.core.timezone import utc_now
from app.entities.trip import RouteLeg, Trip, VehicleTelemetry
from app.entities.user import User
from app.entities.vehicle import Vehicle
from app.guards import require_authenticated_user, require_dispatcher, require_driver
from app.services.deliveries import as_utc
from app.services.trip_views import iso, load_contexts, pct

router = APIRouter(prefix="/fleet", tags=["telemetry"])

SessionDep = Annotated[AsyncSession, Depends(get_async_session)]
UserDep = Annotated[User, Depends(require_authenticated_user)]
DriverDep = Annotated[User, Depends(require_driver)]
DispatcherDep = Annotated[User, Depends(require_dispatcher)]


class TelemetryReport(BaseModel):
    vehicle_id: uuid.UUID
    trip_id: uuid.UUID | None = None
    latitude: float
    longitude: float
    speed_kmh: float = 0.0
    heading_deg: float = 0.0
    reefer_temp_celsius: float | None = None
    ambient_temp_celsius: float | None = None
    fuel_level_pct: float | None = None
    battery_pct: float | None = None
    recorded_at: str | None = None


def telemetry_read(row: VehicleTelemetry) -> dict[str, Any]:
    return {
        "vehicle_id": str(row.vehicle_id),
        "trip_id": str(row.trip_id) if row.trip_id else None,
        "latitude": row.latitude,
        "longitude": row.longitude,
        "speed_kmh": row.speed_kmh,
        "heading_deg": row.heading_deg,
        "reefer_temp_celsius": row.reefer_temp_celsius,
        "ambient_temp_celsius": row.ambient_temp_celsius,
        "fuel_level_pct": row.fuel_level_pct,
        "battery_pct": row.battery_pct,
        "recorded_at": iso(row.recorded_at),
    }


def build_telemetry(report: TelemetryReport) -> VehicleTelemetry:
    recorded = (
        as_utc(datetime.fromisoformat(report.recorded_at.replace("Z", "+00:00"))) if report.recorded_at else utc_now()
    )
    return VehicleTelemetry(
        name="telemetry",
        recorded_at=recorded,
        **report.model_dump(exclude={"recorded_at"}),
    )


async def latest_for(session: AsyncSession, vehicle_id: uuid.UUID) -> VehicleTelemetry | None:
    return (
        await session.execute(
            select(VehicleTelemetry)
            .where(VehicleTelemetry.vehicle_id == vehicle_id)
            .order_by(VehicleTelemetry.recorded_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()


@router.post("/telemetry/report", status_code=status.HTTP_201_CREATED)
async def report_telemetry(payload: TelemetryReport | list[TelemetryReport], session: SessionDep, _: DriverDep):
    reports = payload if isinstance(payload, list) else [payload]
    for report in reports:
        session.add(build_telemetry(report))
    await session.commit()
    return {"success": True, "accepted": len(reports)}


@router.get("/telemetry/live")
async def live_telemetry(session: SessionDep, _: DispatcherDep):
    trips = list(
        (await session.execute(select(Trip).where(Trip.status.in_(("dispatched", "in_transit"))))).scalars().all()
    )
    result = []
    for ctx in await load_contexts(session, trips):
        row = await latest_for(session, ctx.vehicle.id)
        if row is None:
            continue
        pending = [leg for leg in ctx.legs if leg.status in ("pending", "in_transit", "arrived", "newly_added")]
        at_stop = any(leg.status == "arrived" for leg in ctx.legs)
        next_leg: RouteLeg | None = pending[0] if pending else None
        vehicle = ctx.vehicle
        result.append(
            {
                **telemetry_read(row),
                "status": "at_stop" if at_stop else "en_route",
                "reg_number": vehicle.reg_number,
                "model_name": vehicle.model_name,
                "vehicle_type": vehicle.model_name,
                "vehicle_category": vehicle.type,
                "temp": vehicle.temp,
                "brand": ctx.brand.name,
                "depot": ctx.depot.name,
                "image_url": (
                    "/vehicle-images/van.png"
                    if vehicle.type == "van"
                    else ("/vehicle-images/freeze.png" if vehicle.temp == "reefer" else "/vehicle-images/dry.png")
                ),
                "driver_name": ctx.driver.name if ctx.driver else "",
                "driver_phone": ctx.driver.phone if ctx.driver else "",
                "weight_percentage": pct(ctx.weight_kg, vehicle.weight_cap_kg),
                "weight_kg": ctx.weight_kg,
                "max_weight_kg": vehicle.weight_cap_kg,
                "volume_percentage": pct(ctx.volume_m3, vehicle.volume_cap_m3),
                "volume_cbm": ctx.volume_m3,
                "max_volume_cbm": vehicle.volume_cap_m3,
                "crates_count": ctx.packages,
                "next_stop": ctx.outlets[next_leg.to_outlet_id].name if next_leg else "",
                "next_stop_eta": next_leg.planned_arrival_time.strftime("%H:%M") if next_leg else "",
                "stops_total": len(ctx.legs),
                "stops_completed": sum(leg.status == "completed" for leg in ctx.legs),
            }
        )
    return result


@router.get("/vehicles/{vehicle_id}/telemetry/latest")
async def vehicle_latest(vehicle_id: uuid.UUID, session: SessionDep, _: UserDep):
    row = await latest_for(session, vehicle_id)
    if row is None:
        vehicle = await session.get(Vehicle, vehicle_id)
        if vehicle is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VEHICLE_NOT_FOUND")
        return {
            "vehicle_id": str(vehicle.id),
            "trip_id": None,
            "latitude": 6.9319,
            "longitude": 79.8478,
            "speed_kmh": 0.0,
            "heading_deg": 0.0,
            "reefer_temp_celsius": -18.2 if vehicle.temp == "reefer" else None,
            "ambient_temp_celsius": 28.5,
            "fuel_level_pct": 85.0,
            "battery_pct": 100.0,
            "recorded_at": iso(utc_now()),
        }
    return telemetry_read(row)
