"""Manual allocation: a dispatcher assigns selected orders to a chosen vehicle and driver."""

import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import utc_now
from app.entities.customer_order import CustomerOrder, OrderItem
from app.entities.depot import Depot
from app.entities.outlet import Outlet
from app.entities.staff_profile import StaffProfile
from app.entities.trip import Trip
from app.entities.user import User
from app.entities.vehicle import Vehicle
from app.services.allocation.time_budget import MAX_TRIPS_PER_VEHICLE, add_trip_route_legs
from app.services.dispatcher_scope import OPEN_STATUSES, is_scoped, order_scope


def _reject(code: str, http_status: int = status.HTTP_409_CONFLICT) -> HTTPException:
    return HTTPException(status_code=http_status, detail=code)


async def allocate_orders(
    session: AsyncSession,
    user: User | None,
    order_ids: list[uuid.UUID],
    vehicle_id: uuid.UUID,
    driver_id: uuid.UUID | None,
    operating_date: date,
) -> Trip:
    """Creates one scheduled trip for the orders. Caller commits."""
    vehicle = await session.get(Vehicle, vehicle_id)
    if vehicle is None or not vehicle.is_active:
        raise _reject("VEHICLE_NOT_FOUND", status.HTTP_404_NOT_FOUND)
    if vehicle.status in ("breakdown", "in_workshop"):
        raise _reject("VEHICLE_UNAVAILABLE")
    driver_id = driver_id or vehicle.assigned_driver_id
    if driver_id is None or await session.get(StaffProfile, driver_id) is None:
        raise _reject("DRIVER_NOT_FOUND", status.HTTP_404_NOT_FOUND)

    query = (
        select(CustomerOrder, Outlet)
        .join(Outlet, Outlet.id == CustomerOrder.outlet_id)
        .where(CustomerOrder.id.in_(order_ids))
    )
    if is_scoped(user):
        query = query.where(order_scope(user))
    rows = (await session.execute(query)).all()
    if len(rows) != len(set(order_ids)):
        raise _reject("ORDER_NOT_FOUND", status.HTTP_404_NOT_FOUND)
    if any(order.status not in OPEN_STATUSES for order, _ in rows):
        raise _reject("ORDER_NOT_ALLOCATABLE")
    if any(outlet.depot_id != vehicle.depot_id for _, outlet in rows):
        raise _reject("DEPOT_MISMATCH")
    if len({(outlet.brand_id, outlet.district_id) for _, outlet in rows}) != 1:
        raise _reject("MIXED_BRAND_OR_DISTRICT", status.HTTP_422_UNPROCESSABLE_ENTITY)
    if any(order.temp_requirement == "chilled" for order, _ in rows) and vehicle.temp != "reefer":
        raise _reject("VEHICLE_NOT_REEFER")

    weight, volume = (
        await session.execute(
            select(
                func.coalesce(func.sum(OrderItem.requested_qty * OrderItem.unit_weight_kg), 0),
                func.coalesce(func.sum(OrderItem.requested_qty * OrderItem.unit_volume_m3), 0),
            ).where(OrderItem.order_id.in_([o.id for o, _ in rows]))
        )
    ).one()
    if weight > vehicle.weight_cap_kg or volume > vehicle.volume_cap_m3:
        raise _reject("CAPACITY_EXCEEDED")

    trips_today = (
        await session.execute(
            select(func.count()).where(
                Trip.vehicle_id == vehicle.id, Trip.dispatch_date == operating_date, Trip.status != "cancelled"
            )
        )
    ).scalar_one()
    if trips_today >= MAX_TRIPS_PER_VEHICLE:
        raise _reject("VEHICLE_TRIP_LIMIT")

    outlet = rows[0][1]
    user_id = user.id if user else None
    trip = Trip(
        name="Manual trip",
        trip_code=f"TRP-{operating_date:%Y%m%d}-M{uuid.uuid4().hex[:6].upper()}",
        dispatch_date=operating_date,
        trip_sequence=trips_today + 1,
        vehicle_id=vehicle.id,
        driver_id=driver_id,
        depot_id=vehicle.depot_id,
        brand_id=outlet.brand_id,
        district_id=outlet.district_id,
        status="scheduled",
        created_by=user_id,
        updated_by=user_id,
    )
    session.add(trip)
    await add_trip_route_legs(session, trip, await session.get(Depot, vehicle.depot_id), rows, operating_date)
    now = utc_now()
    for order, _ in rows:
        order.status = "allocated"
        order.updated_at, order.updated_by = now, user_id or order.updated_by
    await session.flush()
    return trip
