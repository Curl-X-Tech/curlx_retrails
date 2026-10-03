"""
Shared base Pydantic schemas used across all Waypoint microservices.

Every entity returned from any service includes the BaseAuditResponse
fields (ID, CreateTime, UpdateTime, CreatedBy, UpdatedBy, IsActive).
"""

from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


# ──────────────────────────────────────────────────────────────────────────── #
# Audit base — mirrors models/Base.py fields                                   #
# ──────────────────────────────────────────────────────────────────────────── #


class BaseAuditResponse(BaseModel):
    """Audit fields present on every entity response."""

    ID: str
    CreateTime: datetime
    UpdateTime: datetime
    CreatedBy: str | None
    UpdatedBy: str | None
    IsActive: bool

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────────────────────── #
# Pagination                                                                   #
# ──────────────────────────────────────────────────────────────────────────── #


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    limit: int = Field(default=50, ge=1, le=500, description="Items per page")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated list wrapper."""

    items: list[T]
    total: int
    page: int
    limit: int
    has_next: bool


# ──────────────────────────────────────────────────────────────────────────── #
# Error response                                                               #
# ──────────────────────────────────────────────────────────────────────────── #


class ErrorResponse(BaseModel):
    """Standard error envelope returned on 4xx / 5xx."""

    error: str
    details: list[str] = Field(default_factory=list)


# ──────────────────────────────────────────────────────────────────────────── #
# Soft-delete response                                                         #
# ──────────────────────────────────────────────────────────────────────────── #


class DeleteResponse(BaseModel):
    id: str
    deleted: bool
    message: str
