import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.entities.customer_order import OrderItem
from app.entities.trip import LoadingChecklistItem, RouteLeg


async def ensure_checklist(session: AsyncSession, trip_id: uuid.UUID) -> None:
    """Creates one pending checklist row per order item on the trip. Caller commits."""
    order_ids = (
        (
            await session.execute(
                select(RouteLeg.order_id).where(RouteLeg.trip_id == trip_id, RouteLeg.order_id.is_not(None))
            )
        )
        .scalars()
        .all()
    )
    if not order_ids:
        return
    existing = set(
        (
            await session.execute(
                select(LoadingChecklistItem.order_item_id).where(LoadingChecklistItem.trip_id == trip_id)
            )
        )
        .scalars()
        .all()
    )
    items = (await session.execute(select(OrderItem).where(OrderItem.order_id.in_(order_ids)))).scalars().all()
    for item in items:
        if item.id not in existing:
            session.add(LoadingChecklistItem(name=item.package_code, trip_id=trip_id, order_item_id=item.id))
