"""Read models joining trips with vehicles, drivers, legs and cargo."""

import uuid
from dataclasses import dataclass, field
from datetime import time
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.entities.brand import Brand
from app.entities.customer_order import CustomerOrder, OrderItem
from app.entities.depot import Depot
from app.entities.district import District
from app.entities.item import Item
from app.entities.outlet import Outlet
from app.entities.staff_profile import StaffProfile
from app.entities.trip import Trip, RouteLeg
from app.entities.vehicle import Vehicle

TIME_FMT = "%H:%M:%S"


def iso(value: Any) -> str | None:
    return value.isoformat() if value is not None else None


def tstr(value: time) -> str:
    return value.strftime(TIME_FMT)


def pct(value: float, cap: float) -> float:
    return round(min(100.0, value / cap * 100.0), 1) if cap else 0.0


@dataclass
class TripContext:
    trip: Trip
    vehicle: Vehicle
    driver: StaffProfile | None
    depot: Depot
    brand: Brand
    district: District
    legs: list[RouteLeg] = field(default_factory=list)
    outlets: dict[uuid.UUID, Outlet] = field(default_factory=dict)
    orders: dict[uuid.UUID, CustomerOrder] = field(default_factory=dict)
    items: dict[uuid.UUID, list[OrderItem]] = field(default_factory=dict)
    catalog: dict[uuid.UUID, Item] = field(default_factory=dict)

    @property
    def all_items(self) -> list[OrderItem]:
        return [i for items in self.items.values() for i in items]

    @property
    def weight_kg(self) -> float:
        return round(sum(i.requested_qty * i.unit_weight_kg for i in self.all_items), 2)

    @property
    def volume_m3(self) -> float:
        return round(sum(i.requested_qty * i.unit_volume_m3 for i in self.all_items), 3)

    @property
    def packages(self) -> int:
        return sum(i.requested_qty for i in self.all_items)

    @property
    def value_lkr(self) -> float:
        return round(sum(i.requested_qty * i.unit_price for i in self.all_items), 2)


async def load_contexts(session: AsyncSession, trips: list[Trip]) -> list[TripContext]:
    if not trips:
        return []
    trip_ids = [t.id for t in trips]

    async def by_id(model: Any, ids: set[uuid.UUID]) -> dict[uuid.UUID, Any]:
        rows = await session.execute(select(model).where(model.id.in_(ids)))
        return {row.id: row for row in rows.scalars()}

    vehicles = await by_id(Vehicle, {t.vehicle_id for t in trips})
    drivers = await by_id(StaffProfile, {t.driver_id for t in trips})
    depots = await by_id(Depot, {t.depot_id for t in trips})
    brands = await by_id(Brand, {t.brand_id for t in trips})
    districts = await by_id(District, {t.district_id for t in trips})

    leg_rows = (
        (await session.execute(select(RouteLeg).where(RouteLeg.trip_id.in_(trip_ids)).order_by(RouteLeg.seq)))
        .scalars()
        .all()
    )
    outlets = await by_id(Outlet, {leg.to_outlet_id for leg in leg_rows})
    orders = await by_id(CustomerOrder, {leg.order_id for leg in leg_rows if leg.order_id})
    item_rows = (
        (await session.execute(select(OrderItem).where(OrderItem.order_id.in_(list(orders))))).scalars().all()
        if orders
        else []
    )
    catalog = await by_id(Item, {i.item_id for i in item_rows})

    contexts = []
    for trip in trips:
        legs = [leg for leg in leg_rows if leg.trip_id == trip.id]
        order_ids = {leg.order_id for leg in legs if leg.order_id}
        contexts.append(
            TripContext(
                trip=trip,
                vehicle=vehicles[trip.vehicle_id],
                driver=drivers.get(trip.driver_id),
                depot=depots[trip.depot_id],
                brand=brands[trip.brand_id],
                district=districts[trip.district_id],
                legs=legs,
                outlets={leg.to_outlet_id: outlets[leg.to_outlet_id] for leg in legs},
                orders={oid: orders[oid] for oid in order_ids},
                items={oid: [i for i in item_rows if i.order_id == oid] for oid in order_ids},
                catalog=catalog,
            )
        )
    return contexts


async def load_context(session: AsyncSession, trip_id: uuid.UUID) -> TripContext:
    trip = await session.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TRIP_NOT_FOUND")
    return (await load_contexts(session, [trip]))[0]


def trip_read(trip: Trip) -> dict[str, Any]:
    return {
        "id": str(trip.id),
        "trip_code": trip.trip_code,
        "dispatch_date": trip.dispatch_date.isoformat(),
        "trip_sequence": trip.trip_sequence,
        "vehicle_id": str(trip.vehicle_id),
        "driver_id": str(trip.driver_id),
        "depot_id": str(trip.depot_id),
        "brand_id": str(trip.brand_id),
        "district_id": str(trip.district_id),
        "status": trip.status,
        "outbound_travel_min": trip.outbound_travel_min,
        "inter_stop_travel_min": trip.inter_stop_travel_min,
        "total_handling_min": trip.total_handling_min,
        "total_trip_duration_min": trip.total_trip_duration_min,
        "total_distance_km": trip.total_distance_km,
        "seal_number": trip.seal_number,
        "created_at": iso(trip.created_at),
        "updated_at": iso(trip.updated_at),
    }


def allocation_summary(ctx: TripContext) -> dict[str, Any]:
    vehicle = ctx.vehicle
    return {
        **trip_read(ctx.trip),
        "weight_utilization_pct": pct(ctx.weight_kg, vehicle.weight_cap_kg),
        "volume_utilization_pct": pct(ctx.volume_m3, vehicle.volume_cap_m3),
        "total_packages": ctx.packages,
        "total_orders": len(ctx.orders),
        "cargo_value_lkr": ctx.value_lkr,
        "total_payload_kg": ctx.weight_kg,
        "total_volume_m3": ctx.volume_m3,
        "weight_cap_kg": vehicle.weight_cap_kg,
        "volume_cap_m3": vehicle.volume_cap_m3,
        "vehicle_reg_number": vehicle.reg_number,
        "vehicle_model": vehicle.model_name,
        "vehicle_type": vehicle.type,
        "driver_name": ctx.driver.name if ctx.driver else None,
        "driver_phone": ctx.driver.phone if ctx.driver else None,
        "depot_name": ctx.depot.name,
        "brand_name": ctx.brand.name,
        "district_name": ctx.district.name,
    }


def leg_items(ctx: TripContext, leg: RouteLeg) -> list[dict[str, Any]]:
    result = []
    for item in ctx.items.get(leg.order_id, []) if leg.order_id else []:
        catalog = ctx.catalog[item.item_id]
        result.append(
            {
                "id": str(item.id),
                "order_id": str(item.order_id),
                "order_item_id": str(item.id),
                "sku": catalog.sku,
                "item_name": catalog.name,
                "package_code": item.package_code,
                "requested_qty": item.requested_qty,
                "unit_weight_kg": item.unit_weight_kg,
                "unit_volume_m3": item.unit_volume_m3,
                "unit_price": item.unit_price,
                "special_handling_code": item.special_handling_code,
            }
        )
    return result


def leg_read(leg: RouteLeg) -> dict[str, Any]:
    return {
        "id": str(leg.id),
        "trip_id": str(leg.trip_id),
        "seq": leg.seq,
        "from_point": leg.from_point,
        "to_outlet_id": str(leg.to_outlet_id),
        "order_id": str(leg.order_id) if leg.order_id else None,
        "distance_km": leg.distance_km,
        "planned_depart_time": tstr(leg.planned_depart_time),
        "planned_arrival_time": tstr(leg.planned_arrival_time),
        "status": leg.status,
        "planned_travel_duration_min": leg.planned_travel_duration_min,
        "actual_depart_time": iso(leg.actual_depart_time),
        "actual_travel_duration_min": leg.actual_travel_duration_min,
        "arrival_time": iso(leg.arrival_time),
        "leave_outlet_time": iso(leg.leave_outlet_time),
        "is_post_dispatch_added": leg.is_post_dispatch_added,
    }


def allocation_detail(ctx: TripContext) -> dict[str, Any]:
    vehicle, driver = ctx.vehicle, ctx.driver
    legs = []
    for leg in ctx.legs:
        outlet = ctx.outlets[leg.to_outlet_id]
        items = leg_items(ctx, leg)
        legs.append(
            {
                **leg_read(leg),
                "outlet_name": outlet.name,
                "outlet_code": outlet.outlet_id,
                "address": outlet.name,
                "dock_type": getattr(outlet.dock_type, "value", outlet.dock_type),
                "parking_constraint": getattr(outlet.parking_constraint, "value", outlet.parking_constraint),
                "window_open_time": tstr(outlet.window_open_time),
                "window_close_time": tstr(outlet.window_close_time),
                "contact_phone": outlet.contact_phone,
                "crates_count": sum(i["requested_qty"] for i in items),
                "items": items,
            }
        )
    summary = allocation_summary(ctx)
    return {
        "trip": trip_read(ctx.trip),
        "vehicle": {
            "id": str(vehicle.id),
            "vehicle_id": vehicle.vehicle_id,
            "reg_number": vehicle.reg_number,
            "model_name": vehicle.model_name,
            "type": vehicle.type,
            "temp": vehicle.temp,
            "weight_cap_kg": vehicle.weight_cap_kg,
            "volume_cap_m3": vehicle.volume_cap_m3,
            "km_per_l": vehicle.km_per_l,
            "weekly_fuel_quota_l": vehicle.weekly_fuel_quota_l,
        },
        "driver": {
            "id": str(driver.id) if driver else "",
            "name": driver.name if driver else "",
            "phone": driver.phone if driver else "",
            "license_number": driver.license_number if driver else None,
        },
        "depot": {"id": str(ctx.depot.id), "code": ctx.depot.code, "name": ctx.depot.name},
        "brand": {"id": str(ctx.brand.id), "code": ctx.brand.code, "name": ctx.brand.name},
        "district": {"id": str(ctx.district.id), "name": ctx.district.name},
        "legs": legs,
        "summary": {
            key: summary[key]
            for key in (
                "total_orders",
                "total_packages",
                "total_payload_kg",
                "total_volume_m3",
                "cargo_value_lkr",
                "weight_utilization_pct",
                "volume_utilization_pct",
            )
        },
    }
