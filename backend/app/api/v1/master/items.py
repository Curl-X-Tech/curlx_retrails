import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.entities.brand import Brand
from app.entities.item import Item
from app.entities.user import User
from app.guards import require_system_admin
from app.schemas.item import ItemCreate, ItemRead, ItemUpdate

router = APIRouter(prefix="/items", tags=["master-items"])


@router.get(
    "",
    response_model=list[ItemRead],
    summary="List product catalog items and SKUs",
)
async def list_items(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    brand_id: Annotated[
        uuid.UUID | None, Query(description="Filter by Brand ID")
    ] = None,
    category: Annotated[
        str | None, Query(description="Filter by Product Category")
    ] = None,
    requires_cold_chain: Annotated[
        bool | None, Query(description="Filter by Cold Chain requirement")
    ] = None,
    special_handling_code: Annotated[
        str | None,
        Query(description="Filter by Special Handling Code (COL, FRG, MAL, HAZ)"),
    ] = None,
) -> list[Item]:
    """Retrieve catalog product items with weight, volume, and handling specifications."""
    query = select(Item).order_by(Item.sku.asc())
    if brand_id is not None:
        query = query.where(Item.brand_id == brand_id)
    if category is not None:
        query = query.where(Item.category == category)
    if requires_cold_chain is not None:
        query = query.where(Item.requires_cold_chain == requires_cold_chain)
    if special_handling_code is not None:
        query = query.where(Item.special_handling_code == special_handling_code)

    result = await session.execute(query)
    return list(result.scalars().all())


@router.get(
    "/{identifier}",
    response_model=ItemRead,
    summary="Get item details by UUID or SKU code",
)
async def get_item(
    identifier: str,
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> Item:
    """Retrieve detailed item record by UUID primary key or SKU string."""
    parsed_uuid = None
    try:
        parsed_uuid = uuid.UUID(identifier)
    except ValueError:
        pass

    if parsed_uuid:
        query = select(Item).where(
            or_(Item.id == parsed_uuid, Item.sku == identifier.upper())
        )
    else:
        query = select(Item).where(Item.sku == identifier.upper())

    result = await session.execute(query)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ITEM_NOT_FOUND",
        )
    return item


@router.post(
    "",
    response_model=ItemRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new catalog item (Admin only)",
)
async def create_item(
    item_in: ItemCreate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> Item:
    """Create a new catalog item record."""
    if not await session.get(Brand, item_in.brand_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="BRAND_NOT_FOUND",
        )

    existing = await session.execute(
        select(Item).where(Item.sku == item_in.sku.upper())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ITEM_SKU_ALREADY_EXISTS",
        )

    item = Item(
        sku=item_in.sku.upper(),
        brand_id=item_in.brand_id,
        name=item_in.name,
        category=item_in.category,
        unit=item_in.unit,
        unit_weight_kg=item_in.unit_weight_kg,
        unit_volume_m3=item_in.unit_volume_m3,
        requires_cold_chain=item_in.requires_cold_chain,
        special_handling_code=item_in.special_handling_code,
        created_by=admin.id,
        updated_by=admin.id,
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item


@router.patch(
    "/{identifier}",
    response_model=ItemRead,
    summary="Update catalog item details (Admin only)",
)
async def update_item(
    identifier: str,
    item_in: ItemUpdate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> Item:
    """Update item attributes."""
    parsed_uuid = None
    try:
        parsed_uuid = uuid.UUID(identifier)
    except ValueError:
        pass

    if parsed_uuid:
        query = select(Item).where(
            or_(Item.id == parsed_uuid, Item.sku == identifier.upper())
        )
    else:
        query = select(Item).where(Item.sku == identifier.upper())

    result = await session.execute(query)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ITEM_NOT_FOUND",
        )

    update_data = item_in.model_dump(exclude_unset=True)

    if update_data.get("brand_id") and not await session.get(
        Brand, update_data["brand_id"]
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="BRAND_NOT_FOUND",
        )

    if update_data.get("sku"):
        update_data["sku"] = update_data["sku"].upper()
        if update_data["sku"] != item.sku:
            existing = await session.execute(
                select(Item).where(Item.sku == update_data["sku"])
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="ITEM_SKU_ALREADY_EXISTS",
                )

    for field, value in update_data.items():
        setattr(item, field, value)

    item.updated_by = admin.id
    await session.commit()
    await session.refresh(item)
    return item


@router.delete(
    "/{identifier}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a catalog item (Admin only)",
)
async def delete_item(
    identifier: str,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> None:
    """Delete an item record."""
    parsed_uuid = None
    try:
        parsed_uuid = uuid.UUID(identifier)
    except ValueError:
        pass

    if parsed_uuid:
        query = select(Item).where(
            or_(Item.id == parsed_uuid, Item.sku == identifier.upper())
        )
    else:
        query = select(Item).where(Item.sku == identifier.upper())

    result = await session.execute(query)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ITEM_NOT_FOUND",
        )
    try:
        await session.delete(item)
        await session.commit()
    except SQLAlchemyError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ITEM_IN_USE_CANNOT_DELETE",
        )
