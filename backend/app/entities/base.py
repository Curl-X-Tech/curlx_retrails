import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class BaseEntity(SQLModel):
    """Common base entity with identification and audit fields."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(default="", nullable=False)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)
    created_by: uuid.UUID | None = Field(default=None, nullable=True)
    updated_by: uuid.UUID | None = Field(default=None, nullable=True)
