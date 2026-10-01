from typing import Any

from sqlmodel import Field

from app.entities.base import BaseEntity
from app.enums.roles import UserType


class User(BaseEntity, table=True):
    """User database entity."""

    __tablename__ = "users"

    email: str = Field(unique=True, index=True, nullable=False)
    hashed_password: str = Field(nullable=False)
    is_active: bool = Field(default=True, nullable=False)
    is_verified: bool = Field(default=True, nullable=False)
    user_type: UserType = Field(default=UserType.DISPATCHER, nullable=False)

    def __init__(self, **data: Any):
        if "is_superuser" in data:
            is_superuser = data.pop("is_superuser")
            if is_superuser and "user_type" not in data:
                data["user_type"] = UserType.SYSTEM_ADMIN
        super().__init__(**data)
        if self.created_by is None:
            self.created_by = self.id
        if self.updated_by is None:
            self.updated_by = self.created_by or self.id

    @property
    def is_superuser(self) -> bool:
        return self.user_type == UserType.SYSTEM_ADMIN

    @is_superuser.setter
    def is_superuser(self, value: bool) -> None:
        if value:
            self.user_type = UserType.SYSTEM_ADMIN
        elif self.user_type == UserType.SYSTEM_ADMIN:
            self.user_type = UserType.DISPATCHER
