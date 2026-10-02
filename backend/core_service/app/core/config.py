"""
Core Service — Application configuration.

Merges: order_service, outlet_service, route_service,
        vehicle_service, dispatch_service
"""

from __future__ import annotations

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    SERVICE_NAME: str = "core-service"
    VERSION: str = "1.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "postgresql+asyncpg://waypoint:waypoint@localhost:5432/general_db"


@lru_cache
def get_settings() -> Settings:
    return Settings()
