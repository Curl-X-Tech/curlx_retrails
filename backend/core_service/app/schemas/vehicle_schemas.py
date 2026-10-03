"""
Vehicle Manager Service — Pydantic schemas.

Mirrors models/Vehicle.py domain model.
Fields: type (truck|van), temp_condition (reefer|ambient), weight_cap_kg,
        volume_cap_m3, fuel_type, km_per_l, weekly_fuel_quota, depot, service_milage
"""

from __future__ import annotations

import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field


# ──────────────────────────────────────────────────────────────────────────── #
# Enumerations                                                                 #
# ──────────────────────────────────────────────────────────────────────────── #


class VehicleType(str, Enum):
    TRUCK = "truck"
    VAN = "van"


class TempCondition(str, Enum):
    REEFER = "reefer"
    AMBIENT = "ambient"


class ParkingConstraint(str, Enum):
    NORMAL = "normal"
    VAN_ONLY = "van_only"
    MALL_DOCK = "mall_dock"


class Depot(str, Enum):
    PELIYAGODA = "Peliyagoda"
    KANDY = "Kandy"


# ──────────────────────────────────────────────────────────────────────────── #
# Request schemas                                                               #
# ──────────────────────────────────────────────────────────────────────────── #


class VehicleCreate(BaseModel):
    """Payload for POST /vehicles"""

    type: VehicleType
    temp_condition: TempCondition
    weight_cap_kg: float = Field(..., gt=0)
    volume_cap_m3: float = Field(..., gt=0)
    fuel_type: str = Field(..., examples=["diesel"])
    km_per_l: float = Field(..., gt=0)
    weekly_fuel_quota: float = Field(..., gt=0, description="Quota in litres")
    depot: Depot
    service_milage: float = Field(default=0.0, ge=0)


class VehicleUpdate(BaseModel):
    """Payload for PATCH /vehicles/{vehicle_id} — mutable specs only."""

    weight_cap_kg: float | None = Field(default=None, gt=0)
    volume_cap_m3: float | None = Field(default=None, gt=0)
    km_per_l: float | None = Field(default=None, gt=0)
    weekly_fuel_quota: float | None = Field(default=None, gt=0)


class MileageUpdate(BaseModel):
    """Payload for PATCH /vehicles/{vehicle_id}/quota/mileage"""

    service_milage: float = Field(..., ge=0)
    correction_note: str = Field(..., description="Required justification for manual correction")


class EligibilityRequest(BaseModel):
    """Payload for POST /vehicles/{vehicle_id}/eligibility"""

    depot: Depot
    parking_constraint: ParkingConstraint
    temp_requirement: str = Field(..., examples=["chilled"])
    round_trip_km: float = Field(..., gt=0)


# ──────────────────────────────────────────────────────────────────────────── #
# Response schemas                                                              #
# ──────────────────────────────────────────────────────────────────────────── #


class VehicleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ID: str
    CreateTime: datetime.datetime
    UpdateTime: datetime.datetime
    CreatedBy: str | None
    UpdatedBy: str | None
    IsActive: bool
    type: VehicleType
    temp_condition: TempCondition
    weight_cap_kg: float
    volume_cap_m3: float
    fuel_type: str
    km_per_l: float
    weekly_fuel_quota: float
    depot: Depot
    service_milage: float
    trip_count_today: int
    max_per_day_trip_count: int


class VehicleListResponse(BaseModel):
    items: list[VehicleResponse]
    total: int
    page: int
    limit: int
    has_next: bool


class QuotaResponse(BaseModel):
    """Response for GET /vehicles/{vehicle_id}/quota"""

    vehicle_id: str
    service_milage: float
    max_weekly_range_km: float
    remaining_range_km: float
    trip_count_today: int
    trips_remaining_today: int


class EligibilityResponse(BaseModel):
    """Response for POST /vehicles/{vehicle_id}/eligibility — mirrors Vehicle.is_eligible_for()"""

    eligible: bool
    reason: str


class VehicleTreeNode(BaseModel):
    """Recursive node for GET /vehicles/tree"""

    name: str
    children: list["VehicleTreeNode | VehicleResponse"] = []


VehicleTreeNode.model_rebuild()
