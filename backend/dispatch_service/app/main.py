"""
Dispatcher Service — FastAPI application entrypoint.

Port: 8006
Base path: /dispatch/v1
DB: dispatch_db

Consumes (RabbitMQ dispatch.plans exchange):
  plan.confirmed  — creates run sheets; ACKs only after all run sheets persisted
  plan.superseded — invalidates existing run sheets

Emits (RabbitMQ trip.events exchange):
  trip.departed        — vehicle leaves depot
  trip.stop_completed  — stop delivery confirmed
  trip.completed       — vehicle returns to depot (triggers Order Service)
  trip.delayed         — delay reported by driver

NOTE: This service is origin-agnostic.
AUTO-planned trips (from Planning Engine) and MANUAL trips
(created directly via /dispatch/trips/manual) are handled identically.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.database import engine, init_db
from app.routers import drivers, plan_ingest, runsheets, trips, trips_manual


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
    except Exception as e:
        print(f"[dispatch-service] Note: DB init deferred or connection pending: {e}")
    yield
    await engine.dispose()


app = FastAPI(
    title="Waypoint — Dispatcher Service",
    version="1.0.0",
    description=(
        "Live trip execution: run sheet generation, driver check-in, "
        "stop-by-stop delivery tracking, delay reporting, and manual trip creation. "
        "Receives confirmed plans from Planning Engine via RabbitMQ or sync API."
    ),
    docs_url="/dispatch/v1/docs",
    redoc_url="/dispatch/v1/redoc",
    openapi_url="/dispatch/v1/openapi.json",
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
app.include_router(runsheets.router,    prefix="/dispatch/v1")
app.include_router(trips_manual.router, prefix="/dispatch/v1")
app.include_router(trips.router,        prefix="/dispatch/v1")
app.include_router(drivers.router,      prefix="/dispatch/v1")
app.include_router(plan_ingest.router,  prefix="/dispatch/v1")

# Hidden fallback routes (hidden from Swagger / OpenAPI documentation)
app.include_router(runsheets.router,    prefix="/dispatch", include_in_schema=False)
app.include_router(trips_manual.router, prefix="/dispatch", include_in_schema=False)
app.include_router(trips.router,        prefix="/dispatch", include_in_schema=False)
app.include_router(drivers.router,      prefix="/dispatch", include_in_schema=False)
app.include_router(plan_ingest.router,  prefix="/dispatch", include_in_schema=False)


# ── Health check ──────────────────────────────────────────────────────────── #

@app.get("/dispatch/v1/health", tags=["Health"])
@app.get("/health", tags=["Health"], include_in_schema=False)
async def health():
    db_status = "connected"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    return {
        "service": "dispatch-service",
        "status": "ok",
        "database": db_status,
        "version": "1.0.0",
    }
