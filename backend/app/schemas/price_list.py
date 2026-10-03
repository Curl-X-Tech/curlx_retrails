import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.entities.base import utc_today


class PriceListBase(BaseModel):
    item_id: uuid.UUID
    cost_price: float = Field(ge=0, default=0.0)
    unit_price: float = Field(ge=0, default=0.0)
    currency: str = "LKR"
    effective_from: date = Field(default_factory=utc_today)
    effective_to: date | None = None
    price_change_reason: str | None = None
    is_active: bool = True


class PriceListCreate(PriceListBase):
    pass


class PriceListUpdate(BaseModel):
    cost_price: float | None = Field(default=None, ge=0)
    unit_price: float | None = Field(default=None, ge=0)
    currency: str | None = None
    effective_from: date | None = None
    effective_to: date | None = None
    price_change_reason: str | None = None
    is_active: bool | None = None


class PriceListRead(PriceListBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivePriceRead(BaseModel):
    price_list_id: uuid.UUID
    item_id: uuid.UUID
    sku: str
    item_name: str
    cost_price: float
    unit_price: float
    currency: str = "LKR"
    effective_from: date
    effective_to: date | None = None
    price_change_reason: str | None = None
