"""
Order Service — Database Connection and Session Management.

Uses SQLAlchemy 2.0 async engine with asyncpg driver.
Supports standard PostgreSQL connection strings (converts postgresql:// to postgresql+asyncpg://).
"""

from __future__ import annotations

from datetime import datetime
from typing import AsyncGenerator
import uuid

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import get_settings


def _normalize_db_url(url: str) -> str:
    """Ensure asyncpg driver is specified for PostgreSQL URLs."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


settings = get_settings()
engine = create_async_engine(
    _normalize_db_url(settings.DATABASE_URL),
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """
    Base declarative model with standard Waypoint audit tracking columns.
    Mirrors models/Base.py domain entity.
    """
    ID: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"ORD-{uuid.uuid4().hex[:8].upper()}",
    )
    CreateTime: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    UpdateTime: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    CreatedBy: Mapped[str | None] = mapped_column(String(64), nullable=True)
    UpdatedBy: Mapped[str | None] = mapped_column(String(64), nullable=True)
    IsActive: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables registered with Base metadata (used during startup/migrations)."""
    import app.models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
