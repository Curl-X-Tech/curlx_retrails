"""
Core Service -- DB compatibility module for FastAPI-Users and authentication.
"""

from collections.abc import Generator
from typing import Annotated, AsyncGenerator
from fastapi import Depends
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, sessionmaker
from sqlmodel import SQLModel

from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine, init_db
from app.entities.user import User

Base = SQLModel
async_engine = engine
async_session_maker = AsyncSessionLocal

sync_connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    sync_connect_args["check_same_thread"] = False

sync_db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg://").replace(
    "sqlite+aiosqlite://", "sqlite://"
)
sync_engine = create_engine(sync_db_url, echo=False, connect_args=sync_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def get_user_db(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> AsyncGenerator[SQLAlchemyUserDatabase, None]:
    yield SQLAlchemyUserDatabase(session, User)


__all__ = [
    "Base",
    "engine",
    "async_engine",
    "sync_engine",
    "SessionLocal",
    "AsyncSessionLocal",
    "async_session_maker",
    "get_db",
    "get_async_session",
    "get_user_db",
    "init_db",
]
