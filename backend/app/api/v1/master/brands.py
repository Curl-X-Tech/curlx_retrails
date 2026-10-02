import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.entities.brand import Brand
from app.entities.user import User
from app.guards import require_system_admin
from app.schemas.brand import BrandCreate, BrandRead, BrandUpdate

router = APIRouter(prefix="/brands", tags=["master-brands"])


@router.get(
    "",
    response_model=list[BrandRead],
    summary="List retail brand specifications",
)
async def list_brands(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    requires_cold_chain: Annotated[
        bool | None, Query(description="Filter by cold chain requirement")
    ] = None,
) -> list[Brand]:
    """Retrieve brand specifications (Waypoint Fresh, Waypoint Style, Waypoint Tech)."""
    query = select(Brand).order_by(Brand.code.asc())
    if requires_cold_chain is not None:
        query = query.where(Brand.requires_cold_chain == requires_cold_chain)
    result = await session.execute(query)
    return list(result.scalars().all())


@router.get(
    "/{id}",
    response_model=BrandRead,
    summary="Get brand details by ID",
)
async def get_brand(
    id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> Brand:
    """Retrieve detailed brand record with time budget and cold chain constraints."""
    brand = await session.get(Brand, id)
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BRAND_NOT_FOUND",
        )
    return brand


@router.post(
    "",
    response_model=BrandRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new brand specification (Admin only)",
)
async def create_brand(
    brand_in: BrandCreate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> Brand:
    """Create a new retail brand record."""
    existing = await session.execute(
        select(Brand).where(Brand.code == brand_in.code.upper())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="BRAND_CODE_ALREADY_EXISTS",
        )

    brand = Brand(
        code=brand_in.code.upper(),
        name=brand_in.name,
        delivery_window_type=brand_in.delivery_window_type,
        requires_cold_chain=brand_in.requires_cold_chain,
        daily_time_budget_min=brand_in.daily_time_budget_min,
        created_by=admin.id,
        updated_by=admin.id,
    )
    session.add(brand)
    await session.commit()
    await session.refresh(brand)
    return brand


@router.patch(
    "/{id}",
    response_model=BrandRead,
    summary="Update brand specification (Admin only)",
)
async def update_brand(
    id: uuid.UUID,
    brand_in: BrandUpdate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> Brand:
    """Update brand attributes."""
    brand = await session.get(Brand, id)
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BRAND_NOT_FOUND",
        )

    update_data = brand_in.model_dump(exclude_unset=True)
    if update_data.get("code"):
        update_data["code"] = update_data["code"].upper()
        if update_data["code"] != brand.code:
            existing = await session.execute(
                select(Brand).where(Brand.code == update_data["code"])
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="BRAND_CODE_ALREADY_EXISTS",
                )

    for field, value in update_data.items():
        setattr(brand, field, value)

    brand.updated_by = admin.id
    await session.commit()
    await session.refresh(brand)
    return brand


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a brand specification (Admin only)",
)
async def delete_brand(
    id: uuid.UUID,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> None:
    """Delete a brand record."""
    brand = await session.get(Brand, id)
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BRAND_NOT_FOUND",
        )
    try:
        await session.delete(brand)
        await session.commit()
    except SQLAlchemyError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="BRAND_IN_USE_CANNOT_DELETE",
        )
