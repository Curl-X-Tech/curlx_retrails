import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.entities.depot import Depot
from app.entities.district import District
from app.entities.user import User
from app.guards import require_system_admin
from app.schemas.district import DistrictCreate, DistrictRead, DistrictUpdate

router = APIRouter(prefix="/districts", tags=["master-districts"])


@router.get(
    "",
    response_model=list[DistrictRead],
    summary="List administrative districts and service boundaries",
)
async def list_districts(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    province: Annotated[str | None, Query(description="Filter by province (e.g. Western, Central)")] = None,
    depot_id: Annotated[uuid.UUID | None, Query(description="Filter by assigned depot ID")] = None,
) -> list[District]:
    """Retrieve all districts served across Western and Central Provinces."""
    query = select(District).order_by(District.province.asc(), District.name.asc())
    if province is not None:
        query = query.where(District.province == province)
    if depot_id is not None:
        query = query.where(District.assigned_depot_id == depot_id)
    result = await session.execute(query)
    return list(result.scalars().all())


@router.get(
    "/{id}",
    response_model=DistrictRead,
    summary="Get district details by ID",
)
async def get_district(
    id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> District:
    """Retrieve detailed district record with assigned depot relationship."""
    district = await session.get(District, id)
    if not district:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="DISTRICT_NOT_FOUND",
        )
    return district


@router.post(
    "",
    response_model=DistrictRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new district (Admin only)",
)
async def create_district(
    district_in: DistrictCreate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> District:
    """Create a new district record."""
    depot = await session.get(Depot, district_in.assigned_depot_id)
    if not depot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ASSIGNED_DEPOT_NOT_FOUND",
        )

    existing = await session.execute(select(District).where(District.name == district_in.name))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DISTRICT_NAME_ALREADY_EXISTS",
        )

    district = District(
        name=district_in.name,
        province=district_in.province,
        assigned_depot_id=district_in.assigned_depot_id,
        created_by=admin.id,
        updated_by=admin.id,
    )
    session.add(district)
    await session.commit()
    await session.refresh(district)
    return district


@router.patch(
    "/{id}",
    response_model=DistrictRead,
    summary="Update district details (Admin only)",
)
async def update_district(
    id: uuid.UUID,
    district_in: DistrictUpdate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> District:
    """Update district attributes."""
    district = await session.get(District, id)
    if not district:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="DISTRICT_NOT_FOUND",
        )

    update_data = district_in.model_dump(exclude_unset=True)
    if update_data.get("assigned_depot_id"):
        depot = await session.get(Depot, update_data["assigned_depot_id"])
        if not depot:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ASSIGNED_DEPOT_NOT_FOUND",
            )

    if "name" in update_data and update_data["name"] and update_data["name"] != district.name:
        existing = await session.execute(select(District).where(District.name == update_data["name"]))
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="DISTRICT_NAME_ALREADY_EXISTS",
            )

    for field, value in update_data.items():
        setattr(district, field, value)

    district.updated_by = admin.id
    await session.commit()
    await session.refresh(district)
    return district


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a district (Admin only)",
)
async def delete_district(
    id: uuid.UUID,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> None:
    """Delete a district record."""
    district = await session.get(District, id)
    if not district:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="DISTRICT_NOT_FOUND",
        )
    try:
        await session.delete(district)
        await session.commit()
    except SQLAlchemyError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DISTRICT_IN_USE_CANNOT_DELETE",
        )
