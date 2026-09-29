"""
Route Management Service — Core configuration.
"""

from __future__ import annotations

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    SERVICE_NAME: str = "route-service"
    VERSION:      str = "1.0.0"
    PORT:         int = 8003

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://waypoint:waypoint@localhost:5432/routes_db"


@lru_cache
def get_settings() -> Settings:
    return Settings()
