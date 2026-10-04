"""
Route Management Service — Pydantic schemas.

Mirrors models/Route.py and models/Service_allowance.py domain models.
"""

from __future__ import annotations

import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field


# ──────────────────────────────────────────────────────────────────────────── #
# Enumerations                                                                 #
# ──────────────────────────────────────────────────────────────────────────── #


class RoadClass(str, Enum):
    HIGHWAY = "highway"
    A_ROAD = "a_road"
    B_ROAD = "b_road"
    URBAN = "urban"
    SUBURBAN = "suburban"
    HILL = "hill"


class Brand(str, Enum):
    FRESH = "Fresh"
    STYLE = "Style"
    TECH = "Tech"


class DockType(str, Enum):
    REAR_DOCK = "rear_dock"
    STREET = "street"
    MALL_BAY = "mall_bay"


# ──────────────────────────────────────────────────────────────────────────── #
# Route request schemas                                                        #
# ──────────────────────────────────────────────────────────────────────────── #


class RouteCreate(BaseModel):
    """Payload for POST /routes"""

    district: str = Field(..., examples=["Colombo"])
    depot: str = Field(..., examples=["Peliyagoda"])
    road_class: RoadClass
    free_flow_kmh: float = Field(..., gt=0)
    depot_to_district_km: float = Field(..., gt=0)
    depot_to_district_freeflow_min: float = Field(..., gt=0)
    inter_stop_km: float = Field(..., gt=0)
    inter_stop_freeflow_min: float = Field(..., gt=0)


class RouteUpdate(BaseModel):
    """Payload for PATCH /routes/{route_id} — update road geometry."""

    road_class: RoadClass | None = None
    free_flow_kmh: float | None = Field(default=None, gt=0)
    depot_to_district_km: float | None = Field(default=None, gt=0)
    depot_to_district_freeflow_min: float | None = Field(default=None, gt=0)
    inter_stop_km: float | None = Field(default=None, gt=0)
    inter_stop_freeflow_min: float | None = Field(default=None, gt=0)


class TripDurationRequest(BaseModel):
    """Payload for POST /routes/{route_id}/calculate/trip-duration"""

    stop_count: int = Field(..., ge=1)
    service_allowances_min: list[float] = Field(..., description="One per stop, in minutes")


# ──────────────────────────────────────────────────────────────────────────── #
# Route response schemas                                                       #
# ──────────────────────────────────────────────────────────────────────────── #


class RouteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ID: str
    CreateTime: datetime.datetime
    UpdateTime: datetime.datetime
    CreatedBy: str | None
    UpdatedBy: str | None
    IsActive: bool
    district: str
    depot: str
    road_class: RoadClass
    free_flow_kmh: float
    depot_to_district_km: float
    depot_to_district_freeflow_min: float
    inter_stop_km: float
    inter_stop_freeflow_min: float


class RouteListResponse(BaseModel):
    items: list[RouteResponse]
    total: int
    page: int
    limit: int
    has_next: bool


class TripDurationResponse(BaseModel):
    """Response for POST /routes/{route_id}/calculate/trip-duration"""

    trip_duration_min: float


class RoundTripKmResponse(BaseModel):
    """Response for GET /routes/{route_id}/calculate/round-trip-km"""

    route_id: str
    round_trip_km: float


# ──────────────────────────────────────────────────────────────────────────── #
# ServiceAllowance request schemas                                             #
# ──────────────────────────────────────────────────────────────────────────── #


class ServiceAllowanceCreate(BaseModel):
    """Payload for POST /service-allowances"""

    brand: Brand
    dock_type: DockType
    service_allowance_min: float = Field(..., gt=0, description="Handling time in minutes")


class ServiceAllowanceUpdate(BaseModel):
    """Payload for PATCH /service-allowances/{id}"""

    service_allowance_min: float = Field(..., gt=0)


# ──────────────────────────────────────────────────────────────────────────── #
# ServiceAllowance response schemas                                            #
# ──────────────────────────────────────────────────────────────────────────── #


class ServiceAllowanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ID: str
    CreateTime: datetime.datetime
    UpdateTime: datetime.datetime
    CreatedBy: str | None
    UpdatedBy: str | None
    IsActive: bool
    brand: Brand
    dock_type: DockType
    service_allowance_min: float


class ServiceAllowanceListResponse(BaseModel):
    items: list[ServiceAllowanceResponse]
    total: int
    page: int
    limit: int
    has_next: bool


class ServiceAllowanceLookupResponse(BaseModel):
    """Response for GET /service-allowances/lookup"""

    brand: Brand
    dock_type: DockType
    service_allowance_min: float
