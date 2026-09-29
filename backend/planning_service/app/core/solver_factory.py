"""
SolverFactory — selects and instantiates the correct allocation solver.

Supported solvers:
  "heuristic"  →  HeuristicAllocationSolver  (~200 ms, default)
                  Located in: app.domain.Planner
  "ortools"    →  ORToolsAllocationSolver     (~1800 ms, optimal)
                  Located in: app.domain.ortools_solver
"""

from __future__ import annotations

from typing import Any

from app.schemas.planning_schemas import SolverType
from app.domain.Planner import HeuristicAllocationSolver
from app.domain.ortools_solver import ORToolsAllocationSolver
from app.domain.Trip import Trip
from app.domain.Vehicle import Vehicle
from app.domain.Outlet import Outlet
from app.domain.Service_allowance import ServiceAllowance


class SolverWrapper:
    """Unified wrapper around Heuristic and OR-Tools solvers."""

    def __init__(
        self,
        solver_instance: Any,
        outlets: list[Outlet],
        service_allowances: list[ServiceAllowance],
    ) -> None:
        self.solver = solver_instance
        self.outlets = outlets
        self.service_allowances = service_allowances

    def solve(self) -> list[Trip]:
        trips: list[Trip] = self.solver.solve()
        # Post-processing: Ensure all allocated trips have EDF stop_schedule calculated
        for t in trips:
            if t.vehicle is not None and not t.stop_schedule:
                t.apply_optimal_sequence(self.outlets, self.service_allowances)
        return trips


class SolverFactory:
    """Factory that returns the correct solver instance based on solver_type."""

    ESTIMATED_MS: dict[SolverType, int] = {
        SolverType.HEURISTIC: 250,
        SolverType.ORTOOLS:   1800,
    }

    @staticmethod
    def create(
        solver_type: SolverType | str,
        trips: list[Trip],
        vehicles: list[Vehicle],
        outlets: list[Outlet],
        service_allowances: list[ServiceAllowance],
        max_days: int = 4,
    ) -> SolverWrapper:
        st = SolverType(solver_type)

        if st == SolverType.HEURISTIC:
            solver = HeuristicAllocationSolver(
                trips=trips,
                vehicles=vehicles,
                outlets=outlets,
                service_allowances=service_allowances,
                max_days=max_days,
            )
            return SolverWrapper(solver, outlets, service_allowances)

        if st == SolverType.ORTOOLS:
            solver = ORToolsAllocationSolver(
                trips=trips,
                vehicles=vehicles,
                outlets=outlets,
                service_allowances=service_allowances,
                max_days=max_days,
            )
            return SolverWrapper(solver, outlets, service_allowances)

        raise ValueError(f"Unknown solver type: {solver_type!r}")

    @staticmethod
    def estimated_ms(solver_type: SolverType | str) -> int:
        st = SolverType(solver_type)
        return SolverFactory.ESTIMATED_MS.get(st, 500)
