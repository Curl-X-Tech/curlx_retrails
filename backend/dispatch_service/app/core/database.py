"""
Dispatcher Service — Database Connection and Session Management.
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
    """Base declarative model with standard Waypoint audit tracking columns."""
    ID: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"DSP-{uuid.uuid4().hex[:6].upper()}",
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
    """Create all tables and guarantee column consistency via auto-migrations."""
    import app.models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Run safe idempotent DDL auto-migrations
        migration_statements = [
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
        for stmt in migration_statements:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass
