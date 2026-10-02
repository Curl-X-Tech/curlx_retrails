"""
Core Service — FastAPI application entrypoint.

Port: 8000
DB: general_db

Merges the following former microservices:
  - order_service   (/orders/v1)
  - outlet_service  (/outlets/v1)
  - route_service   (/routes/v1)
  - vehicle_service (/vehicles/v1)
  - dispatch_service (/dispatch/v1)
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.database import AsyncSessionLocal, engine, init_db
from app.api.main import api_router
from app.routers import (
    drivers,
    orders,
    orders_analytics,
    orders_status,
    outlets,
    outlets_lookup,
    outlets_windows,
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
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
        async with AsyncSessionLocal() as session:
            from app.core.seed import seed_initial_users

            await seed_initial_users(session)
    except Exception as e:
        print(f"[core-service] Note: DB init deferred or connection pending: {e}")
    yield
    await engine.dispose()


app = FastAPI(
    title="Waypoint — Core Service",
    version="1.0.0",
    description=(
        "Unified service for orders, outlets, routes, vehicles, and dispatch. "
        "Consolidates former order_service, outlet_service, route_service, "
        "vehicle_service, and dispatch_service."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Auth & Users (/api/v1) ---
app.include_router(api_router, prefix="/api/v1")

# --- Orders ---
for prefix in ("/orders/v1", "/orders"):
    app.include_router(orders_status.router, prefix=prefix, include_in_schema=(prefix == "/orders/v1"))
    app.include_router(orders_analytics.router, prefix=prefix, include_in_schema=(prefix == "/orders/v1"))
    app.include_router(orders.router, prefix=prefix, include_in_schema=(prefix == "/orders/v1"))

# --- Outlets ---
for prefix in ("/outlets/v1", "/outlets"):
    app.include_router(outlets_lookup.router, prefix=prefix, include_in_schema=(prefix == "/outlets/v1"))
    app.include_router(outlets_windows.router, prefix=prefix, include_in_schema=(prefix == "/outlets/v1"))
    app.include_router(outlets.router, prefix=prefix, include_in_schema=(prefix == "/outlets/v1"))

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


@app.get("/health", tags=["Health"])
async def health():
    db_status = "connected"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"
    return {
        "service": "core-service",
        "status": "ok",
        "database": db_status,
        "version": "1.0.0",
    }
