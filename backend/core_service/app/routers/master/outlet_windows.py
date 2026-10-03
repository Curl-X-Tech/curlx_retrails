import uuid
from datetime import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.entities.brand import Brand
from app.entities.district import District
from app.entities.outlet import Outlet
from app.enums.master import ParkingConstraint
from app.schemas.outlet_window import EffectiveWindowRead, OutletWindowByDistrictRead

router = APIRouter(prefix="/outlets", tags=["master-outlets"])


def effective_window(outlet: Outlet) -> tuple[time, time, bool]:
    """Intersect the outlet window with its mall window (HH:MM-HH:MM) for mall dock outlets."""
    if outlet.parking_constraint != ParkingConstraint.MALL_DOCK or not outlet.mall_window:
        return outlet.window_open_time, outlet.window_close_time, False
    try:
        mall_open, mall_close = (time.fromisoformat(part.strip()) for part in outlet.mall_window.split("-"))
    except ValueError:
        return outlet.window_open_time, outlet.window_close_time, False
    return max(outlet.window_open_time, mall_open), min(outlet.window_close_time, mall_close), True


@router.get(
    "/windows/by-district",
    response_model=list[OutletWindowByDistrictRead],
    summary="Effective delivery windows of active outlets grouped by district",
)
async def list_windows_by_district(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    depot_id: Annotated[uuid.UUID | None, Query(description="Filter by Depot ID")] = None,
    district_id: Annotated[uuid.UUID | None, Query(description="Filter by District ID")] = None,
) -> list[OutletWindowByDistrictRead]:
    query = (
        select(Outlet, District.name, Brand.code)
        .join(District, Outlet.district_id == District.id)
        .join(Brand, Outlet.brand_id == Brand.id)
        .where(Outlet.is_active.is_(True))
        .order_by(District.name.asc(), Outlet.outlet_id.asc())
    )
    if depot_id is not None:
        query = query.where(Outlet.depot_id == depot_id)
    if district_id is not None:
        query = query.where(Outlet.district_id == district_id)

    items = []
    for outlet, district_name, brand_code in (await session.execute(query)).all():
        open_time, close_time, _ = effective_window(outlet)
        items.append(
            OutletWindowByDistrictRead(
                outlet_id=outlet.outlet_id,
                district_id=outlet.district_id,
                district=district_name,
                brand_code=brand_code,
                effective_open_time=open_time,
                effective_close_time=close_time,
                parking_constraint=outlet.parking_constraint,
            )
        )
    return items


@router.get(
    "/{identifier}/windows/effective",
    response_model=EffectiveWindowRead,
    summary="Get effective delivery window by UUID or Outlet Code",
)
async def get_effective_window(
    identifier: str,
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> EffectiveWindowRead:
    try:
        criterion = or_(Outlet.id == uuid.UUID(identifier), Outlet.outlet_id == identifier.upper())
    except ValueError:
        criterion = Outlet.outlet_id == identifier.upper()

    outlet = (await session.execute(select(Outlet).where(criterion))).scalar_one_or_none()
    if not outlet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OUTLET_NOT_FOUND")

    open_time, close_time, mall_applied = effective_window(outlet)
    return EffectiveWindowRead(
        outlet_id=outlet.outlet_id,
        effective_open_time=open_time,
        effective_close_time=close_time,
        is_mall=outlet.parking_constraint == ParkingConstraint.MALL_DOCK,
        mall_window_applied=mall_applied,
    )
