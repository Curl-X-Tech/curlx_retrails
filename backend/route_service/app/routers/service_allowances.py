"""Router: /service-allowances — CRUD and lookup for ServiceAllowance entities."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.service_allowance import ServiceAllowanceModel
from app.schemas.route_schemas import (
    ServiceAllowanceCreate,
    ServiceAllowanceUpdate,
    ServiceAllowanceResponse,
    ServiceAllowanceListResponse,
    ServiceAllowanceLookupResponse,
    Brand,
    DockType,
)

router = APIRouter(prefix="/service-allowances", tags=["Service Allowances"])


@router.post(
    "",
    response_model=ServiceAllowanceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a service allowance record",
    description=(
        "Creates a (brand, dock_type) → service_allowance_min mapping. "
        "Role: SUPERADMIN"
    ),
)
async def create_service_allowance(
    payload: ServiceAllowanceCreate,
    db:      AsyncSession = Depends(get_db),
):
    allowance_id = f"SA_{payload.brand.value}_{payload.dock_type.value}"
    existing = await db.get(ServiceAllowanceModel, allowance_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Service allowance for brand '{payload.brand.value}' and dock '{payload.dock_type.value}' already exists.",
        )

    allowance = ServiceAllowanceModel(
        ID=allowance_id,
        CreateTime=datetime.utcnow(),
        UpdateTime=datetime.utcnow(),
        CreatedBy="SUPERADMIN",
        UpdatedBy="SUPERADMIN",
        IsActive=True,
        brand=payload.brand.value,
        dock_type=payload.dock_type.value,
        service_allowance_min=payload.service_allowance_min,
    )
    db.add(allowance)
    await db.flush()
    await db.refresh(allowance)
    return allowance


@router.get(
    "",
    response_model=ServiceAllowanceListResponse,
    summary="List all service allowances",
    description="Returns all active service allowance records. Role: DISPATCHER+",
)
async def list_service_allowances(
    brand:     Brand    | None = Query(default=None),
    dock_type: DockType | None = Query(default=None),
    page:      int             = Query(default=1, ge=1),
    limit:     int             = Query(default=50, ge=1, le=500),
    db:        AsyncSession    = Depends(get_db),
):
    query = select(ServiceAllowanceModel).where(ServiceAllowanceModel.IsActive.is_(True))
    if brand:
        query = query.where(ServiceAllowanceModel.brand == brand.value)
    if dock_type:
        query = query.where(ServiceAllowanceModel.dock_type == dock_type.value)

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    items = list((await db.execute(query.order_by(ServiceAllowanceModel.brand).offset(offset).limit(limit))).scalars().all())

    return ServiceAllowanceListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/lookup",
    response_model=ServiceAllowanceLookupResponse,
    summary="Look up handling time by brand and dock_type",
    description=(
        "Mirrors ServiceAllowance.get_service_allowance(brand, dock_type, ...). "
        "Primary endpoint used by Planning Engine at plan-generation time."
    ),
)
async def lookup_service_allowance(
    brand:     Brand        = Query(...),
    dock_type: DockType     = Query(...),
    db:        AsyncSession = Depends(get_db),
):
    stmt = (
        select(ServiceAllowanceModel)
        .where(
            ServiceAllowanceModel.brand == brand.value,
            ServiceAllowanceModel.dock_type == dock_type.value,
            ServiceAllowanceModel.IsActive.is_(True),
        )
    )
    record = (await db.execute(stmt)).scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service allowance for brand '{brand.value}' and dock_type '{dock_type.value}' not found.",
        )

    return ServiceAllowanceLookupResponse(
        brand=Brand(record.brand),
        dock_type=DockType(record.dock_type),
        service_allowance_min=record.service_allowance_min,
    )


@router.get(
    "/{allowance_id}",
    response_model=ServiceAllowanceResponse,
    summary="Get service allowance by ID",
)
async def get_service_allowance(
    allowance_id: str = Path(...),
    db:           AsyncSession = Depends(get_db),
):
    record = await db.get(ServiceAllowanceModel, allowance_id)
    if not record or not record.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service allowance '{allowance_id}' not found.",
        )
    return record


@router.patch(
    "/{allowance_id}",
    response_model=ServiceAllowanceResponse,
    summary="Update service_allowance_min",
    description="Only service_allowance_min is mutable. Role: DEPOT_MANAGER+",
)
async def update_service_allowance(
    allowance_id: str = Path(...),
    payload:      ServiceAllowanceUpdate = ...,
    db:           AsyncSession = Depends(get_db),
):
    record = await db.get(ServiceAllowanceModel, allowance_id)
    if not record or not record.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service allowance '{allowance_id}' not found.",
        )

    record.service_allowance_min = payload.service_allowance_min
    record.UpdateTime = datetime.utcnow()
    record.UpdatedBy = "DEPOT_MANAGER"

    await db.flush()
    await db.refresh(record)
    return record


@router.delete(
    "/{allowance_id}",
    status_code=status.HTTP_200_OK,
    summary="Soft-delete a service allowance",
    description="Role: SUPERADMIN",
)
async def delete_service_allowance(
    allowance_id: str = Path(...),
    db:           AsyncSession = Depends(get_db),
):
    record = await db.get(ServiceAllowanceModel, allowance_id)
    if not record or not record.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service allowance '{allowance_id}' not found.",
        )

    record.IsActive = False
    record.UpdateTime = datetime.utcnow()
    record.UpdatedBy = "SUPERADMIN"
    await db.flush()

    return {"id": allowance_id, "deleted": True, "message": f"Service allowance '{allowance_id}' soft-deleted."}
