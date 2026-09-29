"""
Outlet Manager Service — Pydantic schemas.

Mirrors models/Outlet.py domain model.
Fields: brand, district, depot, dock_type, parking_constraint,
        mall_window, window_open_time, window_close_time
"""

from __future__ import annotations

import datetime
from enum import Enum
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────────────────────────────────── #
# Enumerations                                                                 #
# ──────────────────────────────────────────────────────────────────────────── #

class Brand(str, Enum):
    FRESH = "Fresh"
    STYLE = "Style"
    TECH  = "Tech"


class DockType(str, Enum):
    REAR_DOCK = "rear_dock"
    STREET    = "street"
    MALL_BAY  = "mall_bay"


class ParkingConstraint(str, Enum):
    NORMAL    = "normal"
    VAN_ONLY  = "van_only"
    MALL_DOCK = "mall_dock"


class Depot(str, Enum):
    PELIYAGODA = "Peliyagoda"
    KANDY      = "Kandy"


# ──────────────────────────────────────────────────────────────────────────── #
# Request schemas                                                               #
# ──────────────────────────────────────────────────────────────────────────── #

class OutletCreate(BaseModel):
    """Payload for POST /outlets"""
    ID:                  str               = Field(..., examples=["OUT-099"])
    brand:               Brand
    district:            str               = Field(..., examples=["Colombo"])
    depot:               Depot
    dock_type:           DockType
    parking_constraint:  ParkingConstraint
    mall_window:         str | None        = Field(
                             default=None,
                             description="HH:MM-HH:MM format, only for mall_dock outlets",
                             examples=["09:00-21:00"]
                         )
    window_open_time:    str               = Field(..., pattern=r"^\d{2}:\d{2}$", examples=["06:00"])
    window_close_time:   str               = Field(..., pattern=r"^\d{2}:\d{2}$", examples=["10:00"])


class OutletUpdate(BaseModel):
    """Payload for PATCH /outlets/{outlet_id}"""
    window_open_time:   str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    window_close_time:  str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    mall_window:        str | None = None


class WindowUpdate(BaseModel):
    """Payload for PATCH /outlets/{outlet_id}/windows"""
    window_open_time:  str = Field(..., pattern=r"^\d{2}:\d{2}$")
    window_close_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    mall_window:       str | None = None


# ──────────────────────────────────────────────────────────────────────────── #
# Response schemas                                                              #
# ──────────────────────────────────────────────────────────────────────────── #

class OutletResponse(BaseModel):
    ID:                 str
    CreateTime:         datetime.datetime
    UpdateTime:         datetime.datetime
    CreatedBy:          str | None
    UpdatedBy:          str | None
    IsActive:           bool
    brand:              Brand
    district:           str
    depot:              Depot
    dock_type:          DockType
    parking_constraint: ParkingConstraint
    mall_window:        str | None
    window_open_time:   str
    window_close_time:  str

    class Config:
        from_attributes = True


class OutletListResponse(BaseModel):
    items:    list[OutletResponse]
    total:    int
    page:     int
    limit:    int
    has_next: bool


class EffectiveWindowResponse(BaseModel):
    """Response for GET /outlets/{outlet_id}/windows/effective"""
    outlet_id:           str
    effective_open_time:  str
    effective_close_time: str
    is_mall:             bool
    mall_window_applied: bool


class WindowsByDistrictItem(BaseModel):
    district:          str
    outlet_id:         str
    brand:             Brand
    effective_open:    str
    effective_close:   str
    parking_constraint: ParkingConstraint
