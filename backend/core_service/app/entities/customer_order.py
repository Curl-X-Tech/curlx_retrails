import uuid
from datetime import date
from typing import Any

from sqlmodel import Field

from app.entities.base import BaseEntity


class CustomerOrder(BaseEntity, table=True):
    """Store order header; totals are derived from order items."""

    __tablename__ = "customer_order"

    order_ref: str = Field(unique=True, index=True, nullable=False)
    idempotency_key: str | None = Field(default=None, unique=True, index=True, nullable=True)
    outlet_id: uuid.UUID = Field(foreign_key="outlet.id", nullable=False, index=True)
    created_by_staff_id: uuid.UUID | None = Field(default=None, nullable=True)
    order_date: date = Field(nullable=False, index=True)
    required_date: date = Field(nullable=False)
    temp_requirement: str = Field(nullable=False)
    status: str = Field(default="pending", index=True, nullable=False)
    is_urgent: bool = Field(default=False, nullable=False)
    deferred_yesterday: int = Field(default=0, nullable=False)
    days_since_last_served: int = Field(default=0, nullable=False)

    def __init__(self, **data: Any):
        super().__init__(**data)


class OrderItem(BaseEntity, table=True):
    """Order line item carrying locked physical dimensions and unit price."""

    __tablename__ = "order_item"

    order_id: uuid.UUID = Field(foreign_key="customer_order.id", nullable=False, index=True, ondelete="CASCADE")
    item_id: uuid.UUID = Field(foreign_key="item.id", nullable=False, index=True)
    package_code: str = Field(unique=True, nullable=False)
    requested_qty: int = Field(nullable=False)
    loaded_qty: int = Field(default=0, nullable=False)
    delivered_qty: int = Field(default=0, nullable=False)
    unit_weight_kg: float = Field(nullable=False)
    unit_volume_m3: float = Field(nullable=False)
    unit_price: float = Field(default=0.0, nullable=False)
    special_handling_code: str | None = Field(default=None, nullable=True)

    def __init__(self, **data: Any):
        super().__init__(**data)


class DeferralAuditLog(BaseEntity, table=True):
    """Records why an order was deferred and by whom."""

    __tablename__ = "deferral_audit_log"

    order_id: uuid.UUID = Field(foreign_key="customer_order.id", nullable=False, index=True)
    outlet_id: uuid.UUID = Field(foreign_key="outlet.id", nullable=False, index=True)
    dispatch_date: date = Field(nullable=False, index=True)
    deferral_reason: str = Field(nullable=False)
    limiting_resource: str = Field(nullable=False)
    decision_maker_staff_id: uuid.UUID = Field(nullable=False)
    notes: str | None = Field(default=None, nullable=True)

    def __init__(self, **data: Any):
        super().__init__(**data)
