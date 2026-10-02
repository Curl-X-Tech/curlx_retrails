import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.entities.brand import Brand
from app.entities.depot import Depot
from app.entities.district import District
from app.entities.user import User
from app.guards import require_system_admin
from app.schemas.brand import BrandCreate, BrandRead
from app.schemas.depot import DepotCreate, DepotRead
from app.schemas.district import DistrictCreate, DistrictRead

master_router = APIRouter(prefix="/master", tags=["master"])


# ============================================================
# Depot Master Endpoints
# ============================================================


@master_router.get(
    "/depots",
    response_model=list[DepotRead],
    summary="List distribution centers and regional hubs",
)
async def list_depots(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    is_active: Annotated[
        bool | None, Query(description="Filter by active status")
    ] = None,
) -> list[Depot]:
    """Retrieve all distribution centers (e.g., Peliyagoda Central DC, Kandy Regional Hub)."""
    query = select(Depot).order_by(Depot.code.asc())
    if is_active is not None:
        query = query.where(Depot.is_active == is_active)
    result = await session.execute(query)
    return list(result.scalars().all())


@master_router.get(
    "/depots/{id}",
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


@master_router.post(
    "/depots",
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
    existing = await session.execute(
        select(Depot).where(Depot.code == depot_in.code.upper())
    )
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


# ============================================================
# District Master Endpoints
# ============================================================


@master_router.get(
    "/districts",
    response_model=list[DistrictRead],
    summary="List administrative districts and service boundaries",
)
async def list_districts(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    province: Annotated[
        str | None, Query(description="Filter by province (e.g. Western, Central)")
    ] = None,
    depot_id: Annotated[
        uuid.UUID | None, Query(description="Filter by assigned depot ID")
    ] = None,
) -> list[District]:
    """Retrieve all districts served across Western and Central Provinces."""
    query = select(District).order_by(District.province.asc(), District.name.asc())
    if province is not None:
        query = query.where(District.province == province)
    if depot_id is not None:
        query = query.where(District.assigned_depot_id == depot_id)
    result = await session.execute(query)
    return list(result.scalars().all())


@master_router.get(
    "/districts/{id}",
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


@master_router.post(
    "/districts",
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

    existing = await session.execute(
        select(District).where(District.name == district_in.name)
    )
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


# ============================================================
# Brand Master Endpoints
# ============================================================


@master_router.get(
    "/brands",
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


@master_router.get(
    "/brands/{id}",
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


@master_router.post(
    "/brands",
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
