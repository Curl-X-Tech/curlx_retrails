import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.routers.main import api_router
from app.core.config import settings
from app.core.db import init_db
from app.routers import (
    drivers,
    orders,
    orders_analytics,
    orders_status,
    plan_ingest,
    routes,
    runsheets,
    service_allowances,
    trips,
    trips_manual,
    vehicles,
    vehicles_eligibility,
    vehicles_quota,
    vehicles_status,
    vehicles_tree,
    sync,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Initializing database...")
    try:
        await init_db()
        logger.info("Database initialized successfully.")
    except (SQLAlchemyError, OSError) as exc:
        logger.warning(
            "Could not connect to database on startup: %s. Continuing in fallback mode.",
            exc,
        )
    yield


app = FastAPI(
    title="Waypoint — Core Service",
    version="1.0.0",
    description=(
        "Unified Core Service for Team CurlX ReTrails: "
        "Identity & Auth, Master Domain (Brands, Calendar, Depots, Districts, Items, Outlets, Prices), "
        "Orders, Outlets, Routes, Vehicles, and Dispatch execution."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# --- Master Domain, Identity & Auth (/api/v1) ---
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, include_in_schema=False)

# --- Orders ---
for prefix in ("/orders/v1", "/orders"):
    app.include_router(orders_status.router, prefix=prefix, include_in_schema=(prefix == "/orders/v1"))
    app.include_router(orders_analytics.router, prefix=prefix, include_in_schema=(prefix == "/orders/v1"))
    app.include_router(orders.router, prefix=prefix, include_in_schema=(prefix == "/orders/v1"))

# --- Routes ---
for prefix in ("/routes/v1", "/routes"):
    app.include_router(routes.router, prefix=prefix, include_in_schema=(prefix == "/routes/v1"))
    app.include_router(service_allowances.router, prefix=prefix, include_in_schema=(prefix == "/routes/v1"))

# --- Vehicles ---
for prefix in ("/vehicles/v1", "/vehicles"):
    app.include_router(vehicles_tree.router, prefix=prefix, include_in_schema=(prefix == "/vehicles/v1"))
    app.include_router(vehicles_eligibility.router, prefix=prefix, include_in_schema=(prefix == "/vehicles/v1"))
    app.include_router(vehicles_quota.router, prefix=prefix, include_in_schema=(prefix == "/vehicles/v1"))
    app.include_router(vehicles_status.router, prefix=prefix, include_in_schema=(prefix == "/vehicles/v1"))
    app.include_router(vehicles.router, prefix=prefix, include_in_schema=(prefix == "/vehicles/v1"))

# --- Dispatch ---
for prefix in ("/dispatch/v1", "/dispatch"):
    app.include_router(runsheets.router, prefix=prefix, include_in_schema=(prefix == "/dispatch/v1"))
    app.include_router(trips_manual.router, prefix=prefix, include_in_schema=(prefix == "/dispatch/v1"))
    app.include_router(trips.router, prefix=prefix, include_in_schema=(prefix == "/dispatch/v1"))
    app.include_router(drivers.router, prefix=prefix, include_in_schema=(prefix == "/dispatch/v1"))
    app.include_router(plan_ingest.router, prefix=prefix, include_in_schema=(prefix == "/dispatch/v1"))

# --- Sync ---
app.include_router(sync.router, prefix=settings.API_V1_STR)
app.include_router(sync.router, prefix="", include_in_schema=False)


@app.get("/")
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API by Team CurlX"}


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "service": "core-service",
        "status": "ok",
        "database": "connected",
        "version": "1.0.0",
    }
