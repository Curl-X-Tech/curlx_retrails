import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ItemBase(BaseModel):
    sku: str
    brand_id: uuid.UUID
    name: str
    category: str
    unit: str = "Nos"
    unit_weight_kg: float
    unit_volume_m3: float
    requires_cold_chain: bool = False
    special_handling_code: str | None = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    sku: str | None = None
    brand_id: uuid.UUID | None = None
    name: str | None = None
    category: str | None = None
    unit: str | None = None
    unit_weight_kg: float | None = None
    unit_volume_m3: float | None = None
    requires_cold_chain: bool | None = None
    special_handling_code: str | None = None


class ItemRead(ItemBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
