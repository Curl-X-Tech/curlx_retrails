"""Seeds trips, legs, checklists, proofs of delivery, discrepancies and telemetry from JSON, insert-if-missing."""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import utc_now
from app.db.seed_json import SeedData, resolve_depot
from app.entities.brand import Brand
from app.entities.customer_order import CustomerOrder, OrderItem
from app.entities.depot import Depot
from app.entities.district import District
from app.entities.outlet import Outlet
from app.entities.staff_profile import StaffProfile
from app.entities.trip import (
    DiscrepancyReport,
    LoadingChecklistItem,
    ProofOfDelivery,
    RouteLeg,
    Trip,
    VehicleTelemetry,
)
from app.entities.user import User
from app.entities.vehicle import Vehicle


def _same(current: Any, new: Any) -> bool:
    if isinstance(current, datetime) and isinstance(new, datetime):
        return current.replace(tzinfo=None) == new.astimezone(timezone.utc).replace(tzinfo=None)
    return current == new


async def _existing(session: AsyncSession, model: type, key: Any) -> dict[Any, Any]:
    return {key(o): o for o in (await session.execute(select(model))).scalars()}


async def _insert_missing(
    session: AsyncSession, model: type, key: Any, rows: list[dict[str, Any]], counts: dict[str, int]
) -> dict[Any, Any]:
    found = await _existing(session, model, key)
    counts.setdefault(model.__tablename__, 0)
    for row in rows:
        probe = model(**row)
        current = found.get(key(probe))
        if current is not None:
            changed = {k: v for k, v in row.items() if not _same(getattr(current, k), v)}
            for k, v in changed.items():
                setattr(current, k, v)
            if changed:
                current.updated_at = utc_now()
                counts[model.__tablename__] += 1
            continue
        session.add(probe)
        found[key(probe)] = probe
        counts[model.__tablename__] += 1
    await session.flush()
    return found


def trip_order_status(data: SeedData) -> dict[str, str]:
    """Customer order status implied by the trip each order is planned on."""
    result: dict[str, str] = {}
    for trip in data.dispatch_trips:
        for leg in trip["legs"]:
            ref = leg["order_ref"]
            if not ref:
                continue
            if leg["status"] == "completed":
                result[ref] = "delivered"
            elif leg["status"] == "skipped":
                result[ref] = "deferred"
            elif trip["status"] == "in_transit":
                result[ref] = "in_transit"
            else:
                result[ref] = "allocated"
    return result


def non_driver_staff_rows(
    data: SeedData, users: dict[str, User], depots: dict[str, Depot], outlets: dict[str, Outlet]
) -> list[dict[str, Any]]:
    rows = []
    for row in data.staff:
        user = users[row["email"]]
        first, _, last = user.name.partition(" ")
        rows.append(
            {
                "name": user.name,
                "user_id": user.id,
                "employee_code": row["employee_code"],
                "first_name": first,
                "last_name": last,
                "email": row["email"],
                "phone": row["phone"],
                "role": row["role"],
                "depot_id": depots[resolve_depot(row["depot"], data.depots)].id,
                "outlet_id": outlets[row["outlet_id"]].id if row["outlet_id"] else None,
            }
        )
    return rows


async def seed_dispatch(
    session: AsyncSession,
    data: SeedData,
    depots: dict[str, Depot],
    outlets: dict[str, Outlet],
    counts: dict[str, int],
) -> None:
    if not data.dispatch_trips:
        return
    staff = {s.email: s.id for s in (await session.execute(select(StaffProfile))).scalars()}
    vehicles = {v.vehicle_id: v.id for v in (await session.execute(select(Vehicle))).scalars()}
    brands = {b.code: b.id for b in (await session.execute(select(Brand))).scalars()}
    districts = {d.name: d.id for d in (await session.execute(select(District))).scalars()}
    orders = {o.order_ref: o.id for o in (await session.execute(select(CustomerOrder))).scalars()}
    packages = {i.package_code: i for i in (await session.execute(select(OrderItem))).scalars()}

    trip_rows = [
        {
            "name": t["trip_code"],
            **{
                k: v
                for k, v in t.items()
                if k not in ("legs", "vehicle_id", "driver_email", "depot", "brand", "district")
            },
            "vehicle_id": vehicles[t["vehicle_id"]],
            "driver_id": staff[t["driver_email"]],
            "depot_id": depots[resolve_depot(t["depot"], data.depots)].id,
            "brand_id": brands[t["brand"]],
            "district_id": districts[t["district"]],
        }
        for t in data.dispatch_trips
    ]
    trips = await _insert_missing(session, Trip, lambda o: o.trip_code, trip_rows, counts)

    leg_rows = []
    for t in data.dispatch_trips:
        for leg in t["legs"]:
            ref, email = leg["order_ref"], leg["sealed_by_email"]
            leg_rows.append(
                {
                    "name": f"{t['trip_code']}-{leg['seq']}",
                    "leg_id": f"{t['trip_code']}-{leg['seq']}",
                    "trip_id": trips[t["trip_code"]].id,
                    "to_outlet_id": outlets[leg["outlet_id"]].id,
                    "order_id": orders[ref] if ref else None,
                    "sealed_by_staff_id": staff[email] if email else None,
                    **{k: v for k, v in leg.items() if k not in ("outlet_id", "order_ref", "sealed_by_email")},
                }
            )
    legs = await _insert_missing(session, RouteLeg, lambda o: o.leg_id, leg_rows, counts)

    checklist_rows = []
    for c in data.checklist:
        email = c["verified_by_email"]
        checklist_rows.append(
            {
                "name": c["package_code"],
                "trip_id": trips[c["trip_code"]].id,
                "order_item_id": packages[c["package_code"]].id,
                "status": c["status"],
                "verified_by_staff_id": staff[email] if email else None,
                "verified_at": c["verified_at"],
                "shortfall_qty": c["shortfall_qty"],
                "notes": c["notes"],
            }
        )
    await _insert_missing(session, LoadingChecklistItem, lambda o: (o.trip_id, o.order_item_id), checklist_rows, counts)

    leg_by_seq = {
        (t["trip_code"], leg["seq"]): legs[f"{t['trip_code']}-{leg['seq']}"]
        for t in data.dispatch_trips
        for leg in t["legs"]
    }
    pod_rows = []
    for p in data.pods:
        leg = leg_by_seq[(p["trip_code"], p["seq"])]
        pod_rows.append(
            {
                "name": f"{p['trip_code']}-{p['seq']}",
                "trip_id": leg.trip_id,
                "route_leg_id": leg.id,
                "order_id": leg.order_id,
                "outlet_id": leg.to_outlet_id,
                **{k: v for k, v in p.items() if k not in ("trip_code", "seq")},
            }
        )
    pods = await _insert_missing(session, ProofOfDelivery, lambda o: o.route_leg_id, pod_rows, counts)

    report_rows = []
    for r in data.discrepancies:
        leg = leg_by_seq[(r["trip_code"], r["seq"])]
        report_rows.append(
            {
                "name": f"{r['trip_code']}-{r['seq']}-{r['discrepancy_type']}",
                "trip_id": leg.trip_id,
                "order_id": leg.order_id,
                "order_item_id": packages[r["package_code"]].id,
                "pod_id": next((p.id for p in pods.values() if p.route_leg_id == leg.id), None),
                "reported_by_staff_id": staff[r["reported_by_email"]],
                **{k: v for k, v in r.items() if k not in ("trip_code", "seq", "package_code", "reported_by_email")},
            }
        )
    await _insert_missing(
        session, DiscrepancyReport, lambda o: (o.trip_id, o.order_item_id, o.discrepancy_type), report_rows, counts
    )

    telemetry_rows = [
        {
            "name": t["idempotency_key"],
            **{k: v for k, v in t.items() if k not in ("vehicle_id", "trip_code")},
            "vehicle_id": vehicles[t["vehicle_id"]],
            "trip_id": trips[t["trip_code"]].id if t["trip_code"] else None,
        }
        for t in data.telemetry
    ]
    await _insert_missing(session, VehicleTelemetry, lambda o: o.idempotency_key, telemetry_rows, counts)
