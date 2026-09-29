"""
Planning Engine Service — Application Settings.

Reads from environment variables (set via docker-compose or .env file).
All inter-service URLs are injected at runtime so the planning engine
can call Vehicle Manager, Route Management, and Outlet Manager during
plan generation.
"""

from __future__ import annotations

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # ── Service identity ──────────────────────────────────────────────────── #
    SERVICE_NAME: str = "planning-engine"
    VERSION:      str = "2.0.0"
    PORT:         int = 8005

    # ── Database ──────────────────────────────────────────────────────────── #
    DATABASE_URL: str = "postgresql://waypoint:waypoint@localhost:5432/planning_db"

    # ── Celery / Redis job queue ───────────────────────────────────────────── #
    REDIS_URL:  str = "redis://localhost:6379/0"

    # ── RabbitMQ event bus ────────────────────────────────────────────────── #
    RABBITMQ_URL: str = "amqp://waypoint:waypoint@localhost:5672/"

    # Exchanges
    RABBITMQ_EXCHANGE_DISPATCH: str = "dispatch.plans"
    RABBITMQ_EXCHANGE_ORDERS:   str = "orders.events"

    # ── Downstream service base URLs ──────────────────────────────────────── #
    # Called at plan-generation time to fetch live vehicle, route, outlet, and
    # service-allowance data. These replace the old CSV file loads.
    ORDER_SERVICE_URL:   str = "http://localhost:8001"
    OUTLET_SERVICE_URL:  str = "http://localhost:8002"
    ROUTE_SERVICE_URL:   str = "http://localhost:8003"
    VEHICLE_SERVICE_URL: str = "http://localhost:8004"

    # ── Solver performance baselines (ms) ─────────────────────────────────── #
    # Reported in the 202 response as estimated_ms so the UI can set a
    # sensible polling interval.
    SOLVER_HEURISTIC_ESTIMATED_MS: int = 250    # HeuristicAllocationSolver
    SOLVER_ORTOOLS_ESTIMATED_MS:   int = 1800   # OR-Tools CP-SAT


@lru_cache
def get_settings() -> Settings:
    """Return cached settings singleton (safe for FastAPI Depends)."""
    return Settings()
