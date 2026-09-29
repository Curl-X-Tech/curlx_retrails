"""
Outlet Manager Service — FastAPI application entrypoint.

Port: 8002
Base path: /outlets/v1
DB: outlets_db
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.database import engine, init_db
from app.routers import outlets, outlets_lookup, outlets_windows


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
    except Exception as e:
        print(f"[outlet-service] Note: DB init deferred or connection pending: {e}")
    yield
    await engine.dispose()


app = FastAPI(
    title="Waypoint — Outlet Manager Service",
    version="1.0.0",
    description="Manages store registry, delivery windows, dock types, and parking constraints.",
    docs_url="/outlets/v1/docs",
    redoc_url="/outlets/v1/redoc",
    openapi_url="/outlets/v1/openapi.json",
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
app.include_router(outlets_lookup.router,  prefix="/outlets/v1")
app.include_router(outlets_windows.router, prefix="/outlets/v1")
app.include_router(outlets.router,         prefix="/outlets/v1")

# Hidden fallback routes (hidden from Swagger / OpenAPI documentation)
app.include_router(outlets_lookup.router,  prefix="/outlets", include_in_schema=False)
app.include_router(outlets_windows.router, prefix="/outlets", include_in_schema=False)
app.include_router(outlets.router,         prefix="/outlets", include_in_schema=False)


# ── Health check ──────────────────────────────────────────────────────────── #

@app.get("/outlets/v1/health", tags=["Health"])
@app.get("/health", tags=["Health"], include_in_schema=False)
async def health():
    db_status = "connected"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    return {
        "service": "outlet-service",
        "status": "ok",
        "database": db_status,
        "version": "1.0.0",
    }
