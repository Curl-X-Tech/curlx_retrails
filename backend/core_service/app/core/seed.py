import json
import logging
from datetime import date, time, timedelta
from pathlib import Path
from typing import Any

import anyio
from fastapi_users import exceptions
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.users import UserManager
from app.entities.brand import Brand
from app.entities.calendar_day import CalendarDay
from app.entities.depot import Depot
from app.entities.district import District
from app.entities.item import Item
from app.entities.outlet import Outlet
from app.entities.price_list import PriceList
from app.entities.user import User
from app.enums.master import DeliveryWindowType, DockType, ParkingConstraint
from app.enums.roles import UserType

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


async def _load_json_dataset(filename: str) -> list[dict[str, Any]]:
    """Loads a JSON dataset file from the backend/app/data directory."""
    file_path = DATA_DIR / filename
    if not file_path.exists():
        logger.warning("Dataset file %s does not exist.", file_path)
        return []
    content = await anyio.Path(file_path).read_text(encoding="utf-8")
    return json.loads(content)


async def seed_initial_users(session: AsyncSession) -> None:
    """Seeds initial superuser and development accounts for all 5 enterprise roles."""
    user_db = SQLAlchemyUserDatabase(session, User)
    user_manager = UserManager(user_db)

    # 1. Seed custom FIRST_SUPERUSER if provided in settings
    if settings.FIRST_SUPERUSER and settings.FIRST_SUPERUSER_PASSWORD:
        try:
            await user_manager.get_by_email(settings.FIRST_SUPERUSER)
        except exceptions.UserNotExists:
            hashed_pw = user_manager.password_helper.hash(settings.FIRST_SUPERUSER_PASSWORD)
            superuser = User(
                email=settings.FIRST_SUPERUSER,
                hashed_password=hashed_pw,
                name="Administrator",
                user_type=UserType.SYSTEM_ADMIN,
                is_active=True,
                is_verified=True,
            )
            session.add(superuser)
            await session.commit()
            logger.info("Created configured superuser: %s", settings.FIRST_SUPERUSER)

    # 2. Seed 5 standard enterprise dev accounts if in local/dev mode
    if settings.ENVIRONMENT in ("local", "dev", "development", "test"):
        users_data = await _load_json_dataset("dev_users.json")
        for seed_data in users_data:
            try:
                await user_manager.get_by_email(seed_data["email"])
            except exceptions.UserNotExists:
                hashed_pw = user_manager.password_helper.hash(seed_data["password"])
                user = User(
                    email=seed_data["email"],
                    hashed_password=hashed_pw,
                    name=seed_data["name"],
                    user_type=UserType(seed_data["user_type"]),
                    is_active=True,
                    is_verified=True,
                )
                session.add(user)
                await session.commit()
                logger.info(
                    "Seeded dev account: %s (%s)",
                    seed_data["email"],
                    seed_data["user_type"],
                )


async def seed_master_depots(session: AsyncSession) -> None:
    """Seeds central distribution centers and regional hubs from data/depots.json."""
    depots_data = await _load_json_dataset("depots.json")
    for depot_data in depots_data:
        result = await session.execute(select(Depot).where(Depot.code == depot_data["code"]))
        existing_depot = result.scalar_one_or_none()
        if not existing_depot:
            depot = Depot(
                code=depot_data["code"],
                name=depot_data["name"],
                latitude=depot_data["latitude"],
                longitude=depot_data["longitude"],
                address=depot_data["address"],
                is_active=depot_data["is_active"],
            )
            session.add(depot)
            await session.commit()
            logger.info(
                "Seeded master depot: %s (%s)",
                depot_data["name"],
                depot_data["code"],
            )


async def seed_master_districts(session: AsyncSession) -> None:
    """Seeds Western, Central, Southern, North Western, Uva, and Sabaragamuwa province districts."""
    depot_res = await session.execute(select(Depot))
    depots_by_code = {d.code: d.id for d in depot_res.scalars().all()}

    districts_data = await _load_json_dataset("districts.json")
    for dist_data in districts_data:
        result = await session.execute(select(District).where(District.name == dist_data["name"]))
        existing_district = result.scalar_one_or_none()
        if not existing_district and dist_data["depot_code"] in depots_by_code:
            district = District(
                name=dist_data["name"],
                province=dist_data["province"],
                assigned_depot_id=depots_by_code[dist_data["depot_code"]],
            )
            session.add(district)
            await session.commit()
            logger.info(
                "Seeded master district: %s (%s Province -> %s)",
                dist_data["name"],
                dist_data["province"],
                dist_data["depot_code"],
            )


async def seed_master_brands(session: AsyncSession) -> None:
    """Seeds retail brands from data/brands.json."""
    brands_data = await _load_json_dataset("brands.json")
    for brand_data in brands_data:
        result = await session.execute(select(Brand).where(Brand.code == brand_data["code"]))
        existing_brand = result.scalar_one_or_none()
        if not existing_brand:
            brand = Brand(
                code=brand_data["code"],
                name=brand_data["name"],
                delivery_window_type=DeliveryWindowType(brand_data["delivery_window_type"]),
                requires_cold_chain=brand_data["requires_cold_chain"],
                daily_time_budget_min=brand_data["daily_time_budget_min"],
            )
            session.add(brand)
            await session.commit()
            logger.info(
                "Seeded master brand: %s (%s)",
                brand_data["name"],
                brand_data["code"],
            )


async def seed_master_outlets(session: AsyncSession) -> None:
    """Seeds canonical 120 retail outlets with delivery windows and dock constraints."""
    outlets_data = await _load_json_dataset("outlets.json")
    if not outlets_data:
        return

    # Check if outlets are already seeded
    existing_count = await session.execute(select(Outlet.id))
    if len(existing_count.scalars().all()) >= 120:
        return

    depot_res = await session.execute(select(Depot))
    depots_by_code = {d.code: d.id for d in depot_res.scalars().all()}

    district_res = await session.execute(select(District))
    districts_by_name = {d.name: d.id for d in district_res.scalars().all()}

    brand_res = await session.execute(select(Brand))
    brands_by_code = {b.code: b.id for b in brand_res.scalars().all()}

    seeded_count = 0
    for row in outlets_data:
        outlet_code = row["outlet_id"]
        check = await session.execute(select(Outlet).where(Outlet.outlet_id == outlet_code))
        if check.scalar_one_or_none():
            continue

        brand_code = row["brand"].upper()
        district_name = row["district"]
        depot_code = row["depot"].upper()

        brand_id = brands_by_code.get(brand_code)
        district_id = districts_by_name.get(district_name)
        depot_id = depots_by_code.get(depot_code)

        if not (brand_id and district_id and depot_id):
            continue

        open_parts = [int(p) for p in row["window_open_time"].split(":")]
        close_parts = [int(p) for p in row["window_close_time"].split(":")]

        brand_name_display = "Fresh" if brand_code == "FRESH" else ("Style" if brand_code == "STYLE" else "Tech")
        outlet = Outlet(
            outlet_id=outlet_code,
            name=f"Waypoint {brand_name_display} - {district_name} ({outlet_code})",
            brand_id=brand_id,
            district_id=district_id,
            depot_id=depot_id,
            dock_type=DockType(row["dock_type"]),
            parking_constraint=ParkingConstraint(row["parking_constraint"]),
            mall_window=row["mall_window"],
            window_open_time=time(
                open_parts[0],
                open_parts[1],
                open_parts[2] if len(open_parts) > 2 else 0,
            ),
            window_close_time=time(
                close_parts[0],
                close_parts[1],
                close_parts[2] if len(close_parts) > 2 else 0,
            ),
            is_active=True,
        )
        session.add(outlet)
        seeded_count += 1

    if seeded_count > 0:
        await session.commit()
        logger.info("Successfully seeded %d master retail outlets.", seeded_count)


async def seed_master_items(session: AsyncSession) -> None:
    """Seeds catalog product items and SKUs across retail brands from data/items.json."""
    items_data = await _load_json_dataset("items.json")
    if not items_data:
        return

    brand_res = await session.execute(select(Brand))
    brands_by_code = {b.code: b.id for b in brand_res.scalars().all()}

    seeded_count = 0
    for row in items_data:
        sku = row["sku"].upper()
        check = await session.execute(select(Item).where(Item.sku == sku))
        if check.scalar_one_or_none():
            continue

        brand_code = row["brand_code"].upper()
        brand_id = brands_by_code.get(brand_code)
        if not brand_id:
            continue

        item = Item(
            sku=sku,
            brand_id=brand_id,
            name=row["name"],
            category=row["category"],
            unit=row.get("unit", "Nos"),
            unit_weight_kg=float(row["unit_weight_kg"]),
            unit_volume_m3=float(row["unit_volume_m3"]),
            requires_cold_chain=row.get("requires_cold_chain", False),
            special_handling_code=row.get("special_handling_code"),
        )
        session.add(item)
        seeded_count += 1

    if seeded_count > 0:
        await session.commit()
        logger.info("Successfully seeded %d master catalog items.", seeded_count)


async def seed_master_prices(session: AsyncSession) -> None:
    """Seeds temporal pricing records for catalog items from data/prices.json."""
    prices_data = await _load_json_dataset("prices.json")
    if not prices_data:
        return

    item_res = await session.execute(select(Item))
    items_by_sku = {i.sku: i.id for i in item_res.scalars().all()}

    seeded_count = 0
    for row in prices_data:
        sku = row["sku"].upper()
        item_id = items_by_sku.get(sku)
        if not item_id:
            continue

        check = await session.execute(
            select(PriceList).where(
                PriceList.item_id == item_id,
                PriceList.is_active.is_(True),
            )
        )
        if check.scalar_one_or_none():
            continue

        price = PriceList(
            item_id=item_id,
            cost_price=float(row["cost_price"]),
            unit_price=float(row["unit_price"]),
            currency=row.get("currency", "LKR"),
            price_change_reason=row.get("price_change_reason", "standard_pricing"),
            is_active=True,
        )
        session.add(price)
        seeded_count += 1

    if seeded_count > 0:
        await session.commit()
        logger.info("Successfully seeded %d master item price records.", seeded_count)


async def seed_master_calendar(session: AsyncSession) -> None:
    """Seeds operational calendar days for 2026 including SL holidays, paydays, and monsoon seasons."""
    count_res = await session.execute(select(CalendarDay.date).limit(10))
    if len(count_res.scalars().all()) >= 10:
        return

    holidays_data = await _load_json_dataset("holidays_2026.json")
    festivals_by_date = {
        date.fromisoformat(h["date"]): (
            h["name"],
            float(h["festival_ramp"]),
            bool(h["is_holiday"]),
        )
        for h in holidays_data
    }

    start_date = date(2026, 1, 1)
    end_date = date(2026, 12, 31)
    current = start_date

    days_to_add: list[CalendarDay] = []
    while current <= end_date:
        dow = current.weekday()
        dow_name = current.strftime("%a")
        iso_year, iso_week, _ = current.isocalendar()
        is_weekend = dow == 6
        is_payday = 25 <= current.day <= 28
        monsoon = current.month in (5, 6, 7, 8, 9, 10, 11, 12)

        festival_info = festivals_by_date.get(current)
        festival = festival_info[0] if festival_info else None
        festival_ramp = festival_info[1] if festival_info else 0.0
        is_holiday = festival_info[2] if festival_info else False

        is_operating = not is_weekend and not is_holiday

        calendar_day = CalendarDay(
            date=current,
            dow=dow,
            dow_name=dow_name,
            is_weekend=is_weekend,
            iso_year=iso_year,
            iso_week=iso_week,
            is_payday=is_payday,
            festival=festival,
            festival_ramp=festival_ramp,
            is_holiday=is_holiday,
            monsoon=monsoon,
            is_operating=is_operating,
        )
        days_to_add.append(calendar_day)
        current += timedelta(days=1)

    session.add_all(days_to_add)
    await session.commit()
    logger.info("Successfully seeded %d calendar days for year 2026.", len(days_to_add))
