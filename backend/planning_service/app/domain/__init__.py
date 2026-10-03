"""
Domain models and solvers self-contained within planning_service.
No dependencies on parent repository directories.
"""

from app.domain.Base import BaseModel
from app.domain.Service_allowance import ServiceAllowance
from app.domain.Route import Route
from app.domain.Outlet import Outlet
from app.domain.Vehicle import Vehicle, VehicleTree
from app.domain.Calendar import CalendarDate, Calendar
from app.domain.Order import Order, OrderTree
from app.domain.Trip import Trip
from app.domain.Planner import (
    DispatchPlan,
    PlanStatus,
    ValidationResult,
    PlanValidator,
    HeuristicAllocationSolver,
)
from app.domain.ortools_solver import ORToolsAllocationSolver

__all__ = [
    "BaseModel",
    "ServiceAllowance",
    "Route",
    "Outlet",
    "Vehicle",
    "VehicleTree",
    "CalendarDate",
    "Calendar",
    "Order",
    "OrderTree",
    "Trip",
    "DispatchPlan",
    "PlanStatus",
    "ValidationResult",
    "PlanValidator",
    "HeuristicAllocationSolver",
    "ORToolsAllocationSolver",
]
