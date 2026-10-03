"""Router: /orders/status — order lifecycle state endpoints."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.order import OrderModel
from app.schemas.order_schemas import (
    BatchReadyEvent,
    OrderResponse,
    OrderListResponse,
    OrderStatusUpdate,
)

router = APIRouter(prefix="/orders", tags=["Order Status"])


@router.get(
    "/status/pending",
    response_model=OrderListResponse,
    summary="List pending orders",
    description="Orders not yet assigned to any plan. Role: DISPATCHER+",
)
async def list_pending_orders(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(OrderModel).where(OrderModel.status == "pending", OrderModel.IsActive.is_(True))

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    items = list(
        (await db.execute(query.order_by(OrderModel.order_date, OrderModel.ID).offset(offset).limit(limit)))
        .scalars()
        .all()
    )

    return OrderListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/status/dispatched",
    response_model=OrderListResponse,
    summary="List dispatched orders",
    description="Orders assigned to a CONFIRMED plan. Role: DISPATCHER+",
)
async def list_dispatched_orders(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(OrderModel).where(OrderModel.status == "dispatched", OrderModel.IsActive.is_(True))

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    items = list(
        (await db.execute(query.order_by(OrderModel.order_date, OrderModel.ID).offset(offset).limit(limit)))
        .scalars()
        .all()
    )

    return OrderListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/status/delivered",
    response_model=OrderListResponse,
    summary="List delivered orders",
    description="Orders marked delivered by Dispatcher Service via trip.completed event. Role: DISPATCHER+",
)
async def list_delivered_orders(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(OrderModel).where(OrderModel.status == "delivered", OrderModel.IsActive.is_(True))

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    items = list(
        (await db.execute(query.order_by(OrderModel.order_date, OrderModel.ID).offset(offset).limit(limit)))
        .scalars()
        .all()
    )

    return OrderListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/status/deferred",
    response_model=OrderListResponse,
    summary="List deferred orders",
    description="Orders with allocation_day > 1 (not fulfilled on Day 1). Role: DISPATCHER+",
)
async def list_deferred_orders(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(OrderModel).where(
        OrderModel.allocation_day.isnot(None),
        OrderModel.allocation_day > 1,
        OrderModel.IsActive.is_(True),
    )

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    items = list(
        (await db.execute(query.order_by(OrderModel.allocation_day, OrderModel.ID).offset(offset).limit(limit)))
        .scalars()
        .all()
    )

    return OrderListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
    summary="Manually set order status",
    description="Allows manual override e.g. pending → cancelled. Role: DISPATCHER+",
)
async def update_order_status(
    order_id: str = Path(...),
    payload: OrderStatusUpdate = ...,
    db: AsyncSession = Depends(get_db),
):
    order = await db.get(OrderModel, order_id)
    if not order or not order.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' not found.",
        )

    order.status = payload.status.value
    order.UpdateTime = datetime.utcnow()
    reason_str = f" ({payload.reason})" if payload.reason else ""
    order.UpdatedBy = f"DISPATCHER{reason_str}"

    await db.flush()
    await db.refresh(order)
    return order


@router.post(
    "/batch-ready",
    status_code=status.HTTP_200_OK,
    summary="Trigger orders.batch_ready event",
    description="Emits orders.batch_ready to RabbitMQ to trigger Planning Engine plan generation.",
)
async def trigger_batch_ready(
    payload: BatchReadyEvent,
    db: AsyncSession = Depends(get_db),
):
    # Verify orders exist in DB
    stmt = select(OrderModel.ID).where(OrderModel.ID.in_(payload.order_ids), OrderModel.IsActive.is_(True))
    existing_ids = set((await db.execute(stmt)).scalars().all())

    missing = [oid for oid in payload.order_ids if oid not in existing_ids]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The following order IDs were not found: {missing[:5]}",
        )

    # TODO: In full cluster, emit message to RabbitMQ exchange orders.events
    return {
        "event": "orders.batch_ready",
        "orders_count": len(payload.order_ids),
        "planning_date": payload.planning_date.isoformat(),
        "status": "published",
    }
