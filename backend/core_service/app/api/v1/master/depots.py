import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.entities.depot import Depot
from app.entities.user import User
from app.guards import require_system_admin
from app.schemas.depot import DepotCreate, DepotRead, DepotUpdate

router = APIRouter(prefix="/depots", tags=["master-depots"])


@router.get(
    "",
    response_model=list[DepotRead],
    summary="List distribution centers and regional hubs",
)
async def list_depots(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    is_active: Annotated[bool | None, Query(description="Filter by active status")] = None,
) -> list[Depot]:
    """Retrieve all distribution centers (e.g., Peliyagoda Central DC, Kandy Regional Hub)."""
    query = select(Depot).order_by(Depot.code.asc())
    if is_active is not None:
        query = query.where(Depot.is_active == is_active)
    result = await session.execute(query)
    return list(result.scalars().all())


@router.get(
    "/{id}",
    response_model=DepotRead,
    summary="Get depot details by ID",
)
async def get_depot(
    id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> Depot:
    """Retrieve detailed depot record with coordinates and service metadata."""
    depot = await session.get(Depot, id)
    if not depot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="DEPOT_NOT_FOUND",
        )
    return depot


@router.post(
    "",
    response_model=DepotRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new distribution center (Admin only)",
)
async def create_depot(
    depot_in: DepotCreate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> Depot:
    """Create a new depot record."""
    existing = await session.execute(select(Depot).where(Depot.code == depot_in.code.upper()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DEPOT_CODE_ALREADY_EXISTS",
        )

    depot = Depot(
        code=depot_in.code.upper(),
        name=depot_in.name,
        latitude=depot_in.latitude,
        longitude=depot_in.longitude,
        address=depot_in.address,
        is_active=depot_in.is_active,
        created_by=admin.id,
        updated_by=admin.id,
    )
    session.add(depot)
    await session.commit()
    await session.refresh(depot)
    return depot


@router.patch(
    "/{id}",
    response_model=DepotRead,
    summary="Update distribution center details (Admin only)",
)
async def update_depot(
    id: uuid.UUID,
    depot_in: DepotUpdate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> Depot:
    """Update depot attributes."""
    depot = await session.get(Depot, id)
    if not depot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="DEPOT_NOT_FOUND",
        )

    update_data = depot_in.model_dump(exclude_unset=True)
    if update_data.get("code"):
        update_data["code"] = update_data["code"].upper()
        if update_data["code"] != depot.code:
            existing = await session.execute(select(Depot).where(Depot.code == update_data["code"]))
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="DEPOT_CODE_ALREADY_EXISTS",
                )

    for field, value in update_data.items():
        setattr(depot, field, value)

    depot.updated_by = admin.id
    await session.commit()
    await session.refresh(depot)
    return depot


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a distribution center (Admin only)",
)
async def delete_depot(
    id: uuid.UUID,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> None:
    """Delete a depot record."""
    depot = await session.get(Depot, id)
    if not depot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="DEPOT_NOT_FOUND",
        )
    try:
        await session.delete(depot)
        await session.commit()
    except SQLAlchemyError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DEPOT_IN_USE_CANNOT_DELETE",
        )
