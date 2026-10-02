"""
Core Service — Database connection and session management.
"""

from __future__ import annotations

from datetime import datetime
from typing import AsyncGenerator
import uuid

from sqlalchemy import Boolean, DateTime, String, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import get_settings


def _normalize_db_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def _generate_default_id() -> str:
    return f"WAY-{uuid.uuid4().hex[:8].upper()}"


settings = get_settings()
engine = create_async_engine(
    _normalize_db_url(settings.DATABASE_URL),
    echo=False,
    pool_pre_ping=True,
    pool_size=15,
    max_overflow=30,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Shared declarative base for all core_service domain models."""

    ID: Mapped[str] = mapped_column(String(64), primary_key=True, default=_generate_default_id)
    CreateTime: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    UpdateTime: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    CreatedBy: Mapped[str | None] = mapped_column(String(64), nullable=True)
    UpdatedBy: Mapped[str | None] = mapped_column(String(64), nullable=True)
    IsActive: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
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
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Idempotent DDL auto-migrations carried over from merged services
        migrations = [
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
