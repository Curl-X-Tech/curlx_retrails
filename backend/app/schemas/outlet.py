import uuid
from datetime import datetime, time

from pydantic import BaseModel, ConfigDict

from app.enums.master import DockType, ParkingConstraint


class OutletBase(BaseModel):
    outlet_id: str
    name: str
    brand_id: uuid.UUID
    district_id: uuid.UUID
    depot_id: uuid.UUID
    dock_type: DockType
    parking_constraint: ParkingConstraint
    mall_window: str | None = None
    window_open_time: time
    window_close_time: time
    latitude: float | None = None
    longitude: float | None = None
    contact_phone: str | None = None
    is_active: bool = True


class OutletCreate(OutletBase):
    pass


class OutletUpdate(BaseModel):
    outlet_id: str | None = None
    name: str | None = None
    brand_id: uuid.UUID | None = None
    district_id: uuid.UUID | None = None
    depot_id: uuid.UUID | None = None
    dock_type: DockType | None = None
    parking_constraint: ParkingConstraint | None = None
    mall_window: str | None = None
    window_open_time: time | None = None
    window_close_time: time | None = None
    latitude: float | None = None
    longitude: float | None = None
    contact_phone: str | None = None
    is_active: bool | None = None


class OutletRead(OutletBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
