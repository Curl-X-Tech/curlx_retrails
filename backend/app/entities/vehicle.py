import uuid
from typing import Any

from sqlmodel import Field

from app.entities.base import BaseEntity


class Vehicle(BaseEntity, table=True):
    """Fleet vehicle entity with capacity, fuel budget and live status."""

    __tablename__ = "vehicle"

    vehicle_id: str = Field(unique=True, index=True, nullable=False)
    reg_number: str = Field(unique=True, index=True, nullable=False)
    model_name: str = Field(nullable=False)
    type: str = Field(index=True, nullable=False)
    temp: str = Field(index=True, nullable=False)
    weight_cap_kg: float = Field(nullable=False)
    volume_cap_m3: float = Field(nullable=False)
    fuel_type: str = Field(default="diesel", nullable=False)
    km_per_l: float = Field(nullable=False)
    weekly_fuel_quota_l: float = Field(nullable=False)
    consumed_fuel_l: float = Field(default=0.0, nullable=False)
    depot_id: uuid.UUID = Field(foreign_key="depot.id", nullable=False, index=True)
    assigned_driver_id: uuid.UUID | None = Field(default=None, foreign_key="staff_profile.id", index=True)
    status: str = Field(default="available", index=True, nullable=False)
    is_active: bool = Field(default=True, nullable=False)

    def __init__(self, **data: Any):
        super().__init__(**data)
