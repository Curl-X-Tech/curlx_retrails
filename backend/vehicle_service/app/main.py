"""
Vehicle Manager Service — FastAPI application entrypoint.

Port: 8004
Base path: /vehicles/v1
DB: vehicles_db
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.database import engine, init_db
from app.routers import (
    vehicles,
    vehicles_eligibility,
    vehicles_quota,
    vehicles_status,
    vehicles_tree,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
    except Exception as e:
        print(f"[vehicle-service] Note: DB init deferred or connection pending: {e}")
    yield
    await engine.dispose()


app = FastAPI(
    title="Waypoint — Vehicle Manager Service",
    version="1.0.0",
    description="Manages vehicle fleet, capacity specs, fuel quotas, daily trip counts, and eligibility constraints.",
    docs_url="/vehicles/v1/docs",
    redoc_url="/vehicles/v1/redoc",
    openapi_url="/vehicles/v1/openapi.json",
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
app.include_router(vehicles_tree.router,         prefix="/vehicles/v1")
app.include_router(vehicles_eligibility.router,  prefix="/vehicles/v1")
app.include_router(vehicles_quota.router,        prefix="/vehicles/v1")
app.include_router(vehicles_status.router,       prefix="/vehicles/v1")
app.include_router(vehicles.router,              prefix="/vehicles/v1")

# Hidden fallback routes (hidden from Swagger / OpenAPI documentation)
app.include_router(vehicles_tree.router,         prefix="/vehicles", include_in_schema=False)
app.include_router(vehicles_eligibility.router,  prefix="/vehicles", include_in_schema=False)
app.include_router(vehicles_quota.router,        prefix="/vehicles", include_in_schema=False)
app.include_router(vehicles_status.router,       prefix="/vehicles", include_in_schema=False)
app.include_router(vehicles.router,              prefix="/vehicles", include_in_schema=False)


# ── Health check ──────────────────────────────────────────────────────────── #

@app.get("/vehicles/v1/health", tags=["Health"])
@app.get("/health", tags=["Health"], include_in_schema=False)
async def health():
    db_status = "connected"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    return {
        "service": "vehicle-service",
        "status": "ok",
        "database": db_status,
        "version": "1.0.0",
    }
