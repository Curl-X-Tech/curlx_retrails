"""Base definitions and data structures for Allocation Engine Solvers."""

from __future__ import annotations

import abc
from dataclasses import dataclass, field
import uuid


@dataclass
class OrderItemData:
    item_id: uuid.UUID
    sku: str
    requested_qty: int
    unit_weight_kg: float
    unit_volume_m3: float
    unit_price: float
    special_handling_code: str | None


@dataclass
class AllocationOrder:
    order_id: uuid.UUID
    order_ref: str
    outlet_id: uuid.UUID
    outlet_name: str
    brand_id: uuid.UUID
    brand_code: str
    brand_name: str
    district_id: uuid.UUID
    district_name: str
    depot_id: uuid.UUID
    depot_name: str
    dock_type: str
    parking_constraint: str
    temp_requirement: str
    window_open_time: str
    window_close_time: str
    total_weight_kg: float
    total_volume_m3: float
    total_value_lkr: float
    deferred_yesterday: int
    days_since_last_served: int
    is_urgent: bool
    items: list[OrderItemData] = field(default_factory=list)

    @property
    def priority_score(self) -> float:
        score = 0.0
        if self.deferred_yesterday > 0:
            score += 1000.0
        score += float(self.days_since_last_served) * 100.0
        if self.is_urgent:
            score += 50.0
        return score


@dataclass
class AllocationVehicle:
    vehicle_id: uuid.UUID
    code: str
    model_name: str
    type: str  # "truck" | "van"
    temp: str  # "reefer" | "ambient"
    weight_cap_kg: float
    volume_cap_m3: float
    depot_id: uuid.UUID
    depot_name: str
    assigned_driver_id: uuid.UUID | None
    trips_assigned: int = 0
    fresh_minutes_used: float = 0.0
    general_minutes_used: float = 0.0


@dataclass
class ProposedLeg:
    seq: int
    order_id: uuid.UUID
    outlet_id: uuid.UUID
    outlet_name: str
    dock_type: str
    weight_kg: float
    volume_m3: float
    planned_depart_time: str
    planned_arrival_time: str
    travel_duration_min: float
    handling_min: float


@dataclass
class ProposedTrip:
    trip_sequence: int
    vehicle_id: uuid.UUID
    driver_id: uuid.UUID | None
    brand_id: uuid.UUID
    brand_name: str
    district_id: uuid.UUID
    district_name: str
    depot_id: uuid.UUID
    depot_name: str
    orders: list[AllocationOrder]
    legs: list[ProposedLeg]
    total_weight_kg: float
    total_volume_m3: float
    total_duration_min: float
    total_distance_km: float


@dataclass
class DeferredRecord:
    order_id: uuid.UUID
    order_ref: str
    outlet_id: uuid.UUID
    reason_code: str
    limiting_resource: str


@dataclass
class SolverResult:
    proposed_trips: list[ProposedTrip]
    deferred_orders: list[DeferredRecord]
    solver_status: str
    execution_time_ms: int


class BaseAllocationSolver(abc.ABC):
    """Abstract base class for fleet allocation solvers."""

    @abc.abstractmethod
    def solve(
        self,
        orders: list[AllocationOrder],
        vehicles: list[AllocationVehicle],
    ) -> SolverResult:
        """Solve fleet allocation and return proposed trips and deferrals."""
        raise NotImplementedError
