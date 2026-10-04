import uuid
from datetime import time

from pydantic import BaseModel

from app.enums.master import ParkingConstraint


class EffectiveWindowRead(BaseModel):
    outlet_id: str
    effective_open_time: time
    effective_close_time: time
    is_mall: bool
    mall_window_applied: bool


class OutletWindowByDistrictRead(BaseModel):
    outlet_id: str
    district_id: uuid.UUID
    district: str
    brand_code: str
    effective_open_time: time
    effective_close_time: time
    parking_constraint: ParkingConstraint
