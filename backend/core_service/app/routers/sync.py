"""Router: /sync — Batch synchronization for offline-first clients (Dexie mutations)."""

from datetime import datetime
import time
import uuid
from typing import Any, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.core.users import current_active_user
from app.entities.trip import VehicleTelemetry
from app.routers.deliveries import (
    ArriveRequest,
    DiscrepancyRequest,
    PodRequest,
    arrive,
    log_discrepancy,
    submit_pod,
)
from app.routers.telemetry import TelemetryReport, build_telemetry
from app.entities.customer_order import CustomerOrder
from app.entities.user import User
from app.schemas.customer_order import OrderCreate
from app.services.orders import create_order

router = APIRouter(prefix="/sync", tags=["Sync"])


class QueuedMutationSchema(BaseModel):
    idempotency_key: str
    entity_type: str
    action: str
    payload: dict[str, Any] = Field(default_factory=dict)
    client_timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    user_id: str | None = None
    status: str | None = "queued"
    attempts: int = 0


class SyncBatchRequest(BaseModel):
    client_device_id: str
    mutations: list[QueuedMutationSchema] = Field(default_factory=list)


class MutationResult(BaseModel):
    idempotency_key: str
    status: Literal["applied", "duplicate_ignored", "conflict_resolved"]
    entity_id: str | None = None


class SyncBatchResponse(BaseModel):
    batch_id: str
    processed_count: int
    results: list[MutationResult]
    server_timestamp: int


async def _apply_telemetry(db: AsyncSession, m: QueuedMutationSchema) -> MutationResult:
    try:
        pings = [TelemetryReport.model_validate(p) for p in m.payload.get("pings", [])]
    except ValidationError:
        return MutationResult(idempotency_key=m.idempotency_key, status="conflict_resolved")
    known = (
        await db.execute(
            select(VehicleTelemetry.id).where(VehicleTelemetry.idempotency_key == f"{m.idempotency_key}:0")
        )
    ).first()
    if known is None:
        for index, ping in enumerate(pings):
            row = build_telemetry(ping)
            row.idempotency_key = f"{m.idempotency_key}:{index}"
            db.add(row)
    return MutationResult(
        idempotency_key=m.idempotency_key, status="duplicate_ignored" if known else "applied", entity_id=None
    )


async def _apply_delivery(
    db: AsyncSession, user: User, m: QueuedMutationSchema, entity_id: str | None
) -> MutationResult:
    waypoint_id = m.payload.get("waypoint_id") or m.payload.get("route_leg_id")
    try:
        waypoint = uuid.UUID(str(waypoint_id))
        if m.entity_type == "route_leg":
            await arrive(waypoint, ArriveRequest.model_validate(m.payload), db, user)
        elif "issue_type" in m.payload:
            await log_discrepancy(waypoint, DiscrepancyRequest.model_validate(m.payload), db, user)
        else:
            await submit_pod(waypoint, PodRequest.model_validate(m.payload), db, user)
    except (ValueError, ValidationError):
        return MutationResult(idempotency_key=m.idempotency_key, status="conflict_resolved")
    except HTTPException as exc:
        known = exc.status_code == status.HTTP_409_CONFLICT
        return MutationResult(
            idempotency_key=m.idempotency_key,
            status="duplicate_ignored" if known else "conflict_resolved",
            entity_id=entity_id,
        )
    return MutationResult(idempotency_key=m.idempotency_key, status="applied", entity_id=entity_id)


@router.post(
    "/batch",
    response_model=SyncBatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Batch sync offline mutations",
    description="Processes queued Dexie mutations from offline mobile drivers and warehouse loaders.",
)
async def process_sync_batch(
    req: SyncBatchRequest,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session),
):
    # ponytail: process mutations directly with idempotency check
    batch_id = f"batch_{uuid.uuid4().hex[:12]}"
    results: list[MutationResult] = []

    for m in req.mutations:
        entity_id = m.payload.get("id") or m.payload.get("order_id") or m.payload.get("waypoint_id")

        if m.entity_type == "order" and m.action == "create":
            try:
                order_in = OrderCreate.model_validate({**m.payload, "idempotency_key": m.idempotency_key})
            except ValidationError:
                results.append(MutationResult(idempotency_key=m.idempotency_key, status="conflict_resolved"))
                continue
            known = (
                await db.execute(select(CustomerOrder.id).where(CustomerOrder.idempotency_key == m.idempotency_key))
            ).scalar_one_or_none()
            try:
                order = await create_order(db, order_in, user.id)
            except HTTPException:
                results.append(MutationResult(idempotency_key=m.idempotency_key, status="conflict_resolved"))
                continue
            results.append(
                MutationResult(
                    idempotency_key=m.idempotency_key,
                    status="duplicate_ignored" if known else "applied",
                    entity_id=str(order.id),
                )
            )
        elif m.entity_type == "telemetry" and m.action == "create":
            results.append(await _apply_telemetry(db, m))
        elif m.entity_type in ("route_leg", "proof_of_delivery"):
            results.append(await _apply_delivery(db, user, m, entity_id))
        else:
            results.append(MutationResult(idempotency_key=m.idempotency_key, status="applied", entity_id=entity_id))

    await db.commit()

    return SyncBatchResponse(
        batch_id=batch_id,
        processed_count=len(results),
        results=results,
        server_timestamp=int(time.time() * 1000),
    )
