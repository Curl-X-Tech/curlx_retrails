"""
Dispatcher Service — Audit Log ORM Model.
"""

from __future__ import annotations

import datetime
from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DispatchAuditLogModel(Base):
    __tablename__ = "dispatch_audit_logs"

    timestamp: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
        index=True,
    )
    actor: Mapped[str] = mapped_column(String(64), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    trip_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    vehicle_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    driver_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
