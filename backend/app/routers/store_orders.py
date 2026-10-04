import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.core.timezone import utc_now
from app.core.users import current_active_user
from app.entities.customer_order import CustomerOrder, OrderItem
from app.entities.district import District
from app.entities.depot import Depot
from app.entities.item import Item
from app.entities.outlet import Outlet
from app.entities.user import User
from app.enums.roles import RoleType
from app.guards import RoleGuard
from app.schemas.store_order import (
    OrderCreate,
    OrderDetail,
    OrderItemRead,
    OrderRead,
    OrderStatus,
    OrderStatusUpdate,
)
from app.services.dispatcher_scope import is_scoped, order_scope
from app.services.orders import create_order, order_reads

router = APIRouter(prefix="/orders", tags=["orders"])

SessionDep = Annotated[AsyncSession, Depends(get_async_session)]
AuthDep = Annotated[User, Depends(current_active_user)]
CreatorDep = Annotated[User, Depends(RoleGuard(RoleType.STORE_MANAGER, RoleType.DISPATCHER))]
StatusEditorDep = Annotated[
    User,
    Depends(RoleGuard(RoleType.DISPATCHER, RoleType.LOADER, RoleType.DRIVER, RoleType.STORE_MANAGER)),
]


async def _get_order(session: AsyncSession, id: uuid.UUID) -> CustomerOrder:
    order = await session.get(CustomerOrder, id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ORDER_NOT_FOUND")
    return order


@router.get("", response_model=list[OrderRead], summary="List orders")
async def list_orders(
    user: AuthDep,
    session: SessionDep,
    outlet_id: uuid.UUID | None = None,
    brand_id: uuid.UUID | None = None,
    order_status: Annotated[OrderStatus | None, Query(alias="status")] = None,
    order_date: date | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=500)] = 500,
) -> list[OrderRead]:
    query = select(CustomerOrder)
    if is_scoped(user):
        query = query.where(order_scope(user))
    if brand_id:
        query = query.join(Outlet, Outlet.id == CustomerOrder.outlet_id).where(Outlet.brand_id == brand_id)
    if outlet_id:
        query = query.where(CustomerOrder.outlet_id == outlet_id)
    if order_status:
        query = query.where(CustomerOrder.status == order_status)
    if order_date:
        query = query.where(CustomerOrder.order_date == order_date)
    query = (
        query.order_by(CustomerOrder.order_date.desc(), CustomerOrder.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    orders = (await session.execute(query)).scalars().all()
    return await order_reads(session, orders)


@router.get("/{id}", response_model=OrderDetail, summary="Get order detail with line items")
async def get_order(id: str, user: AuthDep, session: SessionDep) -> OrderDetail:
    try:
        order = await _get_order(session, uuid.UUID(id))
    except ValueError:
        order = (await session.execute(select(CustomerOrder).where(CustomerOrder.order_ref == id))).scalar_one_or_none()
        if order is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ORDER_NOT_FOUND") from None
    if is_scoped(user):
        visible = await session.execute(select(CustomerOrder.id).where(CustomerOrder.id == order.id, order_scope(user)))
        if visible.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ORDER_NOT_FOUND")
    [header] = await order_reads(session, [order])
    rows = await session.execute(
        select(OrderItem, Item.name, Item.category, Item.unit)
        .join(Item, Item.id == OrderItem.item_id)
        .where(OrderItem.order_id == order.id)
        .order_by(OrderItem.package_code.asc())
    )
    items = [
        OrderItemRead.model_validate(line).model_copy(update={"item_name": name, "category": category, "unit": unit})
        for line, name, category, unit in rows.all()
    ]
    outlet = await session.get(Outlet, order.outlet_id)
    district = await session.get(District, outlet.district_id) if outlet else None
    depot = await session.get(Depot, outlet.depot_id) if outlet else None
    window = "05:00 - 08:00 AM"
    if outlet and outlet.window_open_time and outlet.window_close_time:
        try:
            window = f"{outlet.window_open_time.strftime('%I:%M %p')} - {outlet.window_close_time.strftime('%I:%M %p')}"
        except Exception:
            window = f"{outlet.window_open_time} - {outlet.window_close_time}"

    data = header.model_dump()
    data.update(
        {
            "items": items,
            "outlet_name": outlet.name if outlet else header.outlet_name,
            "district": district.name if district else header.district,
            "depot": depot.name if depot else "Peliyagoda",
            "dock_type": outlet.dock_type.value if outlet else header.dock_type,
            "parking_constraint": outlet.parking_constraint.value if outlet else header.parking_constraint,
            "delivery_window": window or header.delivery_window or "05:00 - 08:00 AM",
        }
    )
    return OrderDetail(**data)


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED, summary="Place an order")
async def place_order(payload: OrderCreate, user: CreatorDep, session: SessionDep) -> OrderRead:
    order = await create_order(session, payload, user.id)
    await session.commit()
    await session.refresh(order)
    [read] = await order_reads(session, [order])
    return read


@router.patch("/{id}/status", response_model=OrderRead, summary="Update order status")
async def update_order_status(
    id: uuid.UUID, payload: OrderStatusUpdate, user: StatusEditorDep, session: SessionDep
) -> OrderRead:
    order = await _get_order(session, id)
    if is_scoped(user):
        visible = await session.execute(select(CustomerOrder.id).where(CustomerOrder.id == id, order_scope(user)))
        if visible.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ORDER_NOT_FOUND")
    order.status = payload.status
    order.updated_by = user.id
    order.updated_at = utc_now()
    await session.commit()
    await session.refresh(order)
    [read] = await order_reads(session, [order])
    return read
