import logging

from fastapi_users import exceptions
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.users import UserManager
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
