from typing import Any

from sqlmodel import Field

from app.entities.base import BaseEntity
from app.enums.roles import UserType


class User(BaseEntity, table=True):
    """User database entity."""

    __tablename__ = "users"

    email: str = Field(unique=True, index=True, nullable=False)
    hashed_password: str = Field(nullable=False)
    is_active: bool = Field(default=False, nullable=False)
    user_type: UserType = Field(default=UserType.DISPATCHER, nullable=False)

    def __init__(self, **data: Any):
        if "is_superuser" in data:
            is_superuser = data.pop("is_superuser")
            if is_superuser and "user_type" not in data:
                data["user_type"] = UserType.SYSTEM_ADMIN
        if "is_verified" in data:
            is_verified = data.pop("is_verified")
            if is_verified and "is_active" not in data:
                data["is_active"] = is_verified
        super().__init__(**data)

    @property
    def is_superuser(self) -> bool:
        return self.user_type == UserType.SYSTEM_ADMIN

    @is_superuser.setter
    def is_superuser(self, value: bool) -> None:
        if value:
            self.user_type = UserType.SYSTEM_ADMIN
        elif self.user_type == UserType.SYSTEM_ADMIN:
            self.user_type = UserType.DISPATCHER

    @property
    def is_verified(self) -> bool:
        return self.is_active

    @is_verified.setter
    def is_verified(self, value: bool) -> None:
        self.is_active = value
