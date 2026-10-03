import asyncio
import logging
from datetime import datetime, timezone
from collections.abc import Callable
from typing import Any

from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.timezone import utc_now, utc_today
from app.core.users import UserManager
from app.db.seed_json import SeedData, load_seed_data, resolve_depot
from app.entities.brand import Brand
from app.entities.calendar_day import CalendarDay
from app.entities.depot import Depot
from app.entities.district import District
from app.entities.item import Item
from app.entities.outlet import Outlet
from app.entities.price_list import PriceList
from app.entities.user import User
from app.enums.roles import UserType
from app.models.audit import DispatchAuditLogModel
from app.models.dispatch import LiveTripModel
from app.models.driver import DriverModel
from app.models.order import OrderModel
from app.models.route import RouteModel
from app.models.service_allowance import ServiceAllowanceModel
from app.models.vehicle import VehicleModel

logger = logging.getLogger(__name__)

DEMO_ENVIRONMENTS = ("local", "dev", "development", "test")


def _same(current: Any, new: Any) -> bool:
    if isinstance(current, datetime) and isinstance(new, datetime):
        return current.replace(tzinfo=None) == new.astimezone(timezone.utc).replace(tzinfo=None)
    return current == new


async def _upsert(
    session: AsyncSession, model: type, key: str, rows: list[dict[str, Any]], counts: dict[str, int]
) -> dict[Any, Any]:
    """Inserts rows missing by natural key and updates changed ones. Returns key -> instance."""
    existing = {getattr(o, key): o for o in (await session.execute(select(model))).scalars()}
    name = model.__tablename__
    counts.setdefault(name, 0)
    for row in rows:
        obj = existing.get(row[key])
        if obj is None:
            obj = model(**row)
            session.add(obj)
            existing[row[key]] = obj
            counts[name] += 1
            continue
        changed = {k: v for k, v in row.items() if k not in ("ID", "id") and not _same(getattr(obj, k), v)}
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
    if settings.FIRST_SUPERUSER and settings.FIRST_SUPERUSER_PASSWORD:
        rows.append(
            {
                "email": str(settings.FIRST_SUPERUSER).lower(),
                "password": settings.FIRST_SUPERUSER_PASSWORD,
                "name": "Administrator",
                "user_type": UserType.SYSTEM_ADMIN,
            }
        )
    existing = {u.email: u for u in (await session.execute(select(User))).scalars()}
    counts["users"] = 0
    for row in rows:
        if row["email"] in existing:
            continue
        user = User(
            email=row["email"],
            hashed_password=manager.password_helper.hash(row["password"]),
            name=row["name"],
            user_type=row["user_type"],
            is_active=True,
            is_verified=True,
        )
        session.add(user)
        existing[row["email"]] = user
        counts["users"] += 1
    return existing


async def seed_database(session: AsyncSession) -> dict[str, int]:
    """Validates every CSV, then seeds all tables in one transaction. Returns rows written per table."""
    data = load_seed_data(include_demo=settings.ENVIRONMENT in DEMO_ENVIRONMENTS)
    counts: dict[str, int] = {}
    try:
        users = await _seed_users(session, data, counts)

        depots = await _upsert(session, Depot, "code", data.depots, counts)
        brands = await _upsert(session, Brand, "code", data.brands, counts)
        depot_id = lambda label: depots[resolve_depot(label, data.depots)].id  # noqa: E731

        district_rows = _mapped(data.districts, ("depot_code",), assigned_depot_id=lambda r: depots[r["depot_code"]].id)
        districts = await _upsert(session, District, "name", district_rows, counts)
        item_rows = _mapped(data.items, ("brand_code",), brand_id=lambda r: brands[r["brand_code"]].id)
        items = await _upsert(session, Item, "sku", item_rows, counts)

        outlet_rows = _mapped(
            data.outlets,
            ("brand", "district", "depot"),
            name=lambda r: (
                f"Waypoint {brands[r['brand']].name.removeprefix('Waypoint ')} - {r['district']} ({r['outlet_id']})"
            ),
            brand_id=lambda r: brands[r["brand"]].id,
            district_id=lambda r: districts[r["district"]].id,
            depot_id=lambda r: depot_id(r["depot"]),
        )
        await _upsert(session, Outlet, "outlet_id", outlet_rows, counts)
        await _upsert(session, CalendarDay, "date", data.calendar, counts)
        await _upsert(session, VehicleModel, "ID", data.vehicles, counts)
        await _upsert(session, RouteModel, "ID", data.routes, counts)
        await _upsert(session, ServiceAllowanceModel, "ID", data.allowances, counts)
        await session.flush()

        await _seed_prices(session, data, items, counts)
        await _seed_drivers(session, data, users, counts)
        await _seed_operations(session, data, users, counts)
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    logger.info("Seed complete (rows inserted or updated): %s", counts)
    return counts


async def _seed_prices(session: AsyncSession, data: SeedData, items: dict[str, Item], counts: dict[str, int]) -> None:
    active = {
        p.item_id: p for p in (await session.execute(select(PriceList).where(PriceList.is_active.is_(True)))).scalars()
    }
    counts["price_list"] = 0
    for row in data.prices:
        item_id = items[row["sku"]].id
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


async def _seed_drivers(session: AsyncSession, data: SeedData, users: dict[str, User], counts: dict[str, int]) -> None:
    await session.flush()
    rows = [
        {
            "ID": str(users[r["email"]].id),
            "name": users[r["email"]].name,
            "license_no": r["license_no"],
            "phone": r["phone"],
            "depot": r["depot"],
        }
        for r in data.drivers
    ]
    await _upsert(session, DriverModel, "license_no", rows, counts)


async def _seed_operations(
    session: AsyncSession, data: SeedData, users: dict[str, User], counts: dict[str, int]
) -> None:
    await session.flush()
    uid = lambda email: str(users[email].id) if email else None  # noqa: E731
    await _upsert(session, OrderModel, "ID", data.orders, counts)
    trip_rows = _mapped(
        data.trips,
        ("driver_email", "authorized_by_email"),
        driver_id=lambda r: uid(r["driver_email"]),
        authorized_by=lambda r: uid(r["authorized_by_email"]),
    )
    await _upsert(session, LiveTripModel, "ID", trip_rows, counts)
    await session.flush()
    log_rows = _mapped(
        data.logs,
        ("actor_email", "driver_email"),
        actor=lambda r: uid(r["actor_email"]),
        driver_id=lambda r: uid(r["driver_email"]),
    )
    await _upsert(session, DispatchAuditLogModel, "ID", log_rows, counts)


async def _run() -> None:
    from app.core.db import _create_tables, async_session_maker

    await _create_tables()
    async with async_session_maker() as session:
        print(await seed_database(session))


if __name__ == "__main__":
    asyncio.run(_run())
