import uuid
from datetime import time
from typing import Any

from sqlmodel import Field

from app.entities.base import BaseEntity
from app.enums.master import DockType, ParkingConstraint


class Outlet(BaseEntity, table=True):
    """Outlet database entity representing retail stores and delivery destinations."""

    __tablename__ = "outlet"

    outlet_id: str = Field(unique=True, index=True, nullable=False)
    brand_id: uuid.UUID = Field(foreign_key="brand.id", nullable=False, index=True)
    district_id: uuid.UUID = Field(
        foreign_key="district.id", nullable=False, index=True
    )
    depot_id: uuid.UUID = Field(foreign_key="depot.id", nullable=False, index=True)
    dock_type: DockType = Field(nullable=False)
    parking_constraint: ParkingConstraint = Field(nullable=False)
    mall_window: str | None = Field(default=None, nullable=True)
    window_open_time: time = Field(nullable=False)
    window_close_time: time = Field(nullable=False)
    latitude: float | None = Field(default=None, nullable=True)
    longitude: float | None = Field(default=None, nullable=True)
    contact_phone: str | None = Field(default=None, nullable=True)
    is_active: bool = Field(default=True, nullable=False)

    def __init__(self, **data: Any):
        super().__init__(**data)
