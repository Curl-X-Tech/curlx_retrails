"""Unified database seeding engine with hierarchical master data and procedural domain pipeline."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import sl_today, utc_now, utc_today
from app.core.users import UserManager
from app.db.seed_json import SeedData, load_seed_data, resolve_depot
from app.db.seed_operations import seed_operational_pipeline
from app.entities.brand import Brand
from app.entities.calendar_day import CalendarDay
from app.entities.customer_order import CustomerOrder, DeferralAuditLog, OrderItem
from app.entities.depot import Depot
from app.entities.district import District
from app.entities.item import Item
from app.entities.outlet import Outlet
from app.entities.price_list import PriceList
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
from app.models.route import RouteModel
from app.models.service_allowance import ServiceAllowanceModel
from app.models.vehicle import VehicleModel

logger = logging.getLogger(__name__)


def _same(current: Any, new: Any) -> bool:
    if isinstance(current, datetime) and isinstance(new, datetime):
        return current.replace(tzinfo=None) == new.astimezone(timezone.utc).replace(tzinfo=None)
    return current == new


async def _upsert(
    session: AsyncSession, model: type, key: str, rows: list[dict[str, Any]], counts: dict[str, int]
) -> dict[Any, Any]:
    existing = {getattr(o, key): o for o in (await session.execute(select(model))).scalars()}
    name = getattr(model, "__tablename__", str(model))
    counts.setdefault(name, 0)
    for row in rows:
        obj = existing.get(row[key])
        if obj is None:
            obj = model(**row)
            session.add(obj)
            existing[row[key]] = obj
            counts[name] += 1
            continue
        changed = {k: v for k, v in row.items() if k not in ("ID", "id") and not _same(getattr(obj, k, None), v)}
        for k, v in changed.items():
            setattr(obj, k, v)
        if changed:
            if hasattr(obj, "updated_at"):
                obj.updated_at = utc_now()
            counts[name] += 1
    return existing


def _mapped(
    rows: list[dict[str, Any]], drop: tuple[str, ...], **derive: Callable[[dict[str, Any]], Any]
) -> list[dict[str, Any]]:
    return [{**{k: v for k, v in r.items() if k not in drop}, **{k: fn(r) for k, fn in derive.items()}} for r in rows]


async def _seed_users(session: AsyncSession, data: SeedData, counts: dict[str, int]) -> dict[str, User]:
    manager = UserManager(SQLAlchemyUserDatabase(session, User))
    rows = list(data.users)
    existing = {u.email: u for u in (await session.execute(select(User))).scalars()}
    counts["users"] = 0
    for row in rows:
        email = row["email"].lower()
        if email in existing:
            continue
        user = User(
            email=email,
            hashed_password=manager.password_helper.hash(row["password"]),
            name=row["name"],
            user_type=row["user_type"],
            is_active=True,
            is_verified=True,
        )
        session.add(user)
        existing[email] = user
        counts["users"] += 1
    await session.flush()
    return existing


async def _seed_staff(
    session: AsyncSession,
    data: SeedData,
    users: dict[str, User],
    depots: dict[str, Depot],
    outlets: dict[str, Outlet],
    counts: dict[str, int],
) -> dict[str, StaffProfile]:
    existing_profiles = {p.email: p for p in (await session.execute(select(StaffProfile))).scalars()}
    counts["staff_profile"] = 0
    for row in data.staff:
        email = row["email"].lower()
        user = None if email in ("driver@example.com", "user@example.com") else users.get(email)
        depot = depots.get(row.get("depot", "PEL"))
        outlet = outlets.get(row.get("outlet_id")) if row.get("outlet_id") else None

        if email in existing_profiles:
            continue

        names = (user.name if user else row["employee_code"]).split(" ", 1)
        profile = StaffProfile(
            user_id=user.id if user else None,
            employee_code=row["employee_code"],
            first_name=names[0],
            last_name=names[1] if len(names) > 1 else "",
            email=email,
            phone=row["phone"],
            role=row["role"],
            depot_id=depot.id if depot else None,
            outlet_id=outlet.id if outlet else None,
            license_number=f"B-{2000000 + len(existing_profiles)}" if row["role"] == "driver" else None,
            license_class="Heavy Commercial" if row["role"] == "driver" else None,
            is_active=True,
        )
        session.add(profile)
        existing_profiles[email] = profile
        counts["staff_profile"] += 1

    # Ensure exactly 60 total drivers exist for the 60 fleet vehicles
    driver_count = len([p for p in existing_profiles.values() if p.role == "driver"])
    for i in range(driver_count + 1, 61):
        code = f"DRV-{i:03d}"
        email = f"driver.{i:03d}@curlx.tech"
        if email in existing_profiles:
            continue
        depot_code = "PEL" if i <= 37 else "KDY"
        depot = depots.get(depot_code)
        profile = StaffProfile(
            employee_code=code,
            first_name="Driver",
            last_name=f"{i:03d}",
            email=email,
            phone=f"+94 77 100 {i:04d}",
            role="driver",
            license_number=f"B-{1000000 + i}",
            license_class="Heavy Commercial",
            depot_id=depot.id if depot else None,
            is_active=True,
        )
        session.add(profile)
        existing_profiles[email] = profile
        counts["staff_profile"] += 1

    await session.flush()
    return existing_profiles


async def _seed_vehicles(
    session: AsyncSession,
    data: SeedData,
    depots: dict[str, Depot],
    staff: dict[str, StaffProfile],
    counts: dict[str, int],
) -> None:
    existing_vehicles = {v.vehicle_id: v for v in (await session.execute(select(Vehicle))).scalars()}
    counts["vehicle"] = 0
    driver_list = sorted(
        [p for p in staff.values() if p.role == "driver"],
        key=lambda p: 0 if p.email == "driver@example.com" else (1 if p.user_id is not None else 2),
    )
    for idx, row in enumerate(data.vehicles):
        vid = row["vehicle_id"]
        if vid in existing_vehicles:
            continue
        depot_code = "PEL" if "peliyagoda" in str(row["depot"]).lower() else "KDY"
        depot = depots.get(depot_code)
        driver = driver_list[idx] if idx < len(driver_list) else None

        veh = Vehicle(
            vehicle_id=vid,
            reg_number=f"WP-{vid[3:]}-5678",
            model_name=f"Isuzu {str(row['type']).capitalize()}",
            type=row["type"],
            temp=row["temp"],
            weight_cap_kg=float(row["weight_cap_kg"]),
            volume_cap_m3=float(row["volume_cap_m3"]),
            fuel_type=row.get("fuel_type", "diesel"),
            km_per_l=float(row["km_per_l"]),
            weekly_fuel_quota_l=float(row["weekly_fuel_quota_l"]),
            depot_id=depot.id if depot else list(depots.values())[0].id,
            assigned_driver_id=driver.id if driver else None,
            status="available",
            is_active=True,
        )
        session.add(veh)
        counts["vehicle"] += 1
    await session.flush()


async def seed_database(session: AsyncSession, reset: bool = False) -> dict[str, int]:
    """Hierarchical master seed and procedural operational pipeline."""
    if reset:
        for model in (
            VehicleTelemetry,
            ProofOfDelivery,
            DiscrepancyReport,
            LoadingChecklistItem,
            RouteLeg,
            Trip,
            DeferralAuditLog,
            OrderItem,
            CustomerOrder,
        ):
            await session.execute(delete(model))
        await session.flush()

    data = load_seed_data(include_demo=True)
    counts: dict[str, int] = {}
    try:
        users = await _seed_users(session, data, counts)
        depots = await _upsert(session, Depot, "code", data.depots, counts)
        brands = await _upsert(session, Brand, "code", data.brands, counts)

        district_rows = _mapped(data.districts, ("depot_code",), assigned_depot_id=lambda r: depots[r["depot_code"]].id)
        districts = await _upsert(session, District, "name", district_rows, counts)
        item_rows = _mapped(data.items, ("brand_code",), brand_id=lambda r: brands[r["brand_code"]].id)
        items = await _upsert(session, Item, "sku", item_rows, counts)

        depot_id_fn = lambda label: depots[resolve_depot(label, data.depots)].id  # noqa: E731
        outlet_rows = _mapped(
            data.outlets,
            ("brand", "district", "depot", "area", "address", "city"),
            name=lambda r: f"{brands[r['brand']].name} - {r['area']}",
            brand_id=lambda r: brands[r["brand"]].id,
            district_id=lambda r: districts[r["district"]].id,
            depot_id=lambda r: depot_id_fn(r["depot"]),
        )
        outlets = await _upsert(session, Outlet, "outlet_id", outlet_rows, counts)
        await _upsert(session, CalendarDay, "date", data.calendar, counts)
        staff = await _seed_staff(session, data, users, depots, outlets, counts)
        await _seed_vehicles(session, data, depots, staff, counts)

        # Legacy models
        vehicle_model_rows = [
            {
                "ID": r["ID"],
                "type": r["type"],
                "temp_condition": r.get("temp_condition") or r.get("temp"),
                "weight_cap_kg": r["weight_cap_kg"],
                "volume_cap_m3": r["volume_cap_m3"],
                "fuel_type": r["fuel_type"],
                "km_per_l": r["km_per_l"],
                "weekly_fuel_quota": r.get("weekly_fuel_quota") or r.get("weekly_fuel_quota_l", 0.0),
                "depot": r["depot"],
            }
            for r in data.vehicles
        ]
        await _upsert(session, VehicleModel, "ID", vehicle_model_rows, counts)
        await _upsert(session, RouteModel, "ID", data.routes, counts)
        await _upsert(session, ServiceAllowanceModel, "ID", data.allowances, counts)
        await _seed_prices(session, data, items, counts)
        await session.flush()

        # Execute procedural operational pipeline via domain services
        op_counts = await seed_operational_pipeline(
            session=session,
            users=users,
            depots=depots,
            outlets=outlets,
            items=items,
            target_date=sl_today() + timedelta(days=1),
            reset=reset,
        )
        counts.update(op_counts)
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    logger.info("Hierarchical database seed completed successfully: %s", counts)
    return counts


async def _seed_prices(session: AsyncSession, data: SeedData, items: dict[str, Item], counts: dict[str, int]) -> None:
    active = {
        p.item_id: p for p in (await session.execute(select(PriceList).where(PriceList.is_active.is_(True)))).scalars()
    }
    counts["price_list"] = 0
    for row in data.prices:
        item = items.get(row["sku"])
        if not item:
            continue
        item_id = item.id
        values = {k: v for k, v in row.items() if k != "sku"}
        current = active.get(item_id)
        if current is None:
            session.add(PriceList(item_id=item_id, effective_from=utc_today(), is_active=True, **values))
            counts["price_list"] += 1
            continue
        changed = {k: v for k, v in values.items() if getattr(current, k) != v}
        for k, v in changed.items():
            setattr(current, k, v)
        if changed:
            current.updated_at = utc_now()
            counts["price_list"] += 1


async def _run() -> None:
    from app.core.db import _create_tables, async_session_maker

    await _create_tables()
    async with async_session_maker() as session:
        print(await seed_database(session, reset=True))


if __name__ == "__main__":
    asyncio.run(_run())
