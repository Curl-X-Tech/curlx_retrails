"""
Route Management Service — ServiceAllowance ORM Model.
"""

from __future__ import annotations

from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ServiceAllowanceModel(Base):
    __tablename__ = "service_allowances"

    brand: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    dock_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    service_allowance_min: Mapped[float] = mapped_column(Float, nullable=False)
