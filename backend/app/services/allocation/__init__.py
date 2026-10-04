"""Allocation Engine Service Package."""

from app.services.allocation.engine import (
    fetch_allocation_orders,
    fetch_allocation_vehicles,
    get_solver,
    run_allocation_engine,
)
from app.services.allocation.heuristic_solver import HeuristicAllocationSolver
from app.services.allocation.ortools_solver import ORToolsAllocationSolver
from app.services.allocation.scheduler import (
    CRON_CONFIG,
    SOLVER_LOCK,
    SOLVER_STATE,
    execute_scheduled_cutoff,
    get_engine_status,
    update_cron_schedule,
)
from app.services.allocation.solver_base import (
    AllocationOrder,
    AllocationVehicle,
    BaseAllocationSolver,
    DeferredRecord,
    OrderItemData,
    ProposedLeg,
    ProposedTrip,
    SolverResult,
)
from app.services.allocation.time_budget import (
    FRESH_DAILY_BUDGET_MIN,
    GENERAL_DAILY_BUDGET_MIN,
    MAX_TRIPS_PER_VEHICLE,
    calculate_trip_minutes,
    get_service_allowance_min,
    get_travel_allowances,
)

__all__ = [
    "AllocationOrder",
    "AllocationVehicle",
    "BaseAllocationSolver",
    "CRON_CONFIG",
    "DeferredRecord",
    "FRESH_DAILY_BUDGET_MIN",
    "GENERAL_DAILY_BUDGET_MIN",
    "HeuristicAllocationSolver",
    "MAX_TRIPS_PER_VEHICLE",
    "OrderItemData",
    "ORToolsAllocationSolver",
    "ProposedLeg",
    "ProposedTrip",
    "SOLVER_LOCK",
    "SOLVER_STATE",
    "SolverResult",
    "calculate_trip_minutes",
    "execute_scheduled_cutoff",
    "fetch_allocation_orders",
    "fetch_allocation_vehicles",
    "get_engine_status",
    "get_service_allowance_min",
    "get_solver",
    "get_travel_allowances",
    "run_allocation_engine",
    "update_cron_schedule",
]
