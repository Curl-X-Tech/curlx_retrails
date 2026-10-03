"""
Planning Engine Service — Pydantic schemas.

Mirrors models/Planner.py domain models:
  DispatchPlan, HeuristicAllocationSolver, PlanValidator, ValidationResult
"""

from __future__ import annotations

import datetime
from enum import Enum
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────────────────────────────────── #
# Enumerations                                                                 #
# ──────────────────────────────────────────────────────────────────────────── #


class PlanStatus(str, Enum):
    DRAFT = "DRAFT"
    CONFIRMED = "CONFIRMED"
    SUPERSEDED = "SUPERSEDED"


class SolverType(str, Enum):
    HEURISTIC = "heuristic"
    ORTOOLS = "ortools"


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"


class AllocationSource(str, Enum):
    AUTO = "AUTO"
    MANUAL = "MANUAL"


# ──────────────────────────────────────────────────────────────────────────── #
# Plan request schemas                                                         #
# ──────────────────────────────────────────────────────────────────────────── #


class PlanGenerateRequest(BaseModel):
    """Payload for POST /plans/generate"""

    order_ids: list[str] = Field(..., min_length=1)
    planning_date: datetime.date
    solver: SolverType = SolverType.HEURISTIC
    max_days: int = Field(default=4, ge=1, le=7)


class PlanConfirmRequest(BaseModel):
    """Payload for POST /plans/{plan_id}/confirm"""

    confirmed_by: str
    notes: str | None = None


class SupersedeRequest(BaseModel):
    """Payload for POST /plans/{plan_id}/supersede"""

    reason: str
    authorized_by: str


# ──────────────────────────────────────────────────────────────────────────── #
# Trip assignment schemas                                                      #
# ──────────────────────────────────────────────────────────────────────────── #


class TripAssignRequest(BaseModel):
    """Payload for PATCH /plans/{plan_id}/trips/{trip_id}/assign"""

    vehicle_id: str
    allocation_day: int = Field(..., ge=1, le=7)
    override_reason: str = Field(..., min_length=5, description="Required justification")


class StopScheduleItem(BaseModel):
    outlet_id: str
    arrival: str  # HH:MM
    departure: str  # HH:MM


class TripSchedule(BaseModel):
    dispatch_time: str  # HH:MM
    stops: list[StopScheduleItem]
    return_time: str  # HH:MM


class TripAssignResponse(BaseModel):
    """
    Pre-commit validation result for PATCH /plans/{plan_id}/trips/{trip_id}/assign.
    If is_valid=False, the assignment was REJECTED and not persisted.
    """

    is_valid: bool
    errors: list[str]
    warnings: list[str]
    schedule: TripSchedule | None = None


# ──────────────────────────────────────────────────────────────────────────── #
# Validate endpoints                                                           #
# ──────────────────────────────────────────────────────────────────────────── #


class ValidateTripAssignmentRequest(BaseModel):
    """Payload for POST /plans/validate/trip-assignment — dry-run, no commit."""

    trip_id: str
    vehicle_id: str
    allocation_day: int = Field(..., ge=1)
    plan_id: str


class ValidateCapacityRequest(BaseModel):
    """Payload for POST /plans/validate/vehicle-capacity"""

    vehicle_id: str
    order_ids: list[str]


class ValidateTimeWindowRequest(BaseModel):
    """Payload for POST /plans/validate/time-window"""

    trip_id: str
    vehicle_id: str
    plan_id: str


class ValidationResponse(BaseModel):
    """Shared response for all dry-run validate endpoints."""

    is_valid: bool
    errors: list[str]
    warnings: list[str]
    schedule: TripSchedule | None = None


# ──────────────────────────────────────────────────────────────────────────── #
# Plan response schemas                                                        #
# ──────────────────────────────────────────────────────────────────────────── #


class JobStatusResponse(BaseModel):
    """Response for GET /plans/job/{job_id}"""

    job_id: str
    status: JobStatus
    plan_id: str | None = None
    estimated_ms: int | None = None
    error: str | None = None


class PlanGenerateResponse(BaseModel):
    """202 response for POST /plans/generate"""

    job_id: str
    status: JobStatus = JobStatus.QUEUED
    estimated_ms: int


class TripSummary(BaseModel):
    trip_id: str
    depot: str
    district: str
    brand: str
    vehicle_id: str | None
    allocation_day: int | None
    allocation_source: AllocationSource
    is_locked: bool
    order_count: int
    total_weight_kg: float
    total_volume_m3: float

    class Config:
        from_attributes = True


class PlanSummaryResponse(BaseModel):
    """Response for GET /plans/{plan_id}/summary"""

    plan_id: str
    status: PlanStatus
    planning_date: datetime.date
    total_trips: int
    allocated_day1: int
    deferred: int
    by_depot: dict[str, int]
    by_district: dict[str, int]


class AuditLogEntry(BaseModel):
    timestamp: datetime.datetime
    actor: str
    action: str
    trip_id: str | None
    vehicle_id: str | None
    details: str
    is_valid: bool

    class Config:
        from_attributes = True


class PlanResponse(BaseModel):
    """Full plan response for GET /plans/{plan_id}"""

    ID: str
    CreateTime: datetime.datetime
    UpdateTime: datetime.datetime
    CreatedBy: str | None
    UpdatedBy: str | None
    IsActive: bool
    status: PlanStatus
    planning_date: datetime.date
    solver_used: SolverType
    trips: list[TripSummary]
    confirmed_by: str | None = None
    confirmed_at: datetime.datetime | None = None

    class Config:
        from_attributes = True


class PlanListResponse(BaseModel):
    items: list[PlanResponse]
    total: int
    page: int
    limit: int
    has_next: bool


class TripDetailResponse(BaseModel):
    """Full trip response for GET /plans/{plan_id}/trips/{trip_id}"""

    trip_id: str
    depot: str
    district: str
    brand: str
    vehicle_id: str | None
    allocation_day: int | None
    allocation_source: AllocationSource
    is_locked: bool
    locked_by: str | None = None
    locked_at: datetime.datetime | str | None = None
    override_reason: str | None = None
    allocation_error: str | None = None
    order_ids: list[str]
    stop_schedule: TripSchedule | None = None

    class Config:
        from_attributes = True
