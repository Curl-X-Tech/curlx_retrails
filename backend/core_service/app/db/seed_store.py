"""Seeds schema.sql fleet, staff and order tables from the shared seed files."""

import math
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed_dispatch import non_driver_staff_rows, seed_dispatch, trip_order_status
from app.db.seed_json import SeedData, resolve_depot
from app.entities.customer_order import CustomerOrder, DeferralAuditLog, OrderItem
from app.entities.depot import Depot
from app.entities.item import Item
from app.entities.outlet import Outlet
from app.entities.staff_profile import StaffProfile
from app.entities.user import User
from app.entities.vehicle import Vehicle

REG_PREFIX = {"PEL": "WP", "KAN": "CP"}
MODEL_NAMES = {
    ("truck", "reefer"): "Isuzu FTR Reefer",
    ("truck", "ambient"): "Isuzu FVR Dry",
    ("van", "reefer"): "Toyota Hiace Reefer",
    ("van", "ambient"): "Tata Ace",
}
DEFERRAL_REASONS = [
    ("insufficient_reefer_capacity", "weight_cap"),
    ("van_access_shortage", "fleet_downtime"),
    ("time_budget_limit", "time_budget"),
    ("fuel_quota_exceeded", "volume_cap"),
]


def staff_rows(data: SeedData, users: dict[str, User], depots: dict[str, Depot]) -> list[dict[str, Any]]:
    rows = []
    for index, row in enumerate(data.drivers, start=1):
        user = users[row["email"]]
        first, _, last = user.name.partition(" ")
        rows.append(
            {
                "name": user.name,
                "user_id": user.id,
                "employee_code": f"DRV-{index:03d}",
                "first_name": first,
                "last_name": last,
                "email": row["email"],
                "phone": row["phone"],
                "role": "driver",
                "depot_id": depots[resolve_depot(row["depot"], data.depots)].id,
                "license_number": row["license_no"],
                "license_class": "Heavy Commercial (Class A)" if index % 3 else "Van (Class B)",
            }
        )
    return rows


def vehicle_rows(data: SeedData, depots: dict[str, Depot], drivers: dict[str, StaffProfile]) -> list[dict[str, Any]]:
    driver_ids = [d.id for d in sorted(drivers.values(), key=lambda d: d.employee_code)]
    rows = []
    for index, row in enumerate(data.vehicles):
        code = resolve_depot(row["depot"], data.depots)
        rows.append(
            {
                "name": row["ID"],
                "vehicle_id": row["ID"],
                "reg_number": f"{REG_PREFIX.get(code, 'SP')}-{4000 + index * 17}",
                "model_name": MODEL_NAMES[(row["type"], row["temp_condition"])],
                "type": row["type"],
                "temp": row["temp_condition"],
                "weight_cap_kg": row["weight_cap_kg"],
                "volume_cap_m3": row["volume_cap_m3"],
                "fuel_type": row["fuel_type"],
                "km_per_l": row["km_per_l"],
                "weekly_fuel_quota_l": row["weekly_fuel_quota"],
                "depot_id": depots[code].id,
                "assigned_driver_id": driver_ids[index] if index < len(driver_ids) else None,
            }
        )
    return rows


def _pick_item(items: list[Item], brand_id: Any, chilled: bool) -> Item:
    matching = [i for i in items if i.requires_cold_chain == chilled] or items
    return next((i for i in matching if i.brand_id == brand_id), matching[0])


def order_rows(
    data: SeedData, outlets: dict[str, Outlet], items: dict[str, Item], unit_prices: dict[str, float]
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[str]]:
    catalog = sorted(items.values(), key=lambda i: i.sku)
    orders: list[dict[str, Any]] = []
    lines: list[dict[str, Any]] = []
    deferred_refs: list[str] = []
    planned = trip_order_status(data)
    for row in data.orders:
        outlet = outlets[row["outlet_id"]]
        chilled = row["temp_condition"] != "ambient"
        item = _pick_item(catalog, outlet.brand_id, chilled)
        orders.append(
            {
                "name": row["ID"],
                "order_ref": row["ID"],
                "outlet_id": outlet.id,
                "order_date": row["order_date"],
                "required_date": row["order_date"],
                "temp_requirement": "chilled" if chilled else "ambient",
                "status": planned.get(row["ID"], row["status"]),
                "deferred_yesterday": 1 if row["status"] == "deferred" else 0,
            }
        )
        lines.append(
            {
                "name": item.name,
                "order_ref": row["ID"],
                "item_id": item.id,
                "package_code": f"{row['ID']}-01",
                "requested_qty": max(1, math.ceil(row["weight_kg"] / item.unit_weight_kg)),
                "unit_weight_kg": item.unit_weight_kg,
                "unit_volume_m3": item.unit_volume_m3,
                "unit_price": unit_prices.get(item.sku, 0.0),
                "special_handling_code": item.special_handling_code,
            }
        )
        if row["status"] == "deferred":
            deferred_refs.append(row["ID"])
    return orders, lines, deferred_refs


async def seed_store(
    session: AsyncSession,
    data: SeedData,
    users: dict[str, User],
    depots: dict[str, Depot],
    outlets: dict[str, Outlet],
    items: dict[str, Item],
    counts: dict[str, int],
    upsert: Any,
) -> None:
    drivers = await upsert(session, StaffProfile, "employee_code", staff_rows(data, users, depots), counts)
    await session.flush()
    await upsert(session, Vehicle, "vehicle_id", vehicle_rows(data, depots, drivers), counts)
    await upsert(session, StaffProfile, "employee_code", non_driver_staff_rows(data, users, depots, outlets), counts)
    await session.flush()
    if not data.orders:
        return

    unit_prices = {p["sku"]: p["unit_price"] for p in data.prices}
    orders, lines, deferred_refs = order_rows(data, outlets, items, unit_prices)
    saved = await upsert(session, CustomerOrder, "order_ref", orders, counts)
    await session.flush()
    await upsert(
        session,
        OrderItem,
        "package_code",
        [
            {**{k: v for k, v in line.items() if k != "order_ref"}, "order_id": saved[line["order_ref"]].id}
            for line in lines
        ],
        counts,
    )
    dispatcher = next((u for u in users.values() if u.user_type.value == "dispatcher"), None)
    if dispatcher is None:
        return
    logs = []
    for index, ref in enumerate(deferred_refs):
        order = saved[ref]
        reason, resource = DEFERRAL_REASONS[index % len(DEFERRAL_REASONS)]
        logs.append(
            {
                "name": ref,
                "order_id": order.id,
                "outlet_id": order.outlet_id,
                "dispatch_date": order.order_date,
                "deferral_reason": reason,
                "limiting_resource": resource,
                "decision_maker_staff_id": dispatcher.id,
            }
        )
    await upsert(session, DeferralAuditLog, "order_id", logs, counts)
    await seed_dispatch(session, data, depots, outlets, counts)
