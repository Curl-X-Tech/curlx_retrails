"""
Core Service — Application configuration.

Merges: order_service, outlet_service, route_service,
        vehicle_service, dispatch_service
"""

from __future__ import annotations

import secrets
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    SERVICE_NAME: str = "core-service"
    PROJECT_NAME: str = "ReTrails"
    VERSION: str = "1.0.0"
    PORT: int = 8000
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = "postgresql+asyncpg://waypoint:waypoint@localhost:5432/general_db"

    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    ENVIRONMENT: str = "local"

    FIRST_SUPERUSER: str | None = None
    FIRST_SUPERUSER_PASSWORD: str | None = None

    # Email & SMTP Configuration
    SMTP_TLS: bool = False
    SMTP_SSL: bool = False
    SMTP_PORT: int = 1025
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: str | None = "info@example.com"
    EMAILS_FROM_NAME: str | None = "ReTrails"
    FRONTEND_HOST: str = "http://localhost:5173"
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 24

    # Rate Limiting Configuration
    RATE_LIMIT_AUTH_PER_MINUTE: int = 20
    RATE_LIMIT_API_PER_MINUTE: int = 100

    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://localhost",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
