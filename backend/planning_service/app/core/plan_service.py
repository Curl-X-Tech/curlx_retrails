"""
Planning Engine — Core Plan Execution and Lifecycle Management.

Coordinates data fetching, clustering with OrderTree, solver execution,
validation with PlanValidator, and PostgreSQL persistence.
"""

from __future__ import annotations

import asyncio
import datetime
from datetime import timezone
from typing import Any
import uuid


from app.core.database import AsyncSessionLocal
from app.core.data_provider import (
    fetch_orders,
    fetch_outlets,
    fetch_routes,
    fetch_vehicles,
    fetch_service_allowances,
)
from app.core.solver_factory import SolverFactory
from app.models.plan import DispatchPlanModel, PlannedTripModel
from app.schemas.planning_schemas import JobStatus
from app.domain.Order import OrderTree


def _now() -> datetime.datetime:
    return datetime.datetime.now(timezone.utc).replace(tzinfo=None)


# In-memory job registry for instant status tracking
JOBS: dict[str, dict[str, Any]] = {}


def _format_schedule_for_response(sched: dict | None) -> dict[str, Any] | None:
    if not sched:
        return None
    return {
        "dispatch_time": sched.get("departure_hhmm", "06:00"),
        "return_time": sched.get("return_to_depot_hhmm", "12:00"),
        "stops": [
            {
                "outlet_id": s.get("outlet_id", ""),
                "arrival": s.get("arrive_hhmm", "00:00"),
                "departure": s.get("depart_hhmm", "00:00"),
            }
            for s in sched.get("stops", [])
        ],
    }


async def execute_planning_run(
    job_id: str,
    order_ids: list[str],
    planning_date: datetime.date,
    solver_type: str = "heuristic",
    max_days: int = 4,
    created_by: str | None = None,
) -> str:
    """
    Executes full planning run: fetches data, clusters into trips, runs solver,
    formats EDF schedules, and persists to planning_db.
    """
    JOBS[job_id]["status"] = JobStatus.RUNNING

    try:
        # 1. Fetch live data
        orders = await fetch_orders(order_ids=order_ids, planning_date=planning_date)
        if not orders:
            raise ValueError(
                f"No orders found for the given criteria (order_ids={len(order_ids)}, date={planning_date})."
            )

        outlets = await fetch_outlets()
        routes = await fetch_routes()
        vehicles = await fetch_vehicles()
        service_allowances = await fetch_service_allowances()

        # 2. Cluster orders into trips via OrderTree
        order_tree = OrderTree()
        for o in orders:
            order_tree.add_order(o, outlets)

        trips = order_tree.create_all_trips(outlets, routes, sys_user=created_by or "DISPATCHER")

        # 3. Solve allocation
        solver = SolverFactory.create(
            solver_type=solver_type,
            trips=trips,
            vehicles=vehicles,
            outlets=outlets,
            service_allowances=service_allowances,
            max_days=max_days,
        )
        allocated_trips = solver.solve()

        # 4. Persist plan and trips to database
        plan_id = f"PLN-{uuid.uuid4().hex[:8].upper()}"
        now = _now()

        plan_model = DispatchPlanModel(
            ID=plan_id,
            CreateTime=now,
            UpdateTime=now,
            CreatedBy=created_by or "DISPATCHER",
            UpdatedBy=created_by or "DISPATCHER",
            IsActive=True,
            status="DRAFT",
            planning_date=planning_date,
            solver_used=solver_type,
            confirmed_by=None,
            confirmed_at=None,
        )

        planned_trips = []
        for t in allocated_trips:
            trip_id = f"TRP-{uuid.uuid4().hex[:8].upper()}"
            v_id = t.vehicle.ID if t.vehicle else None

            # Stop schedule formatting
            formatted_schedule = _format_schedule_for_response(t.stop_schedule)

            order_id_list = [o.get_id() for o in t.order_queue]
            trip_model = PlannedTripModel(
                ID=trip_id,
                trip_id=trip_id,
                CreateTime=now,
                UpdateTime=now,
                CreatedBy=created_by or "DISPATCHER",
                UpdatedBy=created_by or "DISPATCHER",
                IsActive=True,
                plan_id=plan_id,
                depot=t.route.get_depot() if t.route else (t.vehicle.depot if t.vehicle else "Peliyagoda"),
                district=t.route.district if t.route else "",
                brand=t.get_brand(outlets) or "Fresh",
                vehicle_id=v_id,
                allocation_day=t.allocation_day,
                allocation_source=getattr(t, "allocation_source", "AUTO") or "AUTO",
                is_locked=bool(getattr(t, "is_locked", False)),
                locked_by=getattr(t, "locked_by", None),
                locked_at=getattr(t, "locked_at", None),
                override_reason=getattr(t, "override_reason", None),
                allocation_error=getattr(t, "allocation_error", None),
                order_ids=order_id_list,
                order_count=len(order_id_list),
                total_weight_kg=round(t.total_weight_in_queue(), 2),
                total_volume_m3=round(t.total_volume_in_queue(), 2),
                stop_schedule=formatted_schedule,
            )
            planned_trips.append(trip_model)

        plan_model.trips = planned_trips

        async with AsyncSessionLocal() as session:
            session.add(plan_model)
            await session.commit()

        JOBS[job_id]["status"] = JobStatus.DONE
        JOBS[job_id]["plan_id"] = plan_id
        return plan_id

    except Exception as exc:
        JOBS[job_id]["status"] = JobStatus.FAILED
        JOBS[job_id]["error"] = str(exc)
        print(f"[planning-service] Planning job {job_id} failed: {exc}")
        raise exc


def enqueue_planning_job(
    order_ids: list[str],
    planning_date: datetime.date,
    solver_type: str = "heuristic",
    max_days: int = 4,
    created_by: str | None = None,
) -> tuple[str, int]:
    """Registers job and triggers execution in background."""
    job_id = f"job-{uuid.uuid4().hex[:8]}"
    estimated_ms = SolverFactory.estimated_ms(solver_type)

    JOBS[job_id] = {
        "job_id": job_id,
        "status": JobStatus.QUEUED,
        "plan_id": None,
        "estimated_ms": estimated_ms,
        "error": None,
    }

    # Launch background task
    asyncio.create_task(
        execute_planning_run(
            job_id=job_id,
            order_ids=order_ids,
            planning_date=planning_date,
            solver_type=solver_type,
            max_days=max_days,
            created_by=created_by,
        )
    )

    return job_id, estimated_ms
