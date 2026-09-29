"""
Dispatcher Service — Driver ORM Model.
"""

from __future__ import annotations

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DriverModel(Base):
    __tablename__ = "drivers"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    license_no: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    depot: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    checked_in: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_checkin_time: Mapped[str | None] = mapped_column(String(10), nullable=True)
    checkin_depot: Mapped[str | None] = mapped_column(String(30), nullable=True)
