"""
Dispatcher Service — Pydantic schemas.

Covers: run sheets, live trip lifecycle, manual trips, drivers, and plan ingestion.
This service is origin-agnostic: AUTO and MANUAL planned trips are handled identically.
"""

from __future__ import annotations

import datetime
from enum import Enum
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────────────────────────────────── #
# Enumerations                                                                 #
# ──────────────────────────────────────────────────────────────────────────── #

class TripLiveStatus(str, Enum):
    SCHEDULED  = "scheduled"
    DEPARTED   = "departed"
    IN_TRANSIT = "in_transit"
    COMPLETED  = "completed"
    CANCELLED  = "cancelled"
    DELAYED    = "delayed"


class StopStatus(str, Enum):
    PENDING   = "pending"
    ARRIVED   = "arrived"
    COMPLETED = "completed"
    SKIPPED   = "skipped"


# ──────────────────────────────────────────────────────────────────────────── #
# Runsheet schemas                                                              #
# ──────────────────────────────────────────────────────────────────────────── #

class StopDetail(BaseModel):
    outlet_id:           str
    planned_arrival:     str                  # HH:MM
    planned_departure:   str                  # HH:MM
    actual_arrival:      str | None = None    # Set when driver arrives
    actual_departure:    str | None = None    # Set when delivery complete
    status:              StopStatus = StopStatus.PENDING
    delivered_weight_kg: float | None = None
    delivery_note:        str | None = None


class RunSheetResponse(BaseModel):
    """Response for GET /dispatch/runsheets/{trip_id}"""
    trip_id:            str
    vehicle_id:         str
    driver_id:          str | None = None
    depot:              str
    district:           str
    brand:              str
    planned_dispatch:   str                   # HH:MM
    live_status:        TripLiveStatus = TripLiveStatus.SCHEDULED
    stops:              list[StopDetail] = []
    allocated_from:     str = "AUTO"          # "AUTO" | "MANUAL"
    plan_id:            str | None = None

    class Config:
        from_attributes = True


class RunSheetListResponse(BaseModel):
    items:    list[RunSheetResponse]
    total:    int
    page:     int
    limit:    int
    has_next: bool


# ──────────────────────────────────────────────────────────────────────────── #
# Trip lifecycle request schemas                                               #
# ──────────────────────────────────────────────────────────────────────────── #

class DepartRequest(BaseModel):
    """Payload for POST /dispatch/trips/{trip_id}/depart — starts trip clock."""
    actual_departure_time: str = Field(
        default_factory=lambda: datetime.datetime.now().strftime("%H:%M"),
        description="HH:MM, defaults to current time",
    )
    odometer_km: float | None = None


class StopArriveRequest(BaseModel):
    """Payload for POST /dispatch/trips/{trip_id}/stops/{outlet_id}/arrive"""
    actual_arrival_time: str = Field(description="HH:MM")


class StopCompleteRequest(BaseModel):
    """Payload for POST /dispatch/trips/{trip_id}/stops/{outlet_id}/complete"""
    actual_departure_time: str = Field(description="HH:MM")
    delivered_weight_kg:   float | None = None
    delivery_note:         str | None = None


class TripCompleteRequest(BaseModel):
    """Payload for POST /dispatch/trips/{trip_id}/complete"""
    return_time:  str = Field(description="HH:MM — vehicle arrived at depot")
    odometer_km:  float | None = None


class DelayReport(BaseModel):
    """Payload for POST /dispatch/trips/{trip_id}/delay"""
    reason:              str
    estimated_delay_min: int = Field(..., ge=1)


# ──────────────────────────────────────────────────────────────────────────── #
# Manual trip schemas                                                          #
# ──────────────────────────────────────────────────────────────────────────── #

class ManualTripCreate(BaseModel):
    """
    Payload for POST /dispatch/trips/manual.
    Creates an ad-hoc trip directly in Dispatcher (bypasses Planning Engine).
    Requires DEPOT_MANAGER role.
    """
    vehicle_id:         str
    outlet_ids:         list[str] = Field(..., min_length=1)
    depot:              str = Field(default="Peliyagoda")
    district:           str = Field(default="Colombo")
    brand:              str = Field(default="Fresh")
    scheduled_dispatch: str = Field(default="06:00", description="HH:MM or ISO timestamp")
    override_reason:    str = Field(..., min_length=5, description="Mandatory justification")
    authorized_by:      str = Field(..., description="User ID of authorizing manager")


class VehicleReassignRequest(BaseModel):
    """Payload for PATCH /dispatch/trips/{trip_id}/vehicle"""
    new_vehicle_id: str
    reason:         str = Field(..., min_length=5)
    authorized_by:  str


# ──────────────────────────────────────────────────────────────────────────── #
# Trip response schemas                                                        #
# ──────────────────────────────────────────────────────────────────────────── #

class TripLiveResponse(BaseModel):
    """Response for GET /dispatch/trips/{trip_id}"""
    trip_id:           str
    vehicle_id:        str
    driver_id:         str | None = None
    depot:             str
    district:          str
    brand:             str
    live_status:       TripLiveStatus = TripLiveStatus.SCHEDULED
    departed_at:       str | None = None
    completed_at:      str | None = None
    delay_minutes:     int = 0
    stops:             list[StopDetail] = []
    plan_id:           str | None = None
    is_manual:         bool = False

    class Config:
        from_attributes = True


class TripListResponse(BaseModel):
    items:    list[TripLiveResponse]
    total:    int
    page:     int
    limit:    int
    has_next: bool


# ──────────────────────────────────────────────────────────────────────────── #
# Driver schemas                                                               #
# ──────────────────────────────────────────────────────────────────────────── #

class DriverCreate(BaseModel):
    """Payload for POST /dispatch/drivers"""
    name:         str
    license_no:   str
    phone:        str
    depot:        str
    is_active:    bool = True


class DriverCheckinRequest(BaseModel):
    """Payload for POST /dispatch/drivers/{driver_id}/checkin"""
    checkin_time: str = Field(
        default_factory=lambda: datetime.datetime.now().strftime("%H:%M"),
        description="HH:MM",
    )
    depot:        str


class DriverResponse(BaseModel):
    ID:                str
    name:              str
    license_no:        str
    phone:             str
    depot:             str
    is_active:         bool
    checked_in:        bool = False
    last_checkin_time: str | None = None
    checkin_depot:     str | None = None
    CreateTime:        datetime.datetime
    UpdateTime:        datetime.datetime

    class Config:
        from_attributes = True


class DriverListResponse(BaseModel):
    items:    list[DriverResponse]
    total:    int
    page:     int
    limit:    int
    has_next: bool


class DriverAssignResponse(BaseModel):
    """Response for POST /dispatch/drivers/{driver_id}/assign/{trip_id}"""
    driver_id: str
    trip_id:   str
    assigned:  bool
    message:   str


# ──────────────────────────────────────────────────────────────────────────── #
# Plan Ingestion schemas                                                       #
# ──────────────────────────────────────────────────────────────────────────── #

class PlanIngestTrip(BaseModel):
    trip_id:           str
    plan_id:           str | None = None
    vehicle_id:        str
    depot:             str
    district:          str
    brand:             str
    planned_dispatch:  str = "06:00"
    planned_return:    str | None = "12:00"
    allocation_source: str = "AUTO"
    stops:             list[dict] = []
    date:              str | None = None


class PlanIngestRequest(BaseModel):
    plan_id: str
    trips:   list[PlanIngestTrip]
