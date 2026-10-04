"""Greedy allocation planner: groups pending orders into trips by brand and district."""

import math
import time as clock
import uuid
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import SRI_LANKA_TZ, utc_now
from app.entities.customer_order import CustomerOrder, DeferralAuditLog, OrderItem
from app.entities.depot import Depot
from app.entities.outlet import Outlet
from app.entities.trip import RouteLeg, Trip
from app.entities.vehicle import Vehicle

MAX_TRIPS_PER_VEHICLE = 2
AVERAGE_SPEED_KMH = 30.0
SERVICE_MIN = 20.0
FALLBACK_KM = 15.0
DEPARTURE = time(5, 0)


def haversine_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lon1, lat2, lon2 = map(math.radians, (*a, *b))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(h))


def _coords(obj: Depot | Outlet) -> tuple[float, float] | None:
    if obj.latitude is None or obj.longitude is None:
        return None
    return obj.latitude, obj.longitude


def _distance(a: Depot | Outlet, b: Depot | Outlet) -> float:
    left, right = _coords(a), _coords(b)
    return round(haversine_km(left, right), 2) if left and right else FALLBACK_KM


def _clock(base: datetime, minutes: float) -> time:
    return (base + timedelta(minutes=minutes)).time().replace(microsecond=0)


async def run_planner(
    session: AsyncSession,
    operating_date: date,
    depot_id: uuid.UUID,
    order_ids: list[uuid.UUID] | None,
    unavailable_vehicle_ids: set[uuid.UUID],
    staff_id: uuid.UUID | None,
    user_id: uuid.UUID | None = None,
) -> dict[str, Any]:
    started = clock.perf_counter()
    depot = await session.get(Depot, depot_id)
    query = (
        select(CustomerOrder, Outlet)
        .join(Outlet, Outlet.id == CustomerOrder.outlet_id)
        .where(Outlet.depot_id == depot_id, CustomerOrder.status.in_(("pending", "deferred")))
        .where(CustomerOrder.required_date <= operating_date)
        .order_by(CustomerOrder.is_urgent.desc(), CustomerOrder.deferred_yesterday.desc(), CustomerOrder.created_at)
    )
    if order_ids:
        query = query.where(CustomerOrder.id.in_(order_ids))
    pending = (await session.execute(query)).all()

    loads: dict[uuid.UUID, tuple[float, float]] = {}
    if pending:
        rows = await session.execute(
            select(
                OrderItem.order_id,
                func.sum(OrderItem.requested_qty * OrderItem.unit_weight_kg),
                func.sum(OrderItem.requested_qty * OrderItem.unit_volume_m3),
            )
            .where(OrderItem.order_id.in_([o.id for o, _ in pending]))
            .group_by(OrderItem.order_id)
        )
        loads = {oid: (float(w or 0), float(v or 0)) for oid, w, v in rows}

    vehicles = (
        (
            await session.execute(
                select(Vehicle).where(
                    Vehicle.depot_id == depot_id, Vehicle.is_active.is_(True), Vehicle.assigned_driver_id.is_not(None)
                )
            )
        )
        .scalars()
        .all()
    )
    vehicles = [
        v for v in vehicles if v.status not in ("breakdown", "in_workshop") and v.id not in unavailable_vehicle_ids
    ]
    used = dict(
        (
            await session.execute(
                select(Trip.vehicle_id, func.count())
                .where(Trip.dispatch_date == operating_date, Trip.status != "cancelled")
                .group_by(Trip.vehicle_id)
            )
        ).all()
    )
    trip_total = (await session.execute(select(func.count()).select_from(Trip))).scalar_one()

    groups: dict[tuple[uuid.UUID, uuid.UUID, str], list[tuple[CustomerOrder, Outlet]]] = defaultdict(list)
    for order, outlet in pending:
        groups[(outlet.brand_id, outlet.district_id, order.temp_requirement)].append((order, outlet))

    proposed: list[dict[str, Any]] = []
    deferred: list[dict[str, Any]] = []

    def defer(order: CustomerOrder, outlet: Outlet, reason: str, resource: str) -> None:
        deferred.append(
            {
                "order_id": str(order.id),
                "order_ref": order.order_ref,
                "outlet_id": str(outlet.id),
                "reason_code": reason,
                "limiting_resource": resource,
            }
        )

    for (brand_id, district_id, temp), members in groups.items():
        eligible = [v for v in vehicles if temp != "chilled" or v.temp == "reefer"]
        eligible.sort(key=lambda v: -v.weight_cap_kg)
        remaining = list(members)
        while remaining:
            vehicle = next((v for v in eligible if used.get(v.id, 0) < MAX_TRIPS_PER_VEHICLE), None)
            if vehicle is None:
                for order, outlet in remaining:
                    defer(
                        order,
                        outlet,
                        "insufficient_reefer_capacity" if temp == "chilled" else "fleet_unavailable",
                        "fleet_downtime",
                    )
                break
            weight = volume = 0.0
            chosen: list[tuple[CustomerOrder, Outlet]] = []
            leftover: list[tuple[CustomerOrder, Outlet]] = []
            for order, outlet in remaining:
                w, v = loads.get(order.id, (0.0, 0.0))
                if weight + w <= vehicle.weight_cap_kg and volume + v <= vehicle.volume_cap_m3:
                    chosen.append((order, outlet))
                    weight, volume = weight + w, volume + v
                else:
                    leftover.append((order, outlet))
            if not chosen:
                for order, outlet in leftover:
                    defer(order, outlet, "insufficient_capacity", "weight_cap")
                break
            used[vehicle.id] = used.get(vehicle.id, 0) + 1
            trip_total += 1
            trip = Trip(
                name=f"Trip {trip_total}",
                trip_code=f"TRP-{operating_date:%Y%m%d}-{trip_total:04d}",
                dispatch_date=operating_date,
                trip_sequence=used[vehicle.id],
                vehicle_id=vehicle.id,
                driver_id=vehicle.assigned_driver_id,
                depot_id=depot_id,
                brand_id=brand_id,
                district_id=district_id,
                status="scheduled",
                created_by=user_id,
                updated_by=user_id,
            )
            minutes_total = await _add_legs(session, trip, depot, chosen, operating_date)
            session.add(trip)
            for order, _ in chosen:
                order.status = "allocated"
                order.updated_at = utc_now()
            proposed.append(
                {
                    "trip_code": trip.trip_code,
                    "brand_id": str(brand_id),
                    "district_id": str(district_id),
                    "vehicle_id": str(vehicle.id),
                    "driver_id": str(vehicle.assigned_driver_id),
                    "order_ids": [str(o.id) for o, _ in chosen],
                    "route_leg_count": len(chosen),
                    "total_weight_kg": round(weight, 2),
                    "total_volume_m3": round(volume, 3),
                    "estimated_duration_min": round(minutes_total, 1),
                }
            )
            remaining = leftover

    for item in deferred:
        session.add(
            DeferralAuditLog(
                name="Deferral",
                order_id=uuid.UUID(item["order_id"]),
                outlet_id=uuid.UUID(item["outlet_id"]),
                dispatch_date=operating_date,
                deferral_reason=item["reason_code"],
                limiting_resource=item["limiting_resource"],
                decision_maker_staff_id=staff_id or uuid.UUID(int=0),
            )
        )
    deferred_ids = {uuid.UUID(d["order_id"]) for d in deferred}
    for order, _ in pending:
        if order.id in deferred_ids:
            order.status = "deferred"
            order.deferred_yesterday += 1
    await session.flush()

    allocated = sum(len(p["order_ids"]) for p in proposed)
    return {
        "proposed_trips": proposed,
        "deferred_orders": deferred,
        "execution_time_ms": int((clock.perf_counter() - started) * 1000),
        "feasibility_passed": not deferred,
        "solver_status": "optimal" if not deferred else "feasible",
        "summary": {
            "total_orders_processed": len(pending),
            "allocated_orders_count": allocated,
            "deferred_orders_count": len(deferred),
            "total_trips_created": len(proposed),
        },
    }


async def _add_legs(
    session: AsyncSession,
    trip: Trip,
    depot: Depot | None,
    stops: list[tuple[CustomerOrder, Outlet]],
    operating_date: date,
) -> float:
    base = datetime.combine(operating_date, DEPARTURE)
    elapsed = 0.0
    previous: Depot | Outlet | None = depot
    outbound = inter = handling = distance = 0.0
    for seq, (order, outlet) in enumerate(stops):
        km = _distance(previous, outlet) if previous is not None else FALLBACK_KM
        travel = round(km / AVERAGE_SPEED_KMH * 60, 1)
        depart_at = elapsed
        elapsed += travel
        arrive_at = elapsed
        elapsed += SERVICE_MIN
        if seq == 0:
            outbound += travel
        else:
            inter += travel
        handling += SERVICE_MIN
        distance += km
        session.add(
            RouteLeg(
                name=f"Leg {seq}",
                leg_id=f"{trip.trip_code}-{seq}",
                trip_id=trip.id,
                seq=seq,
                from_point="DEPOT" if seq == 0 else str(stops[seq - 1][1].id),
                to_outlet_id=outlet.id,
                order_id=order.id,
                distance_km=km,
                planned_depart_time=_clock(base, depart_at),
                planned_travel_duration_min=travel,
                planned_arrival_time=_clock(base, arrive_at),
            )
        )
        previous = outlet
    trip.outbound_travel_min = round(outbound, 1)
    trip.inter_stop_travel_min = round(inter, 1)
    trip.total_handling_min = handling
    trip.total_distance_km = round(distance, 2)
    trip.total_trip_duration_min = round(elapsed, 1)
    trip.planned_start_time = base.replace(tzinfo=SRI_LANKA_TZ)
    return elapsed
