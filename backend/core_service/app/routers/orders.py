"""Router: /orders — CRUD endpoints for Order entities."""

from datetime import date, datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.entities.depot import Depot as DepotEntity
from app.entities.outlet import Outlet
from app.models.order import OrderModel
from app.schemas.order_schemas import (
    OrderCreate,
    OrderBulkCreate,
    OrderUpdate,
    OrderResponse,
    OrderListResponse,
    TempCondition,
    OrderStatus,
    Depot,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


DEPOT_CODES = {"Peliyagoda": "PEL", "Kandy": "KDY"}


async def _get_outlets_for_depot(db: AsyncSession, depot: str) -> list[str]:
    """Return outlet codes of active outlets served by the given depot."""
    result = await db.execute(
        select(Outlet.outlet_id)
        .join(DepotEntity, Outlet.depot_id == DepotEntity.id)
        .where(DepotEntity.code == DEPOT_CODES.get(depot, depot), Outlet.is_active.is_(True))
    )
    return list(result.scalars().all())


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a single order",
    description="Creates one delivery order. Role: DISPATCHER+",
)
async def create_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
):
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.utcnow()

    order = OrderModel(
        ID=order_id,
        CreateTime=now,
        UpdateTime=now,
        CreatedBy="DISPATCHER",
        UpdatedBy="DISPATCHER",
        IsActive=True,
        outlet_id=payload.outlet_id,
        order_date=payload.order_date,
        order_time=payload.order_time,
        weight_kg=payload.weight_kg,
        volume_m3=payload.volume_m3,
        temp_condition=payload.temp_condition.value,
        status="pending",
        allocation_day=None,
    )
    db.add(order)
    await db.flush()
    await db.refresh(order)
    return order


@router.post(
    "/bulk",
    response_model=list[OrderResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Batch-create orders (max 500)",
    description="Creates up to 500 orders in one request. Role: DISPATCHER+",
)
async def bulk_create_orders(
    payload: OrderBulkCreate,
    db: AsyncSession = Depends(get_db),
):
    now = datetime.utcnow()
    created_orders = []

    for item in payload.orders:
        order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        order = OrderModel(
            ID=order_id,
            CreateTime=now,
            UpdateTime=now,
            CreatedBy="DISPATCHER",
            UpdatedBy="DISPATCHER",
            IsActive=True,
            outlet_id=item.outlet_id,
            order_date=item.order_date,
            order_time=item.order_time,
            weight_kg=item.weight_kg,
            volume_m3=item.volume_m3,
            temp_condition=item.temp_condition.value,
            status="pending",
            allocation_day=None,
        )
        db.add(order)
        created_orders.append(order)

    await db.flush()
    for o in created_orders:
        await db.refresh(o)

    return created_orders


@router.get(
    "",
    response_model=OrderListResponse,
    summary="List orders with filters",
    description="Returns paginated orders. All query params are optional. Role: DISPATCHER+",
)
async def list_orders(
    outlet_id: str | None = Query(default=None),
    order_date: date | None = Query(default=None, description="ISO date: YYYY-MM-DD"),
    temp_condition: TempCondition | None = Query(default=None),
    status_filter: OrderStatus | None = Query(default=None, alias="status"),
    depot: Depot | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(OrderModel).where(OrderModel.IsActive.is_(True))

    if outlet_id:
        query = query.where(OrderModel.outlet_id == outlet_id)
    if order_date:
        query = query.where(OrderModel.order_date == order_date)
    if temp_condition:
        query = query.where(OrderModel.temp_condition == temp_condition.value)
    if status_filter:
        query = query.where(OrderModel.status == status_filter.value)
    if depot:
        outlet_ids = await _get_outlets_for_depot(db, depot.value)
        if outlet_ids:
            query = query.where(OrderModel.outlet_id.in_(outlet_ids))
        else:
            # If depot has no outlets found, match none
            query = query.where(OrderModel.outlet_id == "__NONE__")

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    items = list(
        (
            await db.execute(
                query.order_by(OrderModel.order_date, OrderModel.order_time, OrderModel.ID).offset(offset).limit(limit)
            )
        )
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
    "/{order_id}",
    response_model=OrderResponse,
    summary="Get a single order by ID",
)
async def get_order(
    order_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    order = await db.get(OrderModel, order_id)
    if not order or not order.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' not found.",
        )
    return order


@router.patch(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Update mutable order fields",
    description="Allowed fields: order_time, weight_kg, volume_m3. Role: DISPATCHER+",
)
async def update_order(
    order_id: str = Path(...),
    payload: OrderUpdate = ...,
    db: AsyncSession = Depends(get_db),
):
    order = await db.get(OrderModel, order_id)
    if not order or not order.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' not found.",
        )

    if payload.order_time is not None:
        order.order_time = payload.order_time
    if payload.weight_kg is not None:
        order.weight_kg = payload.weight_kg
    if payload.volume_m3 is not None:
        order.volume_m3 = payload.volume_m3

    order.UpdateTime = datetime.utcnow()
    order.UpdatedBy = "DISPATCHER"

    await db.flush()
    await db.refresh(order)
    return order


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_200_OK,
    summary="Soft-delete an order",
    description="Sets IsActive=false. Role: DEPOT_MANAGER+",
)
async def delete_order(
    order_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    order = await db.get(OrderModel, order_id)
    if not order or not order.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_id}' not found.",
        )

    order.IsActive = False
    order.UpdateTime = datetime.utcnow()
    order.UpdatedBy = "DEPOT_MANAGER"
    await db.flush()

    return {"id": order_id, "deleted": True, "message": f"Order '{order_id}' soft-deleted."}
