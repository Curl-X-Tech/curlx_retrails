import logging
from collections.abc import AsyncGenerator, Generator
from typing import Annotated

from fastapi import Depends
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlmodel import SQLModel

from app.core.config import settings
from app.models import User, UserType

logger = logging.getLogger(__name__)

# Base model alias for SQLAlchemy / SQLModel table metadata
Base = SQLModel

# Synchronous engine and session for compatibility
sync_connect_args = {}
if "sqlite" in settings.SYNC_DATABASE_URI:
    sync_connect_args["check_same_thread"] = False

engine = create_engine(
    settings.SYNC_DATABASE_URI,
    echo=False,
    connect_args=sync_connect_args,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session


# Asynchronous engine and session for fastapi-users and async endpoints
async_connect_args = {}
if "sqlite" in settings.ASYNC_DATABASE_URI:
    async_connect_args["check_same_thread"] = False

async_engine = create_async_engine(
    settings.ASYNC_DATABASE_URI,
    echo=False,
    connect_args=async_connect_args,
)

async_session_maker = async_sessionmaker(
    async_engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


async def get_user_db(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    yield SQLAlchemyUserDatabase(session, User)


async def _create_tables() -> None:
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
            if "postgresql" in settings.ASYNC_DATABASE_URI:
                from sqlalchemy import text

                await conn.execute(
                    text(
                        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE NOT NULL;"
                    )
                )
                await conn.execute(
                    text("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID;")
                )
                await conn.execute(
                    text("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by UUID;")
                )
    except (SQLAlchemyError, OSError) as exc:
        logger.error("Failed to initialize database tables: %s", exc)
        raise



async def _seed_initial_superuser(session: AsyncSession) -> None:
    if not (settings.FIRST_SUPERUSER and settings.FIRST_SUPERUSER_PASSWORD):
        return

    from fastapi_users import exceptions

    from app.core.users import UserManager

    user_db = SQLAlchemyUserDatabase(session, User)
    user_manager = UserManager(user_db)
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
        )
        session.add(superuser)
        await session.commit()
        await session.refresh(superuser)
        logger.info("Created initial superuser: %s", settings.FIRST_SUPERUSER)


async def init_db() -> None:
    await _create_tables()
    async with async_session_maker() as session:
        await _seed_initial_superuser(session)
