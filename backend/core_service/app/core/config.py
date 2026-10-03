import logging
import secrets
from urllib.parse import urlparse

from pydantic import EmailStr, Field, computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env"),
        env_ignore_empty=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "ReTrails"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "local"
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    FIRST_SUPERUSER: EmailStr | None = None
    FIRST_SUPERUSER_PASSWORD: str | None = None

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "app"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str | None = None

    DATABASE_URL: str | None = None
    ORDER_SERVICE_URL: str = "http://localhost:8000"
    ROUTE_SERVICE_URL: str = "http://localhost:8000"
    VEHICLE_SERVICE_URL: str = "http://localhost:8000"

    USE_SQLITE: bool = False
    SQLITE_DB_PATH: str = "./app.db"

    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://localhost",
    ]

    # Email & SMTP Configuration
    SMTP_TLS: bool = False
    SMTP_SSL: bool = False
    SMTP_PORT: int = 1025
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: EmailStr | None = "info@example.com"
    EMAILS_FROM_NAME: str | None = "ReTrails"
    FRONTEND_HOST: str = "http://localhost:5173"
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 24
    # Rate Limiting Configuration
    RATE_LIMIT_AUTH_PER_MINUTE: int = 20
    RATE_LIMIT_API_PER_MINUTE: int = 100

    @computed_field
    @property
    def ASYNC_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgresql://"):
                return url.replace("postgresql://", "postgresql+asyncpg://", 1)
            if url.startswith("postgres://"):
                return url.replace("postgres://", "postgresql+asyncpg://", 1)
            return url
        if self.USE_SQLITE:
            return f"sqlite+aiosqlite:///{self.SQLITE_DB_PATH}"
        password = f":{self.POSTGRES_PASSWORD}" if self.POSTGRES_PASSWORD else ""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}{password}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @computed_field
    @property
    def SYNC_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgresql://"):
                return url.replace("postgresql://", "postgresql+psycopg://", 1)
            if url.startswith("postgres://"):
                return url.replace("postgres://", "postgresql+psycopg://", 1)
            return url
        if self.USE_SQLITE:
            return f"sqlite:///{self.SQLITE_DB_PATH}"
        password = f":{self.POSTGRES_PASSWORD}" if self.POSTGRES_PASSWORD else ""
        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}{password}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @model_validator(mode="after")
    def parse_database_url_components(self) -> "Settings":
        if self.DATABASE_URL:
            try:
                parsed = urlparse(self.DATABASE_URL)
                if parsed.hostname:
                    self.POSTGRES_SERVER = parsed.hostname
                if parsed.port:
                    self.POSTGRES_PORT = parsed.port
                if parsed.username:
                    self.POSTGRES_USER = parsed.username
                if parsed.password:
                    self.POSTGRES_PASSWORD = parsed.password
                if parsed.path and parsed.path != "/":
                    self.POSTGRES_DB = parsed.path.lstrip("/")
            except Exception as e:
                logger.warning("Failed to parse DATABASE_URL components: %s", e)
        return self

    @model_validator(mode="after")
    def check_secret_key(self) -> "Settings":
        if self.SECRET_KEY.startswith("changethis"):
            logger.warning("SECRET_KEY is using a default placeholder value. Set a secure SECRET_KEY in production.")
        return self


settings = Settings()


def get_settings() -> Settings:
    return settings
