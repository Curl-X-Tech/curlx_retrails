"""
Planning Engine Service — FastAPI application entrypoint.

Port: 8005
Base path: /planning/v1
DB: planning_db
Solver: HeuristicAllocationSolver (default) | ORToolsAllocationSolver
Async: Celery + Redis for solver job queue

Emits (RabbitMQ dispatch.plans exchange):
  plan.draft_created — new DRAFT plan stored
  plan.confirmed     — plan approved by DEPOT_MANAGER
  plan.superseded    — active plan replaced

Consumes (RabbitMQ orders.events exchange):
  orders.batch_ready — auto-triggers plan generation
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.database import engine, init_db
from app.routers import plans, plans_trips, plans_validate


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
    except Exception as e:
        print(f"[planning-service] Note: DB init deferred or connection pending: {e}")
    yield
    await engine.dispose()


app = FastAPI(
    title="Waypoint — Planning Engine Service",
    version="2.0.0",
    description=(
        "Fleet allocation and VRPTW scheduling service. "
        "Uses HeuristicAllocationSolver (~200ms) or OR-Tools CP-SAT (~1800ms). "
        "Manages DispatchPlan lifecycle: DRAFT → CONFIRMED → SUPERSEDED. "
        "Enforces 10 business invariants via PlanValidator on every manual edit."
    ),
    docs_url="/planning/v1/docs",
    redoc_url="/planning/v1/redoc",
    openapi_url="/planning/v1/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────── #
# Documented primary routes (only v1 appears in Swagger / OpenAPI schema)
app.include_router(plans_validate.router, prefix="/planning/v1")
app.include_router(plans_trips.router,    prefix="/planning/v1")
app.include_router(plans.router,          prefix="/planning/v1")

# Hidden fallback routes (hidden from Swagger / OpenAPI documentation)
app.include_router(plans_validate.router, prefix="/planning", include_in_schema=False)
app.include_router(plans_trips.router,    prefix="/planning", include_in_schema=False)
app.include_router(plans.router,          prefix="/planning", include_in_schema=False)


# ── Health check ──────────────────────────────────────────────────────────── #

@app.get("/planning/v1/health", tags=["Health"])
@app.get("/health", tags=["Health"], include_in_schema=False)
async def health():
    db_status = "connected"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    return {
        "service": "planning-engine",
        "status": "ok",
        "database": db_status,
        "version": "2.0.0",
    }
