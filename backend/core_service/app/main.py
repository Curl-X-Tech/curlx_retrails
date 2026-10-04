import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.db import init_db
from app.routers.main import api_router

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
        "Fleet, Telemetry, Orders, Deferrals, Allocations, Loader Bay, Driver Routes, Deliveries, and Sync."
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

# --- Core API (/api/v1) ---
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, include_in_schema=False)


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
