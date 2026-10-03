"""
Database connection, session management, and declarative Base for operational models.
"""

from __future__ import annotations

import datetime
from typing import AsyncGenerator
import uuid

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.db import async_engine, async_session_maker

engine = async_engine
AsyncSessionLocal = async_session_maker


def _generate_default_id() -> str:
    return f"WAY-{uuid.uuid4().hex[:8].upper()}"


class Base(DeclarativeBase):
    """Shared declarative base for operational domain models."""

    ID: Mapped[str] = mapped_column(String(64), primary_key=True, default=_generate_default_id)
    CreateTime: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    UpdateTime: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False
    )
    CreatedBy: Mapped[str | None] = mapped_column(String(64), nullable=True)
    UpdatedBy: Mapped[str | None] = mapped_column(String(64), nullable=True)
    IsActive: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency yielding an active async session for database operations."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
