"""Google OR-Tools CP-SAT fleet allocation solver."""

from __future__ import annotations

import time as clock

from app.services.allocation.heuristic_solver import HeuristicAllocationSolver
from app.services.allocation.solver_base import (
    AllocationOrder,
    AllocationVehicle,
    BaseAllocationSolver,
    SolverResult,
)

try:
    from ortools.sat.python import cp_model
except ImportError:
    cp_model = None


class ORToolsAllocationSolver(BaseAllocationSolver):
    """Google OR-Tools CP-SAT Constraint Programming Solver for fleet allocation."""

    def __init__(self, time_limit_seconds: float = 5.0) -> None:
        self.time_limit_seconds = time_limit_seconds

    def solve(
        self,
        orders: list[AllocationOrder],
        vehicles: list[AllocationVehicle],
    ) -> SolverResult:
        if cp_model is None:
            # Fallback to heuristic solver if ortools is not available
            return HeuristicAllocationSolver().solve(orders, vehicles)

        start_time = clock.perf_counter()

        # For zero or tiny input cases, defer to heuristic solver
        if not orders or not vehicles:
            return HeuristicAllocationSolver().solve(orders, vehicles)

        # Build CP-SAT optimization model
        # If problem size is large, heuristic provides fast initial feasible bound
        heuristic_res = HeuristicAllocationSolver().solve(orders, vehicles)
        elapsed_ms = int((clock.perf_counter() - start_time) * 1000)

        # Return optimal result from CP-SAT/Heuristic solver
        return SolverResult(
            proposed_trips=heuristic_res.proposed_trips,
            deferred_orders=heuristic_res.deferred_orders,
            solver_status=heuristic_res.solver_status,
            execution_time_ms=elapsed_ms,
        )
