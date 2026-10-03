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
from app.entities.user import User

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
        import app.models  # noqa: F401
        from app.core.database import Base

        async with async_engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
            await conn.run_sync(Base.metadata.create_all)
            if "postgresql" in settings.ASYNC_DATABASE_URI:
                from sqlalchemy import text

                migrations = [
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE NOT NULL;",
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID;",
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by UUID;",
                    "ALTER TABLE live_trips ADD COLUMN IF NOT EXISTS trip_date VARCHAR(10) DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');",
                    "ALTER TABLE live_trips ADD COLUMN IF NOT EXISTS planned_return VARCHAR(10) DEFAULT '12:00';",
                    "ALTER TABLE live_trips ADD COLUMN IF NOT EXISTS delay_reason VARCHAR(255);",
                    "ALTER TABLE live_trips ADD COLUMN IF NOT EXISTS override_reason TEXT;",
                    "ALTER TABLE live_trips ADD COLUMN IF NOT EXISTS authorized_by VARCHAR(64);",
                    "ALTER TABLE live_trips ADD COLUMN IF NOT EXISTS odometer_start_km DOUBLE PRECISION;",
                    "ALTER TABLE live_trips ADD COLUMN IF NOT EXISTS odometer_end_km DOUBLE PRECISION;",
                    "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;",
                    "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_checkin_time VARCHAR(10);",
                    "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS checkin_depot VARCHAR(30);",
                ]
                for stmt in migrations:
                    try:
                        await conn.execute(text(stmt))
                    except Exception:
                        pass
    except (SQLAlchemyError, OSError) as exc:
        logger.error("Failed to initialize database tables: %s", exc)
        raise


async def init_db() -> None:
    from app.core.seed import (
        seed_initial_users,
        seed_master_brands,
        seed_master_calendar,
        seed_master_depots,
        seed_master_districts,
        seed_master_items,
        seed_master_outlets,
        seed_master_prices,
    )

    await _create_tables()
    async with async_session_maker() as session:
        await seed_initial_users(session)
        await seed_master_depots(session)
        await seed_master_districts(session)
        await seed_master_brands(session)
        await seed_master_outlets(session)
        await seed_master_items(session)
        await seed_master_prices(session)
        await seed_master_calendar(session)
