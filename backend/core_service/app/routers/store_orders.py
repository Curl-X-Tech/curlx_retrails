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
from app.schemas.customer_order import (
    OrderCreate,
    OrderDetail,
    OrderItemRead,
    OrderRead,
    OrderStatus,
    OrderStatusUpdate,
)
from app.services.orders import create_order, order_reads

router = APIRouter(prefix="/orders", tags=["orders"])

SessionDep = Annotated[AsyncSession, Depends(get_async_session)]
AuthDep = Annotated[User, Depends(current_active_user)]
CreatorDep = Annotated[User, Depends(RoleGuard(RoleType.STORE_MANAGER, RoleType.DISPATCHER))]
StatusEditorDep = Annotated[User, Depends(RoleGuard(RoleType.DISPATCHER, RoleType.LOADER, RoleType.DRIVER))]


async def _get_order(session: AsyncSession, id: uuid.UUID) -> CustomerOrder:
    order = await session.get(CustomerOrder, id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ORDER_NOT_FOUND")
    return order


@router.get("", response_model=list[OrderRead], summary="List orders")
async def list_orders(
    _user: AuthDep,
    session: SessionDep,
    outlet_id: uuid.UUID | None = None,
    brand_id: uuid.UUID | None = None,
    order_status: Annotated[OrderStatus | None, Query(alias="status")] = None,
    order_date: date | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=500)] = 500,
) -> list[OrderRead]:
    query = select(CustomerOrder)
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
async def get_order(id: uuid.UUID, _user: AuthDep, session: SessionDep) -> OrderDetail:
    order = await _get_order(session, id)
    [header] = await order_reads(session, [order])
    rows = await session.execute(
        select(OrderItem, Item.name, Item.category)
        .join(Item, Item.id == OrderItem.item_id)
        .where(OrderItem.order_id == id)
        .order_by(OrderItem.package_code.asc())
    )
    items = [
        OrderItemRead.model_validate(line).model_copy(update={"item_name": name, "category": category})
        for line, name, category in rows.all()
    ]
    outlet = await session.get(Outlet, order.outlet_id)
    district = await session.get(District, outlet.district_id)
    depot = await session.get(Depot, outlet.depot_id)
    return OrderDetail(
        **header.model_dump(),
        items=items,
        outlet_name=outlet.name,
        district=district.name if district else None,
        depot=depot.name if depot else None,
        dock_type=outlet.dock_type.value,
        parking_constraint=outlet.parking_constraint.value,
        delivery_window=f"{outlet.window_open_time:%H:%M}-{outlet.window_close_time:%H:%M}",
    )


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
    order.status = payload.status
    order.updated_by = user.id
    order.updated_at = utc_now()
    await session.commit()
    await session.refresh(order)
    [read] = await order_reads(session, [order])
    return read
