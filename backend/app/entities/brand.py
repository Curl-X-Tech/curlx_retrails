from typing import Any

from sqlmodel import Field

from app.entities.base import BaseEntity
from app.enums.master import DeliveryWindowType


class Brand(BaseEntity, table=True):
    """Brand database entity (Waypoint Fresh, Waypoint Style, Waypoint Tech)."""

    __tablename__ = "brand"

    code: str = Field(unique=True, index=True, nullable=False)
    delivery_window_type: DeliveryWindowType = Field(
        default=DeliveryWindowType.STANDARD_RETAIL,
        nullable=False,
    )
    requires_cold_chain: bool = Field(default=False, nullable=False)
    daily_time_budget_min: int = Field(default=480, nullable=False)

    def __init__(self, **data: Any):
        super().__init__(**data)
