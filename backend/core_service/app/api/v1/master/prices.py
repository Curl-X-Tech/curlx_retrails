import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.entities.base import utc_today
from app.entities.item import Item
from app.entities.price_list import PriceList
from app.entities.user import User
from app.guards import require_system_admin
from app.schemas.price_list import (
    ActivePriceRead,
    PriceListCreate,
    PriceListRead,
    PriceListUpdate,
)

router = APIRouter(prefix="/prices", tags=["master-prices"])


@router.get(
    "",
    response_model=list[PriceListRead],
    summary="List temporal price list records",
)
async def list_prices(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    item_id: Annotated[uuid.UUID | None, Query(description="Filter by catalog Item ID")] = None,
    is_active: Annotated[bool | None, Query(description="Filter by active status")] = None,
) -> list[PriceList]:
    """Retrieve temporal price records across all catalog items."""
    query = select(PriceList).order_by(PriceList.item_id.asc(), PriceList.effective_from.desc())
    if item_id is not None:
        query = query.where(PriceList.item_id == item_id)
    if is_active is not None:
        query = query.where(PriceList.is_active == is_active)

    result = await session.execute(query)
    return list(result.scalars().all())


@router.get(
    "/active",
    response_model=list[ActivePriceRead],
    summary="Get active prices and valuations for all catalog items",
)
async def list_active_prices(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    as_of: Annotated[
        date | None,
        Query(description="Valuation effective date (defaults to current date YYYY-MM-DD)"),
    ] = None,
) -> list[ActivePriceRead]:
    """Resolve currently active price list entries matching v_active_price_list view logic."""
    target_date = as_of or utc_today()

    query = (
        select(PriceList, Item)
        .join(Item, PriceList.item_id == Item.id)
        .where(
            PriceList.is_active.is_(True),
            PriceList.effective_from <= target_date,
            or_(
                PriceList.effective_to.is_(None),
                PriceList.effective_to >= target_date,
            ),
        )
        .order_by(
            PriceList.item_id.asc(),
            PriceList.effective_from.desc(),
            PriceList.created_at.desc(),
        )
    )

    result = await session.execute(query)
    rows = result.all()

    seen_items: set[uuid.UUID] = set()
    active_prices: list[ActivePriceRead] = []

    for price_record, item_record in rows:
        if price_record.item_id in seen_items:
            continue
        seen_items.add(price_record.item_id)
        active_prices.append(
            ActivePriceRead(
                price_list_id=price_record.id,
                item_id=item_record.id,
                sku=item_record.sku,
                item_name=item_record.name,
                cost_price=price_record.cost_price,
                unit_price=price_record.unit_price,
                currency=price_record.currency,
                effective_from=price_record.effective_from,
                effective_to=price_record.effective_to,
                price_change_reason=price_record.price_change_reason,
            )
        )

    return active_prices


@router.get(
    "/items/{item_identifier}/active",
    response_model=ActivePriceRead,
    summary="Get current active price for a specific item",
)
async def get_active_price_for_item(
    item_identifier: str,
    session: Annotated[AsyncSession, Depends(get_async_session)],
    as_of: Annotated[
        date | None,
        Query(description="Valuation effective date (defaults to current date)"),
    ] = None,
) -> ActivePriceRead:
    """Resolve active valuation for an item by UUID or SKU."""
    target_date = as_of or utc_today()

    parsed_uuid = None
    try:
        parsed_uuid = uuid.UUID(item_identifier)
    except ValueError:
        pass

    if parsed_uuid:
        item_query = select(Item).where(or_(Item.id == parsed_uuid, Item.sku == item_identifier.upper()))
    else:
        item_query = select(Item).where(Item.sku == item_identifier.upper())

    item_res = await session.execute(item_query)
    item = item_res.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ITEM_NOT_FOUND",
        )

    price_query = (
        select(PriceList)
        .where(
            PriceList.item_id == item.id,
            PriceList.is_active.is_(True),
            PriceList.effective_from <= target_date,
            or_(
                PriceList.effective_to.is_(None),
                PriceList.effective_to >= target_date,
            ),
        )
        .order_by(PriceList.effective_from.desc(), PriceList.created_at.desc())
    )

    price_res = await session.execute(price_query)
    price = price_res.scalars().first()
    if not price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ACTIVE_PRICE_NOT_FOUND",
        )

    return ActivePriceRead(
        price_list_id=price.id,
        item_id=item.id,
        sku=item.sku,
        item_name=item.name,
        cost_price=price.cost_price,
        unit_price=price.unit_price,
        currency=price.currency,
        effective_from=price.effective_from,
        effective_to=price.effective_to,
        price_change_reason=price.price_change_reason,
    )


@router.get(
    "/{id}",
    response_model=PriceListRead,
    summary="Get price list entry by ID",
)
async def get_price_entry(
    id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> PriceList:
    """Retrieve specific price list entry record."""
    price = await session.get(PriceList, id)
    if not price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PRICE_ENTRY_NOT_FOUND",
        )
    return price


@router.post(
    "",
    response_model=PriceListRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new price list record (Admin only)",
)
async def create_price_entry(
    price_in: PriceListCreate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> PriceList:
    """Create a new temporal pricing record for a catalog item."""
    if not await session.get(Item, price_in.item_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ITEM_NOT_FOUND",
        )

    if price_in.effective_to and price_in.effective_to < price_in.effective_from:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="EFFECTIVE_TO_BEFORE_EFFECTIVE_FROM",
        )

    price = PriceList(
        item_id=price_in.item_id,
        cost_price=price_in.cost_price,
        unit_price=price_in.unit_price,
        currency=price_in.currency,
        effective_from=price_in.effective_from,
        effective_to=price_in.effective_to,
        price_change_reason=price_in.price_change_reason,
        is_active=price_in.is_active,
        created_by=admin.id,
        updated_by=admin.id,
    )
    session.add(price)
    await session.commit()
    await session.refresh(price)
    return price


@router.patch(
    "/{id}",
    response_model=PriceListRead,
    summary="Update price list entry (Admin only)",
)
async def update_price_entry(
    id: uuid.UUID,
    price_in: PriceListUpdate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> PriceList:
    """Update temporal price entry attributes."""
    price = await session.get(PriceList, id)
    if not price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PRICE_ENTRY_NOT_FOUND",
        )

    update_data = price_in.model_dump(exclude_unset=True)

    effective_from = update_data.get("effective_from", price.effective_from)
    effective_to = update_data.get("effective_to", price.effective_to)
    if effective_to and effective_to < effective_from:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="EFFECTIVE_TO_BEFORE_EFFECTIVE_FROM",
        )

    for field, value in update_data.items():
        setattr(price, field, value)

    price.updated_by = admin.id
    await session.commit()
    await session.refresh(price)
    return price


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a price list entry (Admin only)",
)
async def delete_price_entry(
    id: uuid.UUID,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> None:
    """Delete a price list record."""
    price = await session.get(PriceList, id)
    if not price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PRICE_ENTRY_NOT_FOUND",
        )
    try:
        await session.delete(price)
        await session.commit()
    except SQLAlchemyError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PRICE_ENTRY_IN_USE_CANNOT_DELETE",
        )
