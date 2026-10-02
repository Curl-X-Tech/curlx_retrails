import logging
import uuid
from collections.abc import AsyncGenerator
from typing import Annotated, Any

from fastapi import Depends, Request
from fastapi_users import (
    BaseUserManager,
    FastAPIUsers,
    UUIDIDMixin,
    exceptions,
    schemas,
)
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase

from app.core.config import settings
from app.core.db import get_user_db
from app.entities.base import utc_now
from app.models import User
from app.services.email import email_service

logger = logging.getLogger(__name__)


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.SECRET_KEY
    verification_token_secret = settings.SECRET_KEY

    async def validate_password(self, password: str, user: schemas.UC | User) -> None:
        if len(password) < 8:
            raise exceptions.InvalidPasswordException(reason="Password must be at least 8 characters long.")

    async def _update(self, user: User, update_dict: dict[str, Any]) -> User:
        update_dict["updated_at"] = utc_now()
        if "updated_by" not in update_dict or update_dict["updated_by"] is None:
            update_dict["updated_by"] = user.id
        return await super()._update(user, update_dict)

    async def on_after_register(self, user: User, request: Request | None = None) -> None:
        logger.info(
            "User registered: %s (Email: %s, Role: %s)",
            user.id,
            user.email,
            user.user_type,
        )

    async def on_after_forgot_password(self, user: User, token: str, request: Request | None = None) -> None:
        logger.info(
            "Password reset requested for user %s (%s). Dispatching reset email.",
            user.id,
            user.email,
        )
        await email_service.send_reset_password_email(
            email_to=user.email,
            token=token,
            user_name=user.name,
        )

    async def on_after_reset_password(self, user: User, request: Request | None = None) -> None:
        logger.info("Password reset successfully for user: %s (%s)", user.id, user.email)


async def get_user_manager(
    user_db: Annotated[SQLAlchemyUserDatabase, Depends(get_user_db)],
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)


bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=settings.SECRET_KEY,
        lifetime_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager,
    [auth_backend],
)

current_active_user = fastapi_users.current_user(active=True)
current_active_superuser = fastapi_users.current_user(active=True, superuser=True)
