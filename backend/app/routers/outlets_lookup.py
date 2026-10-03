"""Router: /outlets/lookup — filtered lookup endpoints for the planning engine."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.outlet import OutletModel
from app.schemas.outlet_schemas import OutletListResponse, Depot

router = APIRouter(prefix="/outlets/lookup", tags=["Outlet Lookup"])


@router.get(
    "/by-depot",
    response_model=OutletListResponse,
    summary="All outlets for a depot",
    description="Returns all active outlets belonging to the given depot. Role: DISPATCHER+",
)
async def outlets_by_depot(
    depot: Depot = Query(...),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=200, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(OutletModel).where(OutletModel.depot == depot.value, OutletModel.IsActive.is_(True))

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    items = list((await db.execute(query.order_by(OutletModel.ID).offset(offset).limit(limit))).scalars().all())

    return OutletListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/by-district",
    response_model=OutletListResponse,
    summary="All outlets in a district",
    description="Returns all active outlets in the given district. Role: DISPATCHER+",
)
async def outlets_by_district(
    district: str = Query(...),
    depot: Depot | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=200, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(OutletModel).where(OutletModel.district == district, OutletModel.IsActive.is_(True))
    if depot:
        query = query.where(OutletModel.depot == depot.value)

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    items = list((await db.execute(query.order_by(OutletModel.ID).offset(offset).limit(limit))).scalars().all())

    return OutletListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/van-only",
    response_model=OutletListResponse,
    summary="Outlets requiring van",
    description="Returns outlets with parking_constraint=van_only. Role: DISPATCHER+",
)
async def outlets_van_only(
    depot: Depot | None = Query(default=None),
    district: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=200, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(OutletModel).where(OutletModel.parking_constraint == "van_only", OutletModel.IsActive.is_(True))
    if depot:
        query = query.where(OutletModel.depot == depot.value)
    if district:
        query = query.where(OutletModel.district == district)

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    items = list((await db.execute(query.order_by(OutletModel.ID).offset(offset).limit(limit))).scalars().all())

    return OutletListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/malls",
    response_model=OutletListResponse,
    summary="Mall outlets",
    description="Returns outlets with parking_constraint=mall_dock. Role: DISPATCHER+",
)
async def outlets_malls(
    depot: Depot | None = Query(default=None),
    district: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=200, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(OutletModel).where(OutletModel.parking_constraint == "mall_dock", OutletModel.IsActive.is_(True))
    if depot:
        query = query.where(OutletModel.depot == depot.value)
    if district:
        query = query.where(OutletModel.district == district)

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    items = list((await db.execute(query.order_by(OutletModel.ID).offset(offset).limit(limit))).scalars().all())

    return OutletListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )
