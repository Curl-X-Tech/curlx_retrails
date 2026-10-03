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
    for leg in ctx.legs:
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
                "seq": leg.seq,
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


@router.get("/routes/current")
async def current_route(session: SessionDep, user: DriverDep):
    staff = (await session.execute(select(StaffProfile).where(StaffProfile.user_id == user.id))).scalar_one_or_none()
    if staff is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DRIVER_PROFILE_NOT_FOUND")
    trip = (
        await session.execute(
            select(Trip)
            .where(Trip.driver_id == staff.id, Trip.status.in_(ACTIVE_TRIP_STATUSES))
            .order_by(Trip.dispatch_date.desc(), Trip.trip_sequence)
            .limit(1)
        )
    ).scalar_one_or_none()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NO_ACTIVE_TRIP")
    ctx = (await load_contexts(session, [trip]))[0]
    flagged = set(
        (await session.execute(select(DiscrepancyReport.order_item_id).where(DiscrepancyReport.trip_id == trip.id)))
        .scalars()
        .all()
    )
    waypoints = _waypoints(ctx, flagged)
    open_seq = [w["seq"] for w in waypoints if w["status"] in ("pending", "arrived")]
    vehicle, depot = ctx.vehicle, ctx.depot
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
                "id": str(staff.id),
                "name": staff.name,
                "phone": staff.phone,
                "license_id": staff.license_number,
                "designation": "Driver",
            },
        },
        "waypoints": waypoints,
        "active_waypoint_seq": open_seq[0] if open_seq else (waypoints[-1]["seq"] if waypoints else 0),
    }
