"""Router: /outlets/windows and /outlets/{id}/windows — delivery window endpoints."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.outlet import OutletModel
from app.schemas.outlet_schemas import (
    Brand,
    EffectiveWindowResponse,
    ParkingConstraint,
    WindowUpdate,
    WindowsByDistrictItem,
)

router = APIRouter(prefix="/outlets", tags=["Outlet Windows"])


def _calculate_effective_window(
    window_open_time: str,
    window_close_time: str,
    parking_constraint: str,
    mall_window: str | None,
) -> tuple[str, str, bool, bool]:
    is_mall = parking_constraint == "mall_dock"
    mall_window_applied = False
    effective_open = window_open_time
    effective_close = window_close_time

    if is_mall and mall_window and "-" in mall_window:
        try:
            parts = mall_window.split("-")
            mall_open = parts[0].strip()
            mall_close = parts[1].strip()
            # Effective open is the later of outlet open and mall open
            effective_open = max(window_open_time, mall_open)
            # Effective close is the earlier of outlet close and mall close
            effective_close = min(window_close_time, mall_close)
            mall_window_applied = True
        except Exception:
            pass

    return effective_open, effective_close, is_mall, mall_window_applied


@router.get(
    "/{outlet_id}/windows/effective",
    response_model=EffectiveWindowResponse,
    summary="Get effective delivery window",
    description=(
        "Returns the computed effective_open_time and effective_close_time. "
        "For mall outlets, the mall window intersection is applied. "
        "Mirrors Outlet.effective_open_time() / effective_close_time(). Role: DISPATCHER+"
    ),
)
async def get_effective_window(
    outlet_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    outlet = await db.get(OutletModel, outlet_id)
    if not outlet or not outlet.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outlet '{outlet_id}' not found.",
        )

    eff_open, eff_close, is_mall, applied = _calculate_effective_window(
        outlet.window_open_time,
        outlet.window_close_time,
        outlet.parking_constraint,
        outlet.mall_window,
    )

    return EffectiveWindowResponse(
        outlet_id=outlet.ID,
        effective_open_time=eff_open,
        effective_close_time=eff_close,
        is_mall=is_mall,
        mall_window_applied=applied,
    )


@router.patch(
    "/{outlet_id}/windows",
    response_model=EffectiveWindowResponse,
    summary="Update outlet delivery window",
    description="Updates window_open_time, window_close_time, mall_window. Role: DEPOT_MANAGER+",
)
async def update_outlet_window(
    outlet_id: str = Path(...),
    payload: WindowUpdate = ...,
    db: AsyncSession = Depends(get_db),
):
    outlet = await db.get(OutletModel, outlet_id)
    if not outlet or not outlet.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outlet '{outlet_id}' not found.",
        )

    outlet.window_open_time = payload.window_open_time
    outlet.window_close_time = payload.window_close_time
    if payload.mall_window is not None:
        outlet.mall_window = payload.mall_window

    outlet.UpdateTime = datetime.utcnow()
    outlet.UpdatedBy = "DEPOT_MANAGER"

    await db.flush()
    await db.refresh(outlet)

    eff_open, eff_close, is_mall, applied = _calculate_effective_window(
        outlet.window_open_time,
        outlet.window_close_time,
        outlet.parking_constraint,
        outlet.mall_window,
    )

    return EffectiveWindowResponse(
        outlet_id=outlet.ID,
        effective_open_time=eff_open,
        effective_close_time=eff_close,
        is_mall=is_mall,
        mall_window_applied=applied,
    )


@router.get(
    "/windows/by-district",
    response_model=list[WindowsByDistrictItem],
    summary="All outlet window times grouped by district",
    description="Returns effective windows for all outlets, grouped by district. Role: DISPATCHER+",
)
async def get_windows_by_district(
    depot: str | None = Query(default=None),
    district: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = select(OutletModel).where(OutletModel.IsActive.is_(True))
    if depot:
        query = query.where(OutletModel.depot == depot)
    if district:
        query = query.where(OutletModel.district == district)

    rows = list((await db.execute(query.order_by(OutletModel.district, OutletModel.ID))).scalars().all())

    items = []
    for o in rows:
        eff_open, eff_close, _, _ = _calculate_effective_window(
            o.window_open_time,
            o.window_close_time,
            o.parking_constraint,
            o.mall_window,
        )
        items.append(
            WindowsByDistrictItem(
                district=o.district,
                outlet_id=o.ID,
                brand=Brand(o.brand),
                effective_open=eff_open,
                effective_close=eff_close,
                parking_constraint=ParkingConstraint(o.parking_constraint),
            )
        )

    return items
