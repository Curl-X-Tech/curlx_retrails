"""
Outlet Manager Service — SQLAlchemy ORM Models.
"""

from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class OutletModel(Base):
    __tablename__ = "outlets"

    brand: Mapped[str] = mapped_column(String(20), nullable=False)
    district: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    depot: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    dock_type: Mapped[str] = mapped_column(String(30), nullable=False)
    parking_constraint: Mapped[str] = mapped_column(String(30), nullable=False)
    mall_window: Mapped[str | None] = mapped_column(String(30), nullable=True)
    window_open_time: Mapped[str] = mapped_column(String(10), nullable=False)
    window_close_time: Mapped[str] = mapped_column(String(10), nullable=False)
