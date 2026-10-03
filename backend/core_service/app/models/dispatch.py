"""
Dispatcher Service — LiveTrip / RunSheet ORM Model.
"""

from __future__ import annotations

import datetime
from typing import Any
import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class LiveTripModel(Base):
    __tablename__ = "live_trips"

    trip_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        default=lambda: f"TRP-{uuid.uuid4().hex[:8].upper()}",
    )
    vehicle_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    driver_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("drivers.ID", ondelete="SET NULL"), nullable=True, index=True
    )
    depot: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(64), nullable=False)
    brand: Mapped[str] = mapped_column(String(20), nullable=False)
    trip_date: Mapped[str] = mapped_column(
        String(10),
        default=lambda: datetime.date.today().isoformat(),
        nullable=False,
        index=True,
    )
    planned_dispatch: Mapped[str] = mapped_column(String(10), nullable=False, default="06:00")
    planned_return: Mapped[str | None] = mapped_column(String(10), nullable=True, default="12:00")
    live_status: Mapped[str] = mapped_column(String(20), default="scheduled", nullable=False, index=True)
    departed_at: Mapped[str | None] = mapped_column(String(10), nullable=True)
    completed_at: Mapped[str | None] = mapped_column(String(10), nullable=True)
    delay_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    delay_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stops: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    allocated_from: Mapped[str] = mapped_column(String(20), default="AUTO", nullable=False)
    plan_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    is_manual: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    override_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    authorized_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    odometer_start_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    odometer_end_km: Mapped[float | None] = mapped_column(Float, nullable=True)
