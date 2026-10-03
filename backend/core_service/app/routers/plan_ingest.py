"""
Router: /dispatch/plans — ingest confirmed plans and generate run sheets.
"""

from __future__ import annotations

import datetime
from fastapi import APIRouter, Depends, Path, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from app.models.audit import DispatchAuditLogModel
from app.models.dispatch import LiveTripModel
from app.schemas.dispatch_schemas import PlanIngestRequest

router = APIRouter(prefix="/plans", tags=["Plan Ingestion"])


@router.post(
    "/ingest",
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a confirmed dispatch plan",
    description="Generates run sheets from trips confirmed in Planning Engine. Idempotent.",
)
async def ingest_confirmed_plan(
    payload: PlanIngestRequest,
    db: AsyncSession = Depends(get_db),
):
    ingested_trips: list[str] = []
    today = datetime.date.today().isoformat()

    for trip_data in payload.trips:
        # Check if trip already exists
        stmt = select(LiveTripModel).where(
            or_(LiveTripModel.trip_id == trip_data.trip_id, LiveTripModel.ID == trip_data.trip_id)
        )
        existing = (await db.execute(stmt)).scalars().first()

        # Format stops
        formatted_stops = []
        for s in trip_data.stops:
            formatted_stops.append(
                {
                    "outlet_id": s.get("outlet_id", ""),
                    "planned_arrival": s.get("arrival") or s.get("planned_arrival") or "07:00",
                    "planned_departure": s.get("departure") or s.get("planned_departure") or "07:30",
                    "actual_arrival": s.get("actual_arrival"),
                    "actual_departure": s.get("actual_departure"),
                    "delivered_weight_kg": s.get("delivered_weight_kg"),
                    "delivery_note": s.get("delivery_note"),
                    "order_id": s.get("order_id"),
                    "status": s.get("status", "pending"),
                }
            )

        if existing:
            existing.plan_id = payload.plan_id
            existing.vehicle_id = trip_data.vehicle_id
            existing.depot = trip_data.depot
            existing.district = trip_data.district
            existing.brand = trip_data.brand
            existing.trip_date = trip_data.date or existing.trip_date or today
            existing.planned_dispatch = trip_data.planned_dispatch
            existing.planned_return = trip_data.planned_return or "12:00"
            existing.stops = formatted_stops
            existing.allocated_from = trip_data.allocation_source
            existing.UpdateTime = datetime.datetime.utcnow()
            ingested_trips.append(existing.trip_id)
        else:
            new_trip = LiveTripModel(
                ID=trip_data.trip_id,
                trip_id=trip_data.trip_id,
                plan_id=payload.plan_id,
                vehicle_id=trip_data.vehicle_id,
                driver_id=None,
                depot=trip_data.depot,
                district=trip_data.district,
                brand=trip_data.brand,
                trip_date=trip_data.date or today,
                planned_dispatch=trip_data.planned_dispatch,
                planned_return=trip_data.planned_return or "12:00",
                live_status="scheduled",
                stops=formatted_stops,
                allocated_from=trip_data.allocation_source,
                is_manual=False,
            )
            db.add(new_trip)
            ingested_trips.append(new_trip.trip_id)

    audit = DispatchAuditLogModel(
        ID=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        actor="PLANNING_ENGINE",
        action="PLAN_INGESTED",
        details=f"Ingested plan '{payload.plan_id}' with {len(ingested_trips)} run sheets.",
    )
    db.add(audit)
    await db.flush()

    return {
        "status": "ingested",
        "plan_id": payload.plan_id,
        "runsheets_count": len(ingested_trips),
        "trip_ids": ingested_trips,
    }


@router.post(
    "/{plan_id}/supersede",
    status_code=status.HTTP_200_OK,
    summary="Supersede run sheets for a replaced plan",
    description="Marks scheduled run sheets belonging to the superseded plan as cancelled.",
)
async def supersede_plan(
    plan_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(LiveTripModel).where(
        LiveTripModel.plan_id == plan_id,
        LiveTripModel.live_status == "scheduled",
        LiveTripModel.IsActive.is_(True),
    )
    trips = list((await db.execute(stmt)).scalars().all())

    cancelled_count = 0
    now = datetime.datetime.utcnow()
    for t in trips:
        t.live_status = "cancelled"
        t.UpdateTime = now
        cancelled_count += 1

    audit = DispatchAuditLogModel(
        ID=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        actor="PLANNING_ENGINE",
        action="PLAN_SUPERSEDED",
        details=f"Plan '{plan_id}' superseded. Cancelled {cancelled_count} scheduled trips.",
    )
    db.add(audit)
    await db.flush()

    return {
        "status": "superseded",
        "plan_id": plan_id,
        "cancelled_trips_count": cancelled_count,
    }
