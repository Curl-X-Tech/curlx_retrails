"""Router: /outlets — CRUD for Outlet entities."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.outlet import OutletModel
from app.schemas.outlet_schemas import (
    OutletCreate,
    OutletUpdate,
    OutletResponse,
    OutletListResponse,
    Brand,
    ParkingConstraint,
    Depot,
)

router = APIRouter(prefix="/outlets", tags=["Outlets"])


@router.post(
    "",
    response_model=OutletResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an outlet",
    description="Registers a new outlet. Role: SUPERADMIN",
)
async def create_outlet(
    payload: OutletCreate,
    db: AsyncSession = Depends(get_db),
):
    # Check if outlet already exists
    existing = await db.get(OutletModel, payload.ID)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Outlet with ID '{payload.ID}' already exists.",
        )

    outlet = OutletModel(
        ID=payload.ID,
        CreateTime=datetime.utcnow(),
        UpdateTime=datetime.utcnow(),
        CreatedBy="SUPERADMIN",
        UpdatedBy="SUPERADMIN",
        IsActive=True,
        brand=payload.brand.value,
        district=payload.district,
        depot=payload.depot.value,
        dock_type=payload.dock_type.value,
        parking_constraint=payload.parking_constraint.value,
        mall_window=payload.mall_window,
        window_open_time=payload.window_open_time,
        window_close_time=payload.window_close_time,
    )
    db.add(outlet)
    await db.flush()
    await db.refresh(outlet)
    return outlet


@router.get(
    "",
    response_model=OutletListResponse,
    summary="List all outlets",
    description="Returns paginated outlets with optional filters. Role: DISPATCHER+",
)
async def list_outlets(
    depot: Depot | None = Query(default=None),
    district: str | None = Query(default=None),
    brand: Brand | None = Query(default=None),
    parking_constraint: ParkingConstraint | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(OutletModel).where(OutletModel.IsActive.is_(True))

    if depot:
        query = query.where(OutletModel.depot == depot.value)
    if district:
        query = query.where(OutletModel.district == district)
    if brand:
        query = query.where(OutletModel.brand == brand.value)
    if parking_constraint:
        query = query.where(OutletModel.parking_constraint == parking_constraint.value)

    # Count total
    count_stmt = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Pagination
    offset = (page - 1) * limit
    paged_query = query.order_by(OutletModel.ID).offset(offset).limit(limit)
    rows_result = await db.execute(paged_query)
    items = list(rows_result.scalars().all())

    return OutletListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/{outlet_id}",
    response_model=OutletResponse,
    summary="Get a single outlet by ID",
)
async def get_outlet(
    outlet_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    outlet = await db.get(OutletModel, outlet_id)
    if not outlet or not outlet.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outlet '{outlet_id}' not found.",
        )
    return outlet


@router.patch(
    "/{outlet_id}",
    response_model=OutletResponse,
    summary="Update outlet window times",
    description="Mutable: window_open_time, window_close_time, mall_window. Role: DEPOT_MANAGER+",
)
async def update_outlet(
    outlet_id: str = Path(...),
    payload: OutletUpdate = ...,
    db: AsyncSession = Depends(get_db),
):
    outlet = await db.get(OutletModel, outlet_id)
    if not outlet or not outlet.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outlet '{outlet_id}' not found.",
        )

    if payload.window_open_time is not None:
        outlet.window_open_time = payload.window_open_time
    if payload.window_close_time is not None:
        outlet.window_close_time = payload.window_close_time
    if payload.mall_window is not None:
        outlet.mall_window = payload.mall_window

    outlet.UpdateTime = datetime.utcnow()
    outlet.UpdatedBy = "DEPOT_MANAGER"

    await db.flush()
    await db.refresh(outlet)
    return outlet


@router.delete(
    "/{outlet_id}",
    status_code=status.HTTP_200_OK,
    summary="Soft-delete an outlet",
    description="Sets IsActive=false. Role: SUPERADMIN",
)
async def delete_outlet(
    outlet_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    outlet = await db.get(OutletModel, outlet_id)
    if not outlet or not outlet.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outlet '{outlet_id}' not found.",
        )

    outlet.IsActive = False
    outlet.UpdateTime = datetime.utcnow()
    outlet.UpdatedBy = "SUPERADMIN"
    await db.flush()

    return {"id": outlet_id, "deleted": True, "message": f"Outlet '{outlet_id}' soft-deleted."}
