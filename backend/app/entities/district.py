import uuid
from typing import Any

from sqlmodel import Field

from app.entities.base import BaseEntity


class District(BaseEntity, table=True):
    """District database entity representing administrative geographical service boundaries."""

    __tablename__ = "district"

    province: str = Field(nullable=False, index=True)
    assigned_depot_id: uuid.UUID = Field(
        foreign_key="depot.id", nullable=False, index=True
    )

    def __init__(self, **data: Any):
        super().__init__(**data)
