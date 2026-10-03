import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.entities.brand import Brand
from app.entities.depot import Depot
from app.entities.district import District
from app.entities.outlet import Outlet
from app.entities.user import User
from app.enums.master import DockType, ParkingConstraint
from app.guards import require_system_admin
from app.schemas.outlet import OutletCreate, OutletRead, OutletUpdate

router = APIRouter(prefix="/outlets", tags=["master-outlets"])


@router.get(
    "",
    response_model=list[OutletRead],
    summary="List retail outlets with dock and access constraints",
)
async def list_outlets(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    brand_id: Annotated[uuid.UUID | None, Query(description="Filter by Brand ID")] = None,
    district_id: Annotated[uuid.UUID | None, Query(description="Filter by District ID")] = None,
    depot_id: Annotated[uuid.UUID | None, Query(description="Filter by Depot ID")] = None,
    dock_type: Annotated[DockType | None, Query(description="Filter by Dock Type")] = None,
    parking_constraint: Annotated[ParkingConstraint | None, Query(description="Filter by Parking Constraint")] = None,
    is_active: Annotated[bool | None, Query(description="Filter by active status")] = None,
) -> list[Outlet]:
    """Retrieve all retail outlets with delivery windows, dock types, and parking constraints."""
    query = select(Outlet).order_by(Outlet.outlet_id.asc())
    if brand_id is not None:
        query = query.where(Outlet.brand_id == brand_id)
    if district_id is not None:
        query = query.where(Outlet.district_id == district_id)
    if depot_id is not None:
        query = query.where(Outlet.depot_id == depot_id)
    if dock_type is not None:
        query = query.where(Outlet.dock_type == dock_type)
    if parking_constraint is not None:
        query = query.where(Outlet.parking_constraint == parking_constraint)
    if is_active is not None:
        query = query.where(Outlet.is_active == is_active)

    result = await session.execute(query)
    return list(result.scalars().all())


@router.get(
    "/{identifier}",
    response_model=OutletRead,
    summary="Get outlet details by UUID or Outlet Code (e.g. OUT001)",
)
async def get_outlet(
    identifier: str,
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> Outlet:
    """Retrieve detailed outlet record by UUID primary key or outlet_id code."""
    parsed_uuid = None
    try:
        parsed_uuid = uuid.UUID(identifier)
    except ValueError:
        pass

    if parsed_uuid:
        query = select(Outlet).where(or_(Outlet.id == parsed_uuid, Outlet.outlet_id == identifier.upper()))
    else:
        query = select(Outlet).where(Outlet.outlet_id == identifier.upper())

    result = await session.execute(query)
    outlet = result.scalar_one_or_none()
    if not outlet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OUTLET_NOT_FOUND",
        )
    return outlet


@router.post(
    "",
    response_model=OutletRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new retail outlet (Admin only)",
)
async def create_outlet(
    outlet_in: OutletCreate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> Outlet:
    """Create a new retail outlet record."""
    if not await session.get(Brand, outlet_in.brand_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="BRAND_NOT_FOUND",
        )
    if not await session.get(District, outlet_in.district_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DISTRICT_NOT_FOUND",
        )
    if not await session.get(Depot, outlet_in.depot_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DEPOT_NOT_FOUND",
        )

    existing = await session.execute(select(Outlet).where(Outlet.outlet_id == outlet_in.outlet_id.upper()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OUTLET_ID_ALREADY_EXISTS",
        )

    outlet = Outlet(
        outlet_id=outlet_in.outlet_id.upper(),
        name=outlet_in.name,
        brand_id=outlet_in.brand_id,
        district_id=outlet_in.district_id,
        depot_id=outlet_in.depot_id,
        dock_type=outlet_in.dock_type,
        parking_constraint=outlet_in.parking_constraint,
        mall_window=outlet_in.mall_window,
        window_open_time=outlet_in.window_open_time,
        window_close_time=outlet_in.window_close_time,
        latitude=outlet_in.latitude,
        longitude=outlet_in.longitude,
        contact_phone=outlet_in.contact_phone,
        is_active=outlet_in.is_active,
        created_by=admin.id,
        updated_by=admin.id,
    )
    session.add(outlet)
    await session.commit()
    await session.refresh(outlet)
    return outlet


@router.patch(
    "/{identifier}",
    response_model=OutletRead,
    summary="Update outlet details (Admin only)",
)
async def update_outlet(
    identifier: str,
    outlet_in: OutletUpdate,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> Outlet:
    """Update outlet attributes."""
    parsed_uuid = None
    try:
        parsed_uuid = uuid.UUID(identifier)
    except ValueError:
        pass

    if parsed_uuid:
        query = select(Outlet).where(or_(Outlet.id == parsed_uuid, Outlet.outlet_id == identifier.upper()))
    else:
        query = select(Outlet).where(Outlet.outlet_id == identifier.upper())

    result = await session.execute(query)
    outlet = result.scalar_one_or_none()
    if not outlet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OUTLET_NOT_FOUND",
        )

    update_data = outlet_in.model_dump(exclude_unset=True)

    if update_data.get("brand_id") and not await session.get(Brand, update_data["brand_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="BRAND_NOT_FOUND",
        )
    if update_data.get("district_id") and not await session.get(District, update_data["district_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DISTRICT_NOT_FOUND",
        )
    if update_data.get("depot_id") and not await session.get(Depot, update_data["depot_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DEPOT_NOT_FOUND",
        )

    if update_data.get("outlet_id"):
        update_data["outlet_id"] = update_data["outlet_id"].upper()
        if update_data["outlet_id"] != outlet.outlet_id:
            existing = await session.execute(select(Outlet).where(Outlet.outlet_id == update_data["outlet_id"]))
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="OUTLET_ID_ALREADY_EXISTS",
                )

    for field, value in update_data.items():
        setattr(outlet, field, value)

    outlet.updated_by = admin.id
    await session.commit()
    await session.refresh(outlet)
    return outlet


@router.delete(
    "/{identifier}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a retail outlet (Admin only)",
)
async def delete_outlet(
    identifier: str,
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> None:
    """Delete an outlet record."""
    parsed_uuid = None
    try:
        parsed_uuid = uuid.UUID(identifier)
    except ValueError:
        pass

    if parsed_uuid:
        query = select(Outlet).where(or_(Outlet.id == parsed_uuid, Outlet.outlet_id == identifier.upper()))
    else:
        query = select(Outlet).where(Outlet.outlet_id == identifier.upper())

    result = await session.execute(query)
    outlet = result.scalar_one_or_none()
    if not outlet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OUTLET_NOT_FOUND",
        )
    try:
        await session.delete(outlet)
        await session.commit()
    except SQLAlchemyError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OUTLET_IN_USE_CANNOT_DELETE",
        )
