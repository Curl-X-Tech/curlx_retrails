import uuid
from datetime import date
from typing import Any

from sqlmodel import Field

from app.entities.base import BaseEntity, utc_today


class PriceList(BaseEntity, table=True):
    """PriceList database entity representing temporal pricing, buying cost, and retail valuations."""

    __tablename__ = "price_list"

    item_id: uuid.UUID = Field(
        foreign_key="item.id", nullable=False, index=True, ondelete="CASCADE"
    )
    cost_price: float = Field(default=0.00, nullable=False)
    unit_price: float = Field(default=0.00, nullable=False)
    currency: str = Field(default="LKR", nullable=False)
    effective_from: date = Field(default_factory=utc_today, nullable=False)
    effective_to: date | None = Field(default=None, nullable=True)
    price_change_reason: str | None = Field(default=None, nullable=True)
    is_active: bool = Field(default=True, nullable=False)

    def __init__(self, **data: Any):
        super().__init__(**data)
