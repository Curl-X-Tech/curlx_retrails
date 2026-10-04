"""
Route Management Service — Route ORM Model.
"""

from __future__ import annotations

from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RouteModel(Base):
    __tablename__ = "routes"

    district: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    depot: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    road_class: Mapped[str] = mapped_column(String(30), nullable=False)
    free_flow_kmh: Mapped[float] = mapped_column(Float, nullable=False)
    depot_to_district_km: Mapped[float] = mapped_column(Float, nullable=False)
    depot_to_district_freeflow_min: Mapped[float] = mapped_column(Float, nullable=False)
    inter_stop_km: Mapped[float] = mapped_column(Float, nullable=False)
    inter_stop_freeflow_min: Mapped[float] = mapped_column(Float, nullable=False)
