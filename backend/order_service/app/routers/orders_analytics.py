"""Router: /orders/analytics — aggregated analytics endpoints."""

from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.order import OrderModel
from app.schemas.order_schemas import (
    OrdersByDateItem,
    OrdersByOutletItem,
    OrdersByTempItem,
    TempCondition,
)

router = APIRouter(prefix="/orders/analytics", tags=["Order Analytics"])


@router.get(
    "/by-date",
    response_model=list[OrdersByDateItem],
    summary="Order volume aggregated by date",
    description="Returns total orders, weight, and volume per order_date. Role: ANALYST+",
)
async def analytics_by_date(
    from_date: date | None = Query(default=None, description="ISO date filter start: YYYY-MM-DD"),
    to_date:   date | None = Query(default=None, description="ISO date filter end: YYYY-MM-DD"),
    db:        AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            OrderModel.order_date,
            func.count(OrderModel.ID).label("total_orders"),
            func.sum(OrderModel.weight_kg).label("total_weight_kg"),
            func.sum(OrderModel.volume_m3).label("total_volume_m3"),
        )
        .where(OrderModel.IsActive.is_(True))
        .group_by(OrderModel.order_date)
        .order_by(OrderModel.order_date)
    )

    if from_date:
        stmt = stmt.where(OrderModel.order_date >= from_date)
    if to_date:
        stmt = stmt.where(OrderModel.order_date <= to_date)

    rows = (await db.execute(stmt)).all()

    return [
        OrdersByDateItem(
            order_date=r.order_date,
            total_orders=r.total_orders,
            total_weight_kg=round(float(r.total_weight_kg or 0.0), 2),
            total_volume_m3=round(float(r.total_volume_m3 or 0.0), 2),
        )
        for r in rows
    ]


@router.get(
    "/by-outlet",
    response_model=list[OrdersByOutletItem],
    summary="Order count and weight by outlet",
    description="Returns per-outlet aggregation. Role: ANALYST+",
)
async def analytics_by_outlet(
    depot:    str | None = Query(default=None),
    district: str | None = Query(default=None),
    db:       AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            OrderModel.outlet_id,
            func.count(OrderModel.ID).label("total_orders"),
            func.sum(OrderModel.weight_kg).label("total_weight_kg"),
        )
        .where(OrderModel.IsActive.is_(True))
        .group_by(OrderModel.outlet_id)
        .order_by(func.count(OrderModel.ID).desc())
    )

    rows = (await db.execute(stmt)).all()

    return [
        OrdersByOutletItem(
            outlet_id=r.outlet_id,
            total_orders=r.total_orders,
            total_weight_kg=round(float(r.total_weight_kg or 0.0), 2),
        )
        for r in rows
    ]


@router.get(
    "/by-temp",
    response_model=list[OrdersByTempItem],
    summary="Order split by temperature condition",
    description="Returns totals for ambient / chilled / frozen. Role: ANALYST+",
)
async def analytics_by_temp(
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            OrderModel.temp_condition,
            func.count(OrderModel.ID).label("total_orders"),
            func.sum(OrderModel.weight_kg).label("total_weight_kg"),
            func.sum(OrderModel.volume_m3).label("total_volume_m3"),
        )
        .where(OrderModel.IsActive.is_(True))
        .group_by(OrderModel.temp_condition)
    )

    rows = (await db.execute(stmt)).all()

    return [
        OrdersByTempItem(
            temp_condition=TempCondition(r.temp_condition),
            total_orders=r.total_orders,
            total_weight_kg=round(float(r.total_weight_kg or 0.0), 2),
            total_volume_m3=round(float(r.total_volume_m3 or 0.0), 2),
        )
        for r in rows
    ]
