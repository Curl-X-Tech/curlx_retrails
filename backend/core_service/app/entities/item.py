import uuid
from typing import Any

from sqlmodel import Field

from app.entities.base import BaseEntity


class Item(BaseEntity, table=True):
    """Item database entity representing catalog products, SKUs, and cargo specifications."""

    __tablename__ = "item"

    sku: str = Field(unique=True, index=True, nullable=False)
    brand_id: uuid.UUID = Field(foreign_key="brand.id", nullable=False, index=True)
    name: str = Field(nullable=False)
    category: str = Field(nullable=False, index=True)
    unit: str = Field(default="Nos", nullable=False)
    unit_weight_kg: float = Field(nullable=False)
    unit_volume_m3: float = Field(nullable=False)
    requires_cold_chain: bool = Field(default=False, nullable=False)
    special_handling_code: str | None = Field(default=None, nullable=True)

    def __init__(self, **data: Any):
        super().__init__(**data)
