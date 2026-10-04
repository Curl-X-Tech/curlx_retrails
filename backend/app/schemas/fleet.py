import uuid
from datetime import datetime
from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field

VehicleType = Literal["truck", "van"]
VehicleTemp = Literal["reefer", "ambient"]
VehicleStatus = Literal["available", "loading", "in_transit", "in_workshop", "breakdown"]


class VehicleCreate(BaseModel):
    vehicle_id: str | None = None
    reg_number: str
    model_name: str
    type: VehicleType
    temp: VehicleTemp
    weight_cap_kg: float = Field(gt=0)
    volume_cap_m3: float = Field(gt=0)
    fuel_type: str = "diesel"
    km_per_l: float = Field(gt=0)
    weekly_fuel_quota_l: float = Field(gt=0)
    assigned_depot_id: uuid.UUID
    assigned_driver_id: uuid.UUID | None = None


class VehicleUpdate(BaseModel):
    reg_number: str | None = None
    model_name: str | None = None
    type: VehicleType | None = None
    temp: VehicleTemp | None = None
    weight_cap_kg: float | None = Field(default=None, gt=0)
    volume_cap_m3: float | None = Field(default=None, gt=0)
    fuel_type: str | None = None
    km_per_l: float | None = Field(default=None, gt=0)
    weekly_fuel_quota_l: float | None = Field(default=None, gt=0)
    assigned_depot_id: uuid.UUID | None = None
    assigned_driver_id: uuid.UUID | None = None
    status: VehicleStatus | None = None
    is_active: bool | None = None


class VehicleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    vehicle_id: str
    reg_number: str
    model_name: str
    type: VehicleType
    temp: VehicleTemp
    weight_cap_kg: float
    volume_cap_m3: float
    fuel_type: str
    km_per_l: float
    weekly_fuel_quota_l: float
    consumed_fuel_l: float
    assigned_depot_id: uuid.UUID = Field(validation_alias=AliasChoices("assigned_depot_id", "depot_id"))
    assigned_driver_id: uuid.UUID | None = None
    status: VehicleStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DriverRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    user_id: uuid.UUID | None = None
    license_number: str | None = None
    phone_number: str = Field(validation_alias=AliasChoices("phone_number", "phone"))
    assigned_depot_id: uuid.UUID | None = Field(
        default=None, validation_alias=AliasChoices("assigned_depot_id", "depot_id")
    )
    license_class: str | None = None
    safety_rating: float = 5.0
    total_completed_trips: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
