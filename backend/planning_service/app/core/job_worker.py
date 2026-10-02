"""
Celery job worker — async plan generation task.

This module defines the Celery application and the single task
`run_allocation_job` that the FastAPI endpoint enqueues.

Flow
────
1. POST /plans/generate enqueues run_allocation_job.delay(...)
2. A Celery worker picks up the task (runs SolverFactory.create())
3. Solver fetches live data from downstream services (vehicles, routes,
   outlets, service allowances) via HTTP
4. Solver produces a DispatchPlan → persisted to planning_db
5. plan.draft_created event is published to RabbitMQ
6. GET /plans/job/{job_id} returns status=done + plan_id

Worker start command (from docker-compose):
    celery -A app.core.job_worker worker --loglevel=info --concurrency=4
"""

from __future__ import annotations

import uuid
import datetime
from celery import Celery

from app.core.config import get_settings
from app.schemas.planning_schemas import SolverType

settings = get_settings()

# ── Celery application ────────────────────────────────────────────────────── #

celery_app = Celery(
    "planning_engine",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    result_expires=3600,  # Job results kept for 1 hour
)


# ── Main allocation task ──────────────────────────────────────────────────── #


@celery_app.task(bind=True, name="planning.run_allocation_job")
def run_allocation_job(
    self,
    order_ids: list[str],
    planning_date: str,
    solver_type: str = SolverType.HEURISTIC,
    max_days: int = 4,
    created_by: str | None = None,
) -> dict:
    import asyncio
    import time
    from app.core.plan_service import execute_planning_run

    start = time.perf_counter()
    p_date = datetime.date.fromisoformat(planning_date) if isinstance(planning_date, str) else planning_date
    job_id = self.request.id or f"celery-{uuid.uuid4().hex[:8]}"

    plan_id = asyncio.run(
        execute_planning_run(
            job_id=job_id,
            order_ids=order_ids,
            planning_date=p_date,
            solver_type=solver_type,
            max_days=max_days,
            created_by=created_by,
        )
    )

    elapsed_ms = int((time.perf_counter() - start) * 1000)

    return {
        "plan_id": plan_id,
        "status": "done",
        "solver_used": solver_type,
        "elapsed_ms": elapsed_ms,
    }
