import uuid
from datetime import datetime
from typing import Any

from fastapi_users import schemas
from pydantic import Field

from app.enums.roles import UserType


class UserRead(schemas.BaseUser[uuid.UUID]):
    """Response DTO for User profiles."""

    name: str
    user_type: UserType
    created_at: datetime
    updated_at: datetime
    created_by: uuid.UUID | None = None
    updated_by: uuid.UUID | None = None


class UserCreate(schemas.BaseUserCreate):
    """Payload DTO for User creation by Admin."""

    name: str = ""
    user_type: UserType = UserType.DISPATCHER
    password: str = Field(min_length=8)
    is_active: bool = True
    is_verified: bool = True
    created_by: uuid.UUID | None = None
    updated_by: uuid.UUID | None = None


class UserUpdate(schemas.BaseUserUpdate):
    """Payload DTO for updating User profile."""

    name: str | None = None
    user_type: UserType | None = None
    password: str | None = Field(default=None, min_length=8)
    updated_by: uuid.UUID | None = None

    def create_update_dict(self) -> dict[str, Any]:
        update_dict = super().create_update_dict()
        # In safe mode (self-update on /users/me), users cannot modify their role
        update_dict.pop("user_type", None)
        return update_dict
