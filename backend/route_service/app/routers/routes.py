"""Router: /routes — CRUD for Route entities."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.route import RouteModel
from app.schemas.route_schemas import (
    RouteCreate,
    RouteUpdate,
    RouteResponse,
    RouteListResponse,
    TripDurationRequest,
    TripDurationResponse,
    RoundTripKmResponse,
)

router = APIRouter(prefix="/routes", tags=["Routes"])


@router.post(
    "",
    response_model=RouteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a depot-to-district route",
    description="Registers road geometry for a depot–district pair. Role: SUPERADMIN",
)
async def create_route(
    payload: RouteCreate,
    db: AsyncSession = Depends(get_db),
):
    route_id = f"{payload.depot}_{payload.district}"
    existing = await db.get(RouteModel, route_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Route for '{payload.depot}' to '{payload.district}' already exists (ID: {route_id}).",
        )

    route = RouteModel(
        ID=route_id,
        CreateTime=datetime.utcnow(),
        UpdateTime=datetime.utcnow(),
        CreatedBy="SUPERADMIN",
        UpdatedBy="SUPERADMIN",
        IsActive=True,
        district=payload.district,
        depot=payload.depot,
        road_class=payload.road_class.value,
        free_flow_kmh=payload.free_flow_kmh,
        depot_to_district_km=payload.depot_to_district_km,
        depot_to_district_freeflow_min=payload.depot_to_district_freeflow_min,
        inter_stop_km=payload.inter_stop_km,
        inter_stop_freeflow_min=payload.inter_stop_freeflow_min,
    )
    db.add(route)
    await db.flush()
    await db.refresh(route)
    return route


@router.get(
    "",
    response_model=RouteListResponse,
    summary="List all routes",
    description="Returns all active routes. Role: DISPATCHER+",
)
async def list_routes(
    depot:    str | None = Query(default=None),
    district: str | None = Query(default=None),
    page:     int        = Query(default=1, ge=1),
    limit:    int        = Query(default=100, ge=1, le=500),
    db:       AsyncSession = Depends(get_db),
):
    query = select(RouteModel).where(RouteModel.IsActive.is_(True))
    if depot:
        query = query.where(RouteModel.depot == depot)
    if district:
        query = query.where(RouteModel.district == district)

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    items = list((await db.execute(query.order_by(RouteModel.ID).offset(offset).limit(limit))).scalars().all())

    return RouteListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/lookup",
    response_model=RouteResponse,
    summary="Find route by depot and district",
    description="Mirrors Route.find_route(). Used internally by Planning Engine. Role: DISPATCHER+",
)
async def lookup_route(
    depot:    str = Query(...),
    district: str = Query(...),
    db:       AsyncSession = Depends(get_db),
):
    stmt = (
        select(RouteModel)
        .where(
            RouteModel.depot == depot,
            RouteModel.district == district,
            RouteModel.IsActive.is_(True),
        )
    )
    route = (await db.execute(stmt)).scalar_one_or_none()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Route for depot '{depot}' and district '{district}' not found.",
        )
    return route


@router.get(
    "/lookup/by-depot",
    response_model=RouteListResponse,
    summary="All routes from a depot",
)
async def routes_by_depot(
    depot: str = Query(...),
    page:  int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    db:    AsyncSession = Depends(get_db),
):
    query = (
        select(RouteModel)
        .where(RouteModel.depot == depot, RouteModel.IsActive.is_(True))
    )

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    items = list((await db.execute(query.order_by(RouteModel.district).offset(offset).limit(limit))).scalars().all())

    return RouteListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/{route_id}",
    response_model=RouteResponse,
    summary="Get route by ID",
)
async def get_route(
    route_id: str = Path(...),
    db:       AsyncSession = Depends(get_db),
):
    route = await db.get(RouteModel, route_id)
    if not route or not route.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Route '{route_id}' not found.",
        )
    return route


@router.patch(
    "/{route_id}",
    response_model=RouteResponse,
    summary="Update road geometry fields",
    description="Role: DEPOT_MANAGER+",
)
async def update_route(
    route_id: str = Path(...),
    payload: RouteUpdate = ...,
    db:      AsyncSession = Depends(get_db),
):
    route = await db.get(RouteModel, route_id)
    if not route or not route.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Route '{route_id}' not found.",
        )

    if payload.road_class is not None:
        route.road_class = payload.road_class.value
    if payload.free_flow_kmh is not None:
        route.free_flow_kmh = payload.free_flow_kmh
    if payload.depot_to_district_km is not None:
        route.depot_to_district_km = payload.depot_to_district_km
    if payload.depot_to_district_freeflow_min is not None:
        route.depot_to_district_freeflow_min = payload.depot_to_district_freeflow_min
    if payload.inter_stop_km is not None:
        route.inter_stop_km = payload.inter_stop_km
    if payload.inter_stop_freeflow_min is not None:
        route.inter_stop_freeflow_min = payload.inter_stop_freeflow_min

    route.UpdateTime = datetime.utcnow()
    route.UpdatedBy = "DEPOT_MANAGER"

    await db.flush()
    await db.refresh(route)
    return route


@router.delete(
    "/{route_id}",
    status_code=status.HTTP_200_OK,
    summary="Soft-delete a route",
    description="Role: SUPERADMIN",
)
async def delete_route(
    route_id: str = Path(...),
    db:       AsyncSession = Depends(get_db),
):
    route = await db.get(RouteModel, route_id)
    if not route or not route.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Route '{route_id}' not found.",
        )

    route.IsActive = False
    route.UpdateTime = datetime.utcnow()
    route.UpdatedBy = "SUPERADMIN"
    await db.flush()

    return {"id": route_id, "deleted": True, "message": f"Route '{route_id}' soft-deleted."}


@router.post(
    "/{route_id}/calculate/trip-duration",
    response_model=TripDurationResponse,
    summary="Calculate trip duration in minutes",
    description=(
        "Mirrors Route.calculate_trip_minutes(stop_count, service_allowances_min). "
        "Used by Planning Engine to validate time budgets."
    ),
)
async def calculate_trip_duration(
    route_id: str = Path(...),
    payload:  TripDurationRequest = ...,
    db:       AsyncSession = Depends(get_db),
):
    route = await db.get(RouteModel, route_id)
    if not route or not route.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Route '{route_id}' not found.",
        )

    if payload.stop_count <= 0:
        return TripDurationResponse(trip_duration_min=0.0)

    outbound = route.depot_to_district_freeflow_min
    inter_stop = route.inter_stop_freeflow_min * max(0, payload.stop_count - 1)
    handling = sum(payload.service_allowances_min)
    trip_duration_min = round(outbound + inter_stop + handling, 2)

    return TripDurationResponse(trip_duration_min=trip_duration_min)


@router.get(
    "/{route_id}/calculate/round-trip-km",
    response_model=RoundTripKmResponse,
    summary="Get round-trip distance in km",
    description="Returns 2 × depot_to_district_km. Used for fuel quota checks.",
)
async def calculate_round_trip_km(
    route_id: str = Path(...),
    db:       AsyncSession = Depends(get_db),
):
    route = await db.get(RouteModel, route_id)
    if not route or not route.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Route '{route_id}' not found.",
        )

    return RoundTripKmResponse(
        route_id=route_id,
        round_trip_km=round(2.0 * route.depot_to_district_km, 2),
    )
