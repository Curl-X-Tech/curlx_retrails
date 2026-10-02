import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.enums.master import DeliveryWindowType


class BrandBase(BaseModel):
    code: str
    name: str
    delivery_window_type: DeliveryWindowType = DeliveryWindowType.STANDARD_RETAIL
    requires_cold_chain: bool = False
    daily_time_budget_min: int = 480


class BrandCreate(BrandBase):
    pass


class BrandUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    delivery_window_type: DeliveryWindowType | None = None
    requires_cold_chain: bool | None = None
    daily_time_budget_min: int | None = None


class BrandRead(BrandBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
