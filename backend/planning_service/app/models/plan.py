"""
Planning Engine Service — SQLAlchemy ORM Models.
"""

from __future__ import annotations

import datetime
from typing import Any
import uuid

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DispatchPlanModel(Base):
    __tablename__ = "dispatch_plans"

    status: Mapped[str] = mapped_column(String(20), default="DRAFT", nullable=False, index=True)
    planning_date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)
    solver_used: Mapped[str] = mapped_column(String(20), nullable=False)
    confirmed_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    confirmed_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)

    trips: Mapped[list["PlannedTripModel"]] = relationship(
        "PlannedTripModel",
        back_populates="plan",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="PlannedTripModel.trip_id",
    )


class PlannedTripModel(Base):
    __tablename__ = "planned_trips"

    trip_id: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        default=lambda: f"TRP-{uuid.uuid4().hex[:8].upper()}",
    )
    plan_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("dispatch_plans.ID", ondelete="CASCADE"), nullable=False, index=True
    )
    depot: Mapped[str] = mapped_column(String(30), nullable=False)
    district: Mapped[str] = mapped_column(String(64), nullable=False)
    brand: Mapped[str] = mapped_column(String(20), nullable=False)
    vehicle_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    allocation_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    allocation_source: Mapped[str] = mapped_column(String(20), default="AUTO", nullable=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    locked_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    locked_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    override_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    allocation_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_ids: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    order_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_weight_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_volume_m3: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    stop_schedule: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    plan: Mapped["DispatchPlanModel"] = relationship("DispatchPlanModel", back_populates="trips")


class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    plan_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    timestamp: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, nullable=False, index=True
    )
    actor: Mapped[str] = mapped_column(String(64), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    trip_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    vehicle_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    details: Mapped[str] = mapped_column(Text, nullable=False)
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
