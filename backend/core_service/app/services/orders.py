import uuid
from collections.abc import Sequence
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import utc_today
from app.entities.customer_order import CustomerOrder, OrderItem
from app.entities.item import Item
from app.entities.outlet import Outlet
from app.entities.price_list import PriceList
from app.schemas.customer_order import OrderCreate, OrderRead


async def active_unit_prices(session: AsyncSession, item_ids: Sequence[uuid.UUID], on: date) -> dict[uuid.UUID, float]:
    rows = await session.execute(
        select(PriceList)
        .where(PriceList.item_id.in_(item_ids), PriceList.is_active.is_(True), PriceList.effective_from <= on)
        .where((PriceList.effective_to.is_(None)) | (PriceList.effective_to >= on))
        .order_by(PriceList.effective_from.asc(), PriceList.created_at.asc())
    )
    return {price.item_id: price.unit_price for price in rows.scalars()}


async def create_order(session: AsyncSession, payload: OrderCreate, user_id: uuid.UUID | None) -> CustomerOrder:
    """Persists an order and its priced line items. Caller commits."""
    if payload.idempotency_key:
        existing = (
            await session.execute(select(CustomerOrder).where(CustomerOrder.idempotency_key == payload.idempotency_key))
        ).scalar_one_or_none()
        if existing:
            return existing

    if await session.get(Outlet, payload.outlet_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OUTLET_NOT_FOUND")

    item_ids = list({line.item_id for line in payload.items})
    items = {i.id: i for i in (await session.execute(select(Item).where(Item.id.in_(item_ids)))).scalars()}
    if len(items) != len(item_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ITEM_NOT_FOUND")
    prices = await active_unit_prices(session, item_ids, utc_today())

    temp = payload.temp_requirement or ("chilled" if any(i.requires_cold_chain for i in items.values()) else "ambient")
    order_ref = f"ORD-{payload.order_date:%Y%m%d}-{uuid.uuid4().hex[:6].upper()}"
    order = CustomerOrder(
        name=order_ref,
        order_ref=order_ref,
        idempotency_key=payload.idempotency_key,
        outlet_id=payload.outlet_id,
        created_by_staff_id=user_id,
        order_date=payload.order_date,
        required_date=payload.required_date or payload.order_date,
        temp_requirement=temp,
        is_urgent=payload.is_urgent,
        created_by=user_id,
        updated_by=user_id,
    )
    session.add(order)
    await session.flush()
    for index, line in enumerate(payload.items, start=1):
        item = items[line.item_id]
        session.add(
            OrderItem(
                name=item.name,
                order_id=order.id,
                item_id=item.id,
                package_code=f"{order_ref}-{index:02d}",
                requested_qty=line.requested_qty,
                unit_weight_kg=item.unit_weight_kg,
                unit_volume_m3=item.unit_volume_m3,
                unit_price=prices.get(item.id, 0.0),
                special_handling_code=line.special_handling_code or item.special_handling_code,
                created_by=user_id,
                updated_by=user_id,
            )
        )
    await session.flush()
    return order


async def order_reads(session: AsyncSession, orders: Sequence[CustomerOrder]) -> list[OrderRead]:
    """Builds order headers with aggregated totals and the brand of the ordering outlet."""
    if not orders:
        return []
    ids = [o.id for o in orders]
    totals = {
        row.order_id: row
        for row in await session.execute(
            select(
                OrderItem.order_id,
                func.sum(OrderItem.requested_qty * OrderItem.unit_weight_kg).label("weight"),
                func.sum(OrderItem.requested_qty * OrderItem.unit_volume_m3).label("volume"),
                func.sum(OrderItem.requested_qty * OrderItem.unit_price).label("price"),
            )
            .where(OrderItem.order_id.in_(ids))
            .group_by(OrderItem.order_id)
        )
    }
    brands = dict(
        (await session.execute(select(Outlet.id, Outlet.brand_id).where(Outlet.id.in_({o.outlet_id for o in orders}))))
        .tuples()
        .all()
    )
    reads = []
    for order in orders:
        row = totals.get(order.id)
        reads.append(
            OrderRead(
                **order.model_dump(
                    include={
                        "id",
                        "order_ref",
                        "outlet_id",
                        "order_date",
                        "required_date",
                        "temp_requirement",
                        "status",
                        "is_urgent",
                        "deferred_yesterday",
                        "days_since_last_served",
                        "created_by_staff_id",
                        "created_at",
                        "updated_at",
                    }
                ),
                brand_id=brands[order.outlet_id],
                total_weight_kg=round(float(row.weight or 0), 3) if row else 0.0,
                total_volume_m3=round(float(row.volume or 0), 4) if row else 0.0,
                total_price_lkr=round(float(row.price or 0), 2) if row else 0.0,
            )
        )
    return reads
