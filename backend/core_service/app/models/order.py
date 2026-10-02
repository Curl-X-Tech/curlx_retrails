"""
Order Service — SQLAlchemy ORM Models.
"""

from __future__ import annotations

import datetime
from sqlalchemy import Date, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class OrderModel(Base):
    __tablename__ = "orders"

    outlet_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    order_date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)
    order_time: Mapped[str] = mapped_column(String(10), nullable=False)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    volume_m3: Mapped[float] = mapped_column(Float, nullable=False)
    temp_condition: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)
    allocation_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
