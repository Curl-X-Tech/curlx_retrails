from typing import Any

from sqlmodel import Field

from app.entities.base import BaseEntity


class Depot(BaseEntity, table=True):
    """Depot database entity representing central distribution centers and regional hubs."""

    __tablename__ = "depot"

    code: str = Field(unique=True, index=True, nullable=False)
    latitude: float = Field(nullable=False)
    longitude: float = Field(nullable=False)
    address: str | None = Field(default=None, nullable=True)
    is_active: bool = Field(default=True, nullable=False)

    def __init__(self, **data: Any):
        super().__init__(**data)
