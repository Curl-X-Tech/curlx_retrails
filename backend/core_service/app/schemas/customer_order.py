import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

OrderStatus = Literal["pending", "allocated", "in_transit", "delivered", "deferred", "cancelled"]
TempRequirement = Literal["chilled", "ambient"]
SpecialHandlingCode = Literal["COL", "FRG", "MAL", "HAZ", "GEN"]
DeferralReason = Literal[
    "insufficient_reefer_capacity",
    "van_access_shortage",
    "time_budget_limit",
    "fuel_quota_exceeded",
    "manual_dispatcher_override",
]
LimitingResource = Literal["weight_cap", "volume_cap", "time_budget", "fleet_downtime"]


class OrderItemCreate(BaseModel):
    item_id: uuid.UUID
    requested_qty: int = Field(gt=0)
    special_handling_code: SpecialHandlingCode | None = None


class OrderCreate(BaseModel):
    outlet_id: uuid.UUID
    order_date: date
    required_date: date | None = None
    temp_requirement: TempRequirement | None = None
    is_urgent: bool = False
    idempotency_key: str | None = None
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: str | None = None


class OrderRead(BaseModel):
    id: uuid.UUID
    order_ref: str
    outlet_id: uuid.UUID
    brand_id: uuid.UUID
    order_date: date
    required_date: date
    temp_requirement: TempRequirement
    status: OrderStatus
    total_weight_kg: float
    total_volume_m3: float
    total_price_lkr: float
    is_urgent: bool
    deferred_yesterday: int
    days_since_last_served: int
    created_by_staff_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    item_id: uuid.UUID
    package_code: str
    requested_qty: int
    loaded_qty: int
    delivered_qty: int
    unit_weight_kg: float
    unit_volume_m3: float
    unit_price: float
    special_handling_code: str | None = None
    item_name: str | None = None
    category: str | None = None
    created_at: datetime


class OrderHistoryEntry(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    status: OrderStatus
    changed_at: datetime
    changed_by: str | None = None
    notes: str | None = None


class OrderDetail(OrderRead):
    items: list[OrderItemRead]
    outlet_name: str | None = None
    district: str | None = None
    depot: str | None = None
    dock_type: str | None = None
    parking_constraint: str | None = None
    delivery_window: str | None = None
    fulfillment_history: list[OrderHistoryEntry] = Field(default_factory=list)


class DeferOrderRequest(BaseModel):
    reason: DeferralReason
    limiting_resource: LimitingResource
    notes: str | None = None
    dispatch_date: date | None = None
    decision_maker_staff_id: uuid.UUID | None = None


class RequeueRequest(BaseModel):
    priority: int | None = None
    notes: str | None = None


class DeferralAuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    outlet_id: uuid.UUID
    dispatch_date: date
    deferral_reason: str
    limiting_resource: str
    decision_maker_staff_id: uuid.UUID
    notes: str | None = None
    created_at: datetime


class DeferredOrderRead(OrderRead):
    deferral_reason: str | None = None
    latest_reason: str | None = None
    limiting_resource: str | None = None
    outlet_name: str | None = None
    district: str | None = None
    dock_type: str | None = None
    parking_constraint: str | None = None
    total_items: int = 0
    notes: str | None = None


class DeferralSummary(BaseModel):
    total_deferred_orders: int
    critical_escalations_count: int
    total_weight_kg: float
    total_volume_m3: float
    total_value_lkr: float
    chilled_orders_count: int
    ambient_orders_count: int
    van_restricted_count: int
    reasons_breakdown: dict[str, int]
