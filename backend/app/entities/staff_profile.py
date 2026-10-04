import uuid
from datetime import date
from typing import Any

from sqlmodel import Field

from app.entities.base import BaseEntity


class StaffProfile(BaseEntity, table=True):
    """Staff profile entity holding depot assignment and driver credentials."""

    __tablename__ = "staff_profile"

    user_id: uuid.UUID | None = Field(default=None, foreign_key="users.id", unique=True, index=True)
    employee_code: str = Field(unique=True, index=True, nullable=False)
    first_name: str = Field(nullable=False)
    last_name: str = Field(default="", nullable=False)
    email: str = Field(unique=True, index=True, nullable=False)
    phone: str = Field(nullable=False)
    role: str = Field(index=True, nullable=False)
    depot_id: uuid.UUID | None = Field(default=None, foreign_key="depot.id", index=True)
    outlet_id: uuid.UUID | None = Field(default=None, foreign_key="outlet.id", index=True)
    blood_group: str | None = Field(default=None, nullable=True)
    license_number: str | None = Field(default=None, unique=True, nullable=True)
    license_class: str | None = Field(default=None, nullable=True)
    license_expiry: date | None = Field(default=None, nullable=True)
    safety_rating: float = Field(default=5.0, nullable=False)
    total_completed_trips: int = Field(default=0, nullable=False)
    is_active: bool = Field(default=True, nullable=False)

    def __init__(self, **data: Any):
        super().__init__(**data)
