import logging

from fastapi_users import exceptions
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.users import UserManager
from app.entities.depot import Depot
from app.entities.district import District
from app.entities.user import User
from app.enums.roles import UserType

logger = logging.getLogger(__name__)

DEFAULT_DEV_SEED_USERS = [
    {
        "email": "admin@curlx.tech",
        "password": "Password123!",
        "name": "System Administrator",
        "user_type": UserType.SYSTEM_ADMIN,
    },
    {
        "email": "dispatcher@curlx.tech",
        "password": "Password123!",
        "name": "K. Jayawardena",
        "user_type": UserType.DISPATCHER,
    },
    {
        "email": "driver@curlx.tech",
        "password": "Password123!",
        "name": "Sunil Shantha",
        "user_type": UserType.DRIVER,
    },
    {
        "email": "loader@curlx.tech",
        "password": "Password123!",
        "name": "Nuwan Pradeep",
        "user_type": UserType.LOADER,
    },
    {
        "email": "store@curlx.tech",
        "password": "Password123!",
        "name": "Anoma Wickramasinghe",
        "user_type": UserType.STORE_MANAGER,
    },
]

DEFAULT_MASTER_DEPOTS = [
    {
        "code": "PEL",
        "name": "Peliyagoda Central DC",
        "latitude": 6.9649,
        "longitude": 79.8872,
        "address": "Peliyagoda Distribution Center, Western Province",
        "is_active": True,
    },
    {
        "code": "KDY",
        "name": "Kandy Regional Hub",
        "latitude": 7.2906,
        "longitude": 80.6337,
        "address": "Kandy Logistics Hub, Central Province",
        "is_active": True,
    },
]

DEFAULT_MASTER_DISTRICTS = [
    {"name": "Colombo", "province": "Western", "depot_code": "PEL"},
    {"name": "Gampaha", "province": "Western", "depot_code": "PEL"},
    {"name": "Kalutara", "province": "Western", "depot_code": "PEL"},
    {"name": "Kandy", "province": "Central", "depot_code": "KDY"},
    {"name": "Matale", "province": "Central", "depot_code": "KDY"},
    {"name": "Nuwara Eliya", "province": "Central", "depot_code": "KDY"},
]


async def seed_initial_users(session: AsyncSession) -> None:
    """Seeds initial superuser and development accounts for all 5 enterprise roles."""
    user_db = SQLAlchemyUserDatabase(session, User)
    user_manager = UserManager(user_db)

    # 1. Seed custom FIRST_SUPERUSER if provided in settings
    if settings.FIRST_SUPERUSER and settings.FIRST_SUPERUSER_PASSWORD:
        try:
            await user_manager.get_by_email(settings.FIRST_SUPERUSER)
        except exceptions.UserNotExists:
            hashed_pw = user_manager.password_helper.hash(
                settings.FIRST_SUPERUSER_PASSWORD
            )
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
        for seed_data in DEFAULT_DEV_SEED_USERS:
            try:
                await user_manager.get_by_email(seed_data["email"])
            except exceptions.UserNotExists:
                hashed_pw = user_manager.password_helper.hash(seed_data["password"])
                user = User(
                    email=seed_data["email"],
                    hashed_password=hashed_pw,
                    name=seed_data["name"],
                    user_type=seed_data["user_type"],
                    is_active=True,
                    is_verified=True,
                )
                session.add(user)
                await session.commit()
                logger.info(
                    "Seeded dev account: %s (%s)",
                    seed_data["email"],
                    seed_data["user_type"].value,
                )


async def seed_master_depots(session: AsyncSession) -> None:
    """Seeds central distribution centers and regional hubs if they do not exist."""
    for depot_data in DEFAULT_MASTER_DEPOTS:
        result = await session.execute(
            select(Depot).where(Depot.code == depot_data["code"])
        )
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
    """Seeds Western and Central province districts mapped to depots."""
    depot_res = await session.execute(select(Depot))
    depots_by_code = {d.code: d.id for d in depot_res.scalars().all()}

    for dist_data in DEFAULT_MASTER_DISTRICTS:
        result = await session.execute(
            select(District).where(District.name == dist_data["name"])
        )
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
