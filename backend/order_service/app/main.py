"""
Order Service — FastAPI application entrypoint.

Port: 8001
Base path: /orders/v1
DB: orders_db
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.database import engine, init_db
from app.routers import orders, orders_status, orders_analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize schema tables if they don't exist
    try:
        await init_db()
    except Exception as e:
        print(f"[order-service] Note: DB init deferred or connection pending: {e}")
    yield
    # Shutdown: dispose connection pool
    await engine.dispose()


app = FastAPI(
    title="Waypoint — Order Service",
    version="1.0.0",
    description=(
        "Manages delivery order lifecycle: creation, status tracking, "
        "and batch triggering for the Planning Engine."
    ),
    docs_url="/orders/v1/docs",
    redoc_url="/orders/v1/redoc",
    openapi_url="/orders/v1/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────── #
# Documented primary routes (only v1 appears in Swagger / OpenAPI schema)
app.include_router(orders_status.router,     prefix="/orders/v1")
app.include_router(orders_analytics.router,  prefix="/orders/v1")
app.include_router(orders.router,            prefix="/orders/v1")

# Hidden fallback routes (hidden from Swagger / OpenAPI documentation)
app.include_router(orders_status.router,     prefix="/orders", include_in_schema=False)
app.include_router(orders_analytics.router,  prefix="/orders", include_in_schema=False)
app.include_router(orders.router,            prefix="/orders", include_in_schema=False)


# ── Health check ──────────────────────────────────────────────────────────── #

@app.get("/orders/v1/health", tags=["Health"])
@app.get("/health", tags=["Health"], include_in_schema=False)
async def health():
    db_status = "connected"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    return {
        "service": "order-service",
        "status": "ok",
        "database": db_status,
        "version": "1.0.0",
    }
