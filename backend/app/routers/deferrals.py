import uuid
from collections import Counter
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.core.timezone import sl_today, utc_now
from app.core.users import current_active_user
from app.entities.customer_order import CustomerOrder, DeferralAuditLog
from app.entities.user import User
from app.enums.master import ParkingConstraint
from app.guards import require_dispatcher
from app.schemas.store_order import (
    DeferOrderRequest,
    DeferralAuditLogRead,
    DeferralSummary,
    DeferredOrderRead,
    RequeueRequest,
)
from app.services.deferrals import fetch_deferral_audit_logs, fetch_deferred_orders

router = APIRouter(tags=["deferrals"])

SessionDep = Annotated[AsyncSession, Depends(get_async_session)]
AuthDep = Annotated[User, Depends(current_active_user)]
DispatcherDep = Annotated[User, Depends(require_dispatcher)]


@router.get("/deferrals", response_model=list[DeferredOrderRead], summary="List deferred orders")
async def list_deferrals(
    _user: AuthDep,
    session: SessionDep,
    outlet_id: uuid.UUID | None = None,
    brand_id: uuid.UUID | None = None,
    date_filter: Annotated[date | None, Query(alias="date")] = None,
    reason: str | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=500)] = 500,
) -> list[DeferredOrderRead]:
    deferred = await fetch_deferred_orders(session, outlet_id, brand_id, date_filter, reason)
    return deferred[(page - 1) * limit : page * limit]


@router.get("/deferrals/summary", response_model=DeferralSummary, summary="Deferral totals")
async def deferral_summary(_user: AuthDep, session: SessionDep) -> DeferralSummary:
    deferred = await fetch_deferred_orders(session)
    return DeferralSummary(
        total_deferred_orders=len(deferred),
        critical_escalations_count=sum(1 for o in deferred if o.deferred_yesterday == 1),
        total_weight_kg=round(sum(o.total_weight_kg for o in deferred), 3),
        total_volume_m3=round(sum(o.total_volume_m3 for o in deferred), 4),
        total_value_lkr=round(sum(o.total_price_lkr for o in deferred), 2),
        chilled_orders_count=sum(1 for o in deferred if o.temp_requirement == "chilled"),
        ambient_orders_count=sum(1 for o in deferred if o.temp_requirement == "ambient"),
        van_restricted_count=sum(1 for o in deferred if o.parking_constraint == ParkingConstraint.VAN_ONLY.value),
        reasons_breakdown=dict(Counter(o.deferral_reason for o in deferred if o.deferral_reason)),
    )


@router.get("/deferrals/audit-logs", summary="List deferral audit records")
async def list_deferral_audit_logs(
    _user: AuthDep,
    session: SessionDep,
    outlet_id: uuid.UUID | None = None,
    brand_id: uuid.UUID | None = None,
    date_filter: Annotated[date | None, Query(alias="date")] = None,
    reason: str | None = None,
    limiting_resource: str | None = None,
    search: str | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=500)] = 500,
) -> list[dict[str, object]]:
    logs = await fetch_deferral_audit_logs(session, outlet_id, brand_id, date_filter, reason, limiting_resource, search)
    return logs[(page - 1) * limit : page * limit]


@router.post(
    "/orders/{id}/defer",
    response_model=DeferralAuditLogRead,
    status_code=status.HTTP_201_CREATED,
    summary="Defer an order",
)
async def defer_order(id: uuid.UUID, payload: DeferOrderRequest, user: DispatcherDep, session: SessionDep):
    order = await session.get(CustomerOrder, id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ORDER_NOT_FOUND")
    if order.status in ("delivered", "cancelled"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="ORDER_NOT_DEFERRABLE")
    log = DeferralAuditLog(
        name=order.order_ref,
        order_id=order.id,
        outlet_id=order.outlet_id,
        dispatch_date=payload.dispatch_date or sl_today(),
        deferral_reason=payload.reason,
        limiting_resource=payload.limiting_resource,
        decision_maker_staff_id=payload.decision_maker_staff_id or user.id,
        notes=payload.notes,
        created_by=user.id,
        updated_by=user.id,
    )
    session.add(log)
    order.status = "deferred"
    order.updated_by = user.id
    order.updated_at = utc_now()
    await session.commit()
    await session.refresh(log)
    return log


@router.post("/deferrals/{id}/re-queue", summary="Return a deferred order to the pending queue")
async def requeue_deferral(
    id: uuid.UUID, user: DispatcherDep, session: SessionDep, _payload: RequeueRequest | None = None
) -> dict[str, object]:
    order = await session.get(CustomerOrder, id)
    if order is None or order.status != "deferred":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DEFERRED_ORDER_NOT_FOUND")
    order.status = "pending"
    order.deferred_yesterday = 1
    order.updated_by = user.id
    order.updated_at = utc_now()
    await session.commit()
    return {"success": True, "id": str(id)}
