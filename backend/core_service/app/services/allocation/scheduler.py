"""Scheduler and Execution State Management for Allocation Engine."""

from __future__ import annotations

import asyncio
from datetime import date
from typing import Any
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import utc_now
from app.services.allocation.engine import run_allocation_engine

# Concurrency lock ensuring single solver execution across workers
SOLVER_LOCK = asyncio.Lock()

# Solver status state
SOLVER_STATE: dict[str, Any] = {
    "status": "idle",
    "progress_pct": 0,
    "operating_date": "",
    "last_run_at": None,
    "trips_generated": 0,
    "orders_deferred": 0,
    "execution_time_ms": 0,
    "last_error": None,
}

# 4:00 PM Asia/Colombo Cron State
CRON_CONFIG: dict[str, Any] = {
    "cutoff_time": "16:00",
    "timezone": "Asia/Colombo",
    "is_enabled": True,
    "last_scheduled_run": None,
}


def get_engine_status() -> dict[str, Any]:
    """Return the current allocation engine solver state."""
    return dict(SOLVER_STATE)


def update_cron_schedule(cutoff_time: str, timezone_name: str, is_enabled: bool) -> dict[str, Any]:
    """Configure the 4:00 PM automated cutoff schedule."""
    CRON_CONFIG["cutoff_time"] = cutoff_time
    CRON_CONFIG["timezone"] = timezone_name
    CRON_CONFIG["is_enabled"] = is_enabled
    return dict(CRON_CONFIG)


async def execute_scheduled_cutoff(
    session: AsyncSession,
    operating_date: date,
    depot_id: uuid.UUID,
    staff_id: uuid.UUID | None = None,
) -> dict[str, Any]:
    """Execute the automated daily cutoff allocation with concurrency lock."""
    if SOLVER_LOCK.locked():
        return {
            "status": "skipped_locked",
            "message": "Allocation solver is currently executing in another worker.",
        }

    async with SOLVER_LOCK:
        SOLVER_STATE.update(
            status="running",
            progress_pct=10,
            operating_date=operating_date.isoformat(),
            last_error=None,
        )
        try:
            result = await run_allocation_engine(
                session=session,
                operating_date=operating_date,
                depot_id=depot_id,
                staff_id=staff_id,
                simulation=False,
                solver_type="ortools",
            )
            await session.commit()

            SOLVER_STATE.update(
                status="completed",
                progress_pct=100,
                last_run_at=utc_now().isoformat(),
                trips_generated=result["summary"]["total_trips_created"],
                orders_deferred=result["summary"]["deferred_orders_count"],
                execution_time_ms=result["execution_time_ms"],
            )
            return result
        except Exception as exc:
            SOLVER_STATE.update(
                status="failed",
                progress_pct=0,
                last_error=str(exc),
            )
            raise
