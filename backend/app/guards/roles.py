from enum import Enum
from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.core.users import current_active_user
from app.entities.user import User
from app.enums.roles import RoleType, UserType


class RoleGuard:
    """Authorization guard checking if authenticated user has required role."""

    def __init__(self, *allowed_roles: UserType | RoleType | str):
        self.allowed_roles: set[str] = set()
        for role in allowed_roles:
            if isinstance(role, Enum):
                self.allowed_roles.add(str(role.value).lower())
            else:
                self.allowed_roles.add(str(role).lower())

    async def __call__(self, user: Annotated[User, Depends(current_active_user)]) -> User:
        user_role = (user.user_type.value if isinstance(user.user_type, Enum) else str(user.user_type)).lower()

        # system_admin has universal access unless explicitly restricted
        if user_role == UserType.SYSTEM_ADMIN.value or user_role in self.allowed_roles:
            return user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Insufficient privileges",
        )


# Common Role Guards
require_system_admin = RoleGuard(UserType.SYSTEM_ADMIN)
require_store_manager = RoleGuard(RoleType.STORE_MANAGER)
require_driver = RoleGuard(RoleType.DRIVER)
require_loader = RoleGuard(RoleType.LOADER)
require_dispatcher = RoleGuard(RoleType.DISPATCHER)
