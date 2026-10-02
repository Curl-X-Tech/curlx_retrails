"""Router: /plans — plan lifecycle (generate, confirm, supersede, list, audit)."""

from datetime import date, datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.plan_service import JOBS, enqueue_planning_job
from app.models.plan import AuditLogModel, DispatchPlanModel, PlannedTripModel
from app.schemas.planning_schemas import (
    AuditLogEntry,
    JobStatus,
    JobStatusResponse,
    PlanConfirmRequest,
    PlanGenerateRequest,
    PlanGenerateResponse,
    PlanListResponse,
    PlanResponse,
    PlanStatus,
    PlanSummaryResponse,
    SolverType,
    SupersedeRequest,
)

router = APIRouter(prefix="/plans", tags=["Plans"])


@router.post(
    "/generate",
    response_model=PlanGenerateResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger fleet allocation (async)",
    description=(
        "Enqueues a solver run (heuristic ~200ms or ortools ~1800ms). "
        "Returns job_id immediately (202 Accepted). Poll GET /plans/job/{job_id}."
    ),
)
async def generate_plan(
    payload: PlanGenerateRequest,
):
    job_id, estimated_ms = enqueue_planning_job(
        order_ids=payload.order_ids,
        planning_date=payload.planning_date,
        solver_type=payload.solver.value,
        max_days=payload.max_days,
        created_by="DISPATCHER",
    )
    return PlanGenerateResponse(
        job_id=job_id,
        status=JobStatus.QUEUED,
        estimated_ms=estimated_ms,
    )


@router.get(
    "/job/{job_id}",
    response_model=JobStatusResponse,
    summary="Poll allocation job status",
    description="Returns queued | running | done | failed. When done, body includes plan_id.",
)
async def get_job_status(
    job_id: str = Path(...),
):
    job_data = JOBS.get(job_id)
    if not job_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job '{job_id}' not found.",
        )
    return JobStatusResponse(
        job_id=job_id,
        status=job_data["status"],
        plan_id=job_data.get("plan_id"),
        estimated_ms=job_data.get("estimated_ms"),
        error=job_data.get("error"),
    )


@router.get(
    "/active",
    response_model=PlanResponse,
    summary="Get today's CONFIRMED plan",
    description="Returns the current active plan. 404 if no plan is confirmed yet.",
)
async def get_active_plan(
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(DispatchPlanModel)
        .options(selectinload(DispatchPlanModel.trips))
        .where(DispatchPlanModel.status == "CONFIRMED", DispatchPlanModel.IsActive.is_(True))
        .order_by(DispatchPlanModel.planning_date.desc(), DispatchPlanModel.CreateTime.desc())
        .limit(1)
    )
    plan = (await db.execute(stmt)).scalars().first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No confirmed active dispatch plan found.",
        )
    return plan


@router.get(
    "",
    response_model=PlanListResponse,
    summary="List all plans",
    description="Returns paginated plans with optional status and solver filters.",
)
async def list_plans(
    status_filter: PlanStatus | None = Query(default=None, alias="status"),
    solver_used: SolverType | None = Query(default=None),
    planning_date: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(DispatchPlanModel)
        .options(selectinload(DispatchPlanModel.trips))
        .where(DispatchPlanModel.IsActive.is_(True))
    )

    if status_filter:
        query = query.where(DispatchPlanModel.status == status_filter.value)
    if solver_used:
        query = query.where(DispatchPlanModel.solver_used == solver_used.value)
    if planning_date:
        query = query.where(DispatchPlanModel.planning_date == planning_date)

    count_stmt = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * limit
    items = list(
        (await db.execute(query.order_by(DispatchPlanModel.CreateTime.desc()).offset(offset).limit(limit)))
        .scalars()
        .all()
    )

    return PlanListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(offset + limit) < total,
    )


@router.get(
    "/{plan_id}",
    response_model=PlanResponse,
    summary="Get full plan with all trips",
    description="Returns plan detail including all trip summaries and solver_used.",
)
async def get_plan(
    plan_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(DispatchPlanModel)
        .options(selectinload(DispatchPlanModel.trips))
        .where(DispatchPlanModel.ID == plan_id, DispatchPlanModel.IsActive.is_(True))
    )
    plan = (await db.execute(stmt)).scalars().first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan '{plan_id}' not found.",
        )
    return plan


@router.get(
    "/{plan_id}/summary",
    response_model=PlanSummaryResponse,
    summary="Get plan allocation summary",
    description="Returns stats: total_trips, allocated_day1, deferred, by_depot, by_district.",
)
async def get_plan_summary(
    plan_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    plan = await db.get(DispatchPlanModel, plan_id)
    if not plan or not plan.IsActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan '{plan_id}' not found.",
        )

    stmt = select(PlannedTripModel).where(PlannedTripModel.plan_id == plan_id, PlannedTripModel.IsActive.is_(True))
    trips = list((await db.execute(stmt)).scalars().all())

    total_trips = len(trips)
    allocated_day1 = sum(1 for t in trips if t.vehicle_id and t.allocation_day == 1)
    deferred = sum(1 for t in trips if not t.vehicle_id or (t.allocation_day and t.allocation_day > 1))

    by_depot: dict[str, int] = {}
    by_district: dict[str, int] = {}
    for t in trips:
        by_depot[t.depot] = by_depot.get(t.depot, 0) + 1
        by_district[t.district] = by_district.get(t.district, 0) + 1

    return PlanSummaryResponse(
        plan_id=plan_id,
        status=PlanStatus(plan.status),
        planning_date=plan.planning_date,
        total_trips=total_trips,
        allocated_day1=allocated_day1,
        deferred=deferred,
        by_depot=by_depot,
        by_district=by_district,
    )


@router.post(
    "/{plan_id}/confirm",
    response_model=PlanResponse,
    summary="Confirm a DRAFT plan (DRAFT → CONFIRMED)",
    description="Transitions plan status from DRAFT to CONFIRMED. Emits plan.confirmed to RabbitMQ.",
)
async def confirm_plan(
    plan_id: str = Path(...),
    payload: PlanConfirmRequest = ...,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(DispatchPlanModel)
        .options(selectinload(DispatchPlanModel.trips))
        .where(DispatchPlanModel.ID == plan_id, DispatchPlanModel.IsActive.is_(True))
    )
    plan = (await db.execute(stmt)).scalars().first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan '{plan_id}' not found.",
        )

    if plan.status == "CONFIRMED":
        return plan

    now = datetime.utcnow()
    plan.status = "CONFIRMED"
    plan.confirmed_by = payload.confirmed_by
    plan.confirmed_at = now
    plan.UpdateTime = now
    plan.UpdatedBy = payload.confirmed_by

    # Audit log
    audit = AuditLogModel(
        ID=f"AUD-{plan_id[:8]}-{uuid.uuid4().hex[:4].upper()}",
        plan_id=plan_id,
        timestamp=now,
        actor=payload.confirmed_by,
        action="CONFIRM_PLAN",
        trip_id=None,
        vehicle_id=None,
        details=f"Plan confirmed by {payload.confirmed_by}. Notes: {payload.notes or 'None'}",
        is_valid=True,
    )
    db.add(audit)
    await db.flush()
    await db.refresh(plan)

    return plan


@router.post(
    "/{plan_id}/supersede",
    response_model=PlanResponse,
    summary="Supersede a CONFIRMED plan",
    description="Marks active plan as SUPERSEDED.",
)
async def supersede_plan(
    plan_id: str = Path(...),
    payload: SupersedeRequest = ...,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(DispatchPlanModel)
        .options(selectinload(DispatchPlanModel.trips))
        .where(DispatchPlanModel.ID == plan_id, DispatchPlanModel.IsActive.is_(True))
    )
    plan = (await db.execute(stmt)).scalars().first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan '{plan_id}' not found.",
        )

    now = datetime.utcnow()
    plan.status = "SUPERSEDED"
    plan.UpdateTime = now
    plan.UpdatedBy = payload.authorized_by

    audit = AuditLogModel(
        ID=f"AUD-{plan_id[:8]}-{uuid.uuid4().hex[:4].upper()}",
        plan_id=plan_id,
        timestamp=now,
        actor=payload.authorized_by,
        action="SUPERSEDE_PLAN",
        trip_id=None,
        vehicle_id=None,
        details=f"Plan superseded by {payload.authorized_by}. Reason: {payload.reason}",
        is_valid=True,
    )
    db.add(audit)
    await db.flush()
    await db.refresh(plan)

    return plan


@router.get(
    "/{plan_id}/audit-log",
    response_model=list[AuditLogEntry],
    summary="Get full audit log for a plan",
    description="Returns all manual edits with actor, timestamp, action, and validation result.",
)
async def get_audit_log(
    plan_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AuditLogModel).where(AuditLogModel.plan_id == plan_id).order_by(AuditLogModel.timestamp.desc())
    logs = list((await db.execute(stmt)).scalars().all())
    return logs
