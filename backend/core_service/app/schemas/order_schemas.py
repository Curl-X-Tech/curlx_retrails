"""
Order Service — Pydantic schemas.

Mirrors models/Order.py domain model.
Fields: outlet_id, order_date, order_time, weight_kg, volume_m3, temp_condition
"""

from __future__ import annotations

import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field


# ──────────────────────────────────────────────────────────────────────────── #
# Enumerations                                                                 #
# ──────────────────────────────────────────────────────────────────────────── #


class TempCondition(str, Enum):
    AMBIENT = "ambient"
    CHILLED = "chilled"
    FROZEN = "frozen"


class OrderStatus(str, Enum):
    PENDING = "pending"
    DISPATCHED = "dispatched"
    DELIVERED = "delivered"
    DEFERRED = "deferred"
    CANCELLED = "cancelled"


class Depot(str, Enum):
    PELIYAGODA = "Peliyagoda"
    KANDY = "Kandy"


# ──────────────────────────────────────────────────────────────────────────── #
# Request schemas                                                               #
# ──────────────────────────────────────────────────────────────────────────── #


class OrderCreate(BaseModel):
    """Payload for POST /orders"""

    outlet_id: str = Field(..., examples=["OUT-001"])
    order_date: datetime.date = Field(..., examples=["2026-09-29"])
    order_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", examples=["06:00"])
    weight_kg: float = Field(..., gt=0)
    volume_m3: float = Field(..., gt=0)
    temp_condition: TempCondition


class OrderBulkCreate(BaseModel):
    """Payload for POST /orders/bulk — up to 500 orders."""

    orders: list[OrderCreate] = Field(..., max_length=500)


class OrderUpdate(BaseModel):
    """Payload for PATCH /orders/{order_id} — only mutable fields."""

    order_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    weight_kg: float | None = Field(default=None, gt=0)
    volume_m3: float | None = Field(default=None, gt=0)


class OrderStatusUpdate(BaseModel):
    """Payload for PATCH /orders/{order_id}/status"""

    status: OrderStatus
    reason: str | None = None


class BatchReadyEvent(BaseModel):
    """Payload for triggering orders.batch_ready event."""

    order_ids: list[str]
    planning_date: datetime.date


# ──────────────────────────────────────────────────────────────────────────── #
# Response schemas                                                              #
# ──────────────────────────────────────────────────────────────────────────── #


class OrderResponse(BaseModel):
    """Full order response — includes all audit fields."""

    model_config = ConfigDict(from_attributes=True)

    ID: str
    CreateTime: datetime.datetime
    UpdateTime: datetime.datetime
    CreatedBy: str | None
    UpdatedBy: str | None
    IsActive: bool
    outlet_id: str
    order_date: datetime.date
    order_time: str
    weight_kg: float
    volume_m3: float
    temp_condition: TempCondition
    status: OrderStatus = OrderStatus.PENDING
    allocation_day: int | None = None


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    limit: int
    has_next: bool


# ──────────────────────────────────────────────────────────────────────────── #
# Analytics response schemas                                                   #
# ──────────────────────────────────────────────────────────────────────────── #


class OrdersByDateItem(BaseModel):
    order_date: datetime.date
    total_orders: int
    total_weight_kg: float
    total_volume_m3: float


class OrdersByOutletItem(BaseModel):
    outlet_id: str
    total_orders: int
    total_weight_kg: float


class OrdersByTempItem(BaseModel):
    temp_condition: TempCondition
    total_orders: int
    total_weight_kg: float
    total_volume_m3: float
