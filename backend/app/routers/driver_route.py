import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.entities.trip import DiscrepancyReport, Trip
from app.entities.staff_profile import StaffProfile
from app.entities.user import User
from app.guards import require_driver
from app.services.trip_views import TripContext, iso, load_contexts

router = APIRouter(prefix="/driver", tags=["driver"])

SessionDep = Annotated[AsyncSession, Depends(get_async_session)]
DriverDep = Annotated[User, Depends(require_driver)]

ACTIVE_TRIP_STATUSES = ("dispatched", "in_transit")


def _waypoints(ctx: TripContext, flagged: set[Any]) -> list[dict[str, Any]]:
    waypoints = []
    has_zero_seq = any(leg.seq == 0 for leg in ctx.legs)
    for idx, leg in enumerate(ctx.legs, start=1):
        seq = (leg.seq + 1) if has_zero_seq else (leg.seq if leg.seq and leg.seq > 0 else idx)
        outlet = ctx.outlets[leg.to_outlet_id]
        order = ctx.orders.get(leg.order_id) if leg.order_id else None
        items = ctx.items.get(leg.order_id, []) if leg.order_id else []
        item_rows = []
        for item in items:
            catalog = ctx.catalog[item.item_id]
            item_status = "discrepancy" if item.id in flagged else "delivered" if item.delivered_qty else "pending"
            item_rows.append(
                {
                    "id": str(item.id),
                    "order_id": str(item.order_id),
                    "order_ref": order.order_ref if order else "",
                    "package_code": item.package_code,
                    "sku": catalog.sku,
                    "item_title": catalog.name,
                    "category": catalog.category,
                    "crate_count": item.requested_qty,
                    "weight_kg": round(item.requested_qty * item.unit_weight_kg, 2),
                    "volume_m3": round(item.requested_qty * item.unit_volume_m3, 3),
                    "special_handling_code": item.special_handling_code,
                    "status": item_status,
                }
            )
        waypoints.append(
            {
                "id": str(leg.id),
                "route_leg_id": str(leg.id),
                "seq": seq,
                "outlet_id": str(outlet.id),
                "outlet_name": outlet.name,
                "address": outlet.name,
                "lat": outlet.latitude or 0.0,
                "lng": outlet.longitude or 0.0,
                "contact_name": outlet.name,
                "contact_number": outlet.contact_phone or "",
                "access_constraints": getattr(outlet.parking_constraint, "value", outlet.parking_constraint),
                "dock_type": getattr(outlet.dock_type, "value", outlet.dock_type),
                "delivery_window": f"{outlet.window_open_time:%H:%M}-{outlet.window_close_time:%H:%M}",
                "status": "pending" if leg.status in ("in_transit", "newly_added") else leg.status,
                "arrived_at": iso(leg.arrival_time),
                "completed_at": iso(leg.leave_outlet_time),
                "order_summary": {
                    "order_id": str(order.id) if order else "",
                    "order_ref": order.order_ref if order else "",
                    "total_weight_kg": round(sum(i["weight_kg"] for i in item_rows), 2),
                    "total_crate_count": sum(i["crate_count"] for i in item_rows),
                    "items": item_rows,
                },
            }
        )
    return waypoints


@router.get("/trips")
async def list_driver_trips(session: SessionDep, user: DriverDep):
    staff = (await session.execute(select(StaffProfile).where(StaffProfile.user_id == user.id))).scalar_one_or_none()

    query = select(Trip).order_by(Trip.dispatch_date.desc(), Trip.trip_sequence)
    if staff:
        trips = list((await session.execute(query.where(Trip.driver_id == staff.id))).scalars().all())
        if not trips:
            trips = list((await session.execute(query.limit(20))).scalars().all())
    else:
        trips = list((await session.execute(query.limit(20))).scalars().all())

    contexts = await load_contexts(session, trips)
    results = []
    for ctx in contexts:
        t = ctx.trip
        v = ctx.vehicle
        d = ctx.driver
        dep = ctx.depot
        driver_name = (
            f"{d.first_name} {d.last_name}".strip()
            if d
            else (f"{staff.first_name} {staff.last_name}".strip() if staff else "Driver")
        )
        results.append(
            {
                "id": str(t.id),
                "trip_code": t.trip_code,
                "driver_id": str(t.driver_id),
                "driver_name": driver_name,
                "date": t.dispatch_date.isoformat(),
                "status": t.status,
                "vehicle_id": str(v.id),
                "reg_number": v.reg_number,
                "model_name": v.model_name,
                "depot_name": dep.name,
                "total_weight_kg": ctx.weight_kg,
                "total_volume_m3": ctx.volume_m3,
                "total_stops": len(ctx.legs),
                "is_downloaded": True,
            }
        )
    return results


@router.post("/trips/{trip_id}/activate")
async def activate_trip(trip_id: uuid.UUID, session: SessionDep, user: DriverDep):
    trip = await session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TRIP_NOT_FOUND")
    staff = (await session.execute(select(StaffProfile).where(StaffProfile.user_id == user.id))).scalar_one_or_none()
    if staff:
        trip.driver_id = staff.id
    trip.status = "in_transit"
    await session.commit()
    return {"success": True, "trip_id": str(trip.id), "status": trip.status}


@router.get("/routes/current")
async def current_route(session: SessionDep, user: DriverDep, trip_id: uuid.UUID | None = None):
    staff = (await session.execute(select(StaffProfile).where(StaffProfile.user_id == user.id))).scalar_one_or_none()

    trip: Trip | None = None

    if trip_id:
        trip = (await session.execute(select(Trip).where(Trip.id == trip_id))).scalar_one_or_none()

    if trip is None and staff:
        # 1. Try active trip for this driver
        trip = (
            await session.execute(
                select(Trip)
                .where(Trip.driver_id == staff.id, Trip.status.in_(ACTIVE_TRIP_STATUSES))
                .order_by(Trip.dispatch_date.desc(), Trip.trip_sequence)
                .limit(1)
            )
        ).scalar_one_or_none()

        # 2. Try any latest trip for this driver
        if trip is None:
            trip = (
                await session.execute(
                    select(Trip)
                    .where(Trip.driver_id == staff.id)
                    .order_by(Trip.dispatch_date.desc(), Trip.trip_sequence)
                    .limit(1)
                )
            ).scalar_one_or_none()

    # 3. Fallback to any latest active or recent trip in system
    if trip is None:
        trip = (
            await session.execute(select(Trip).order_by(Trip.dispatch_date.desc(), Trip.trip_sequence).limit(1))
        ).scalar_one_or_none()

    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NO_TRIP_AVAILABLE")

    ctx = (await load_contexts(session, [trip]))[0]
    flagged = set(
        (await session.execute(select(DiscrepancyReport.order_item_id).where(DiscrepancyReport.trip_id == trip.id)))
        .scalars()
        .all()
    )
    waypoints = _waypoints(ctx, flagged)
    open_seq = [w["seq"] for w in waypoints if w["status"] in ("pending", "arrived")]
    vehicle, depot, d = ctx.vehicle, ctx.depot, ctx.driver
    driver_name = (
        f"{d.first_name} {d.last_name}".strip()
        if d
        else (f"{staff.first_name} {staff.last_name}".strip() if staff else "Driver")
    )
    driver_phone = d.phone if d else (staff.phone if staff else "")
    driver_license = d.license_number if d else (staff.license_number if staff else "")
    driver_id = str(d.id) if d else (str(staff.id) if staff else "")

    return {
        "trip": {
            "id": str(trip.id),
            "trip_code": trip.trip_code,
            "status": trip.status,
            "dispatch_date": trip.dispatch_date.isoformat(),
            "seal_number": trip.seal_number,
            "vehicle": {
                "id": str(vehicle.id),
                "reg_number": vehicle.reg_number,
                "model_name": vehicle.model_name,
                "type": vehicle.type,
                "temp": vehicle.temp,
                "weight_cap_kg": vehicle.weight_cap_kg,
                "volume_cap_m3": vehicle.volume_cap_m3,
                "fuel_type": vehicle.fuel_type,
                "km_per_l": vehicle.km_per_l,
                "weekly_fuel_quota_l": vehicle.weekly_fuel_quota_l,
                "fuel_remaining_l": max(0.0, vehicle.weekly_fuel_quota_l - vehicle.consumed_fuel_l),
            },
            "depot": {
                "id": str(depot.id),
                "code": depot.code,
                "name": depot.name,
                "lat": depot.latitude,
                "lng": depot.longitude,
            },
            "driver": {
                "id": driver_id,
                "name": driver_name,
                "phone": driver_phone,
                "license_id": driver_license,
                "designation": "Driver",
            },
        },
        "waypoints": waypoints,
        "active_waypoint_seq": open_seq[0] if open_seq else (waypoints[-1]["seq"] if waypoints else 1),
    }
