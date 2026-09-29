"""
Route Management Service — FastAPI application entrypoint.

Port: 8003
Base path: /routes/v1
DB: routes_db
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.database import engine, init_db
from app.routers import routes, service_allowances


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
    except Exception as e:
        print(f"[route-service] Note: DB init deferred or connection pending: {e}")
    yield
    await engine.dispose()


app = FastAPI(
    title="Waypoint — Route Management Service",
    version="1.0.0",
    description="Manages road network geometry, inter-stop distances, and service allowance lookup.",
    docs_url="/routes/v1/docs",
    redoc_url="/routes/v1/redoc",
    openapi_url="/routes/v1/openapi.json",
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
app.include_router(routes.router,             prefix="/routes/v1")
app.include_router(service_allowances.router, prefix="/routes/v1")

# Hidden fallback routes (hidden from Swagger / OpenAPI documentation)
app.include_router(routes.router,             prefix="/routes", include_in_schema=False)
app.include_router(service_allowances.router, prefix="/routes", include_in_schema=False)


# ── Health check ──────────────────────────────────────────────────────────── #

@app.get("/routes/v1/health", tags=["Health"])
@app.get("/health", tags=["Health"], include_in_schema=False)
async def health():
    db_status = "connected"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    return {
        "service": "route-service",
        "status": "ok",
        "database": db_status,
        "version": "1.0.0",
    }
