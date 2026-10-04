"""
Vehicle Manager Service — Vehicle ORM Model.
"""

from __future__ import annotations

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class VehicleModel(Base):
    __tablename__ = "vehicles"

    type: Mapped[str] = mapped_column(String(20), nullable=False)
    temp_condition: Mapped[str] = mapped_column(String(20), nullable=False)
    weight_cap_kg: Mapped[float] = mapped_column(Float, nullable=False)
    volume_cap_m3: Mapped[float] = mapped_column(Float, nullable=False)
    fuel_type: Mapped[str] = mapped_column(String(30), nullable=False)
    km_per_l: Mapped[float] = mapped_column(Float, nullable=False)
    weekly_fuel_quota: Mapped[float] = mapped_column(Float, nullable=False)
    depot: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    service_milage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    trip_count_today: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_per_day_trip_count: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
