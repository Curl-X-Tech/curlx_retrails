import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DepotBase(BaseModel):
    code: str
    name: str
    latitude: float
    longitude: float
    address: str | None = None
    is_active: bool = True


class DepotCreate(DepotBase):
    pass


class DepotUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    address: str | None = None
    is_active: bool | None = None


class DepotRead(DepotBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
