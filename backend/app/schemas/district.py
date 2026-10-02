import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DistrictBase(BaseModel):
    name: str
    province: str
    assigned_depot_id: uuid.UUID


class DistrictCreate(DistrictBase):
    pass


class DistrictUpdate(BaseModel):
    name: str | None = None
    province: str | None = None
    assigned_depot_id: uuid.UUID | None = None


class DistrictRead(DistrictBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
