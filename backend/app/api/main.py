from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.users import auth_backend, fastapi_users
from app.entities import User
from app.guards import (
    auth_rate_limiter,
    register_rate_limiter,
    require_driver,
    require_store_manager,
    require_system_admin,
)
from app.schemas import UserCreate, UserRead, UserUpdate

api_router = APIRouter()

api_router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
    dependencies=[Depends(auth_rate_limiter)],
)

api_router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
    dependencies=[Depends(register_rate_limiter)],
)

api_router.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
    dependencies=[Depends(auth_rate_limiter)],
)

api_router.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
    dependencies=[Depends(auth_rate_limiter)],
)

api_router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)


@api_router.get("/guards/admin-only", tags=["guards"])
def admin_only_guard(
    user: Annotated[User, Depends(require_system_admin)],
) -> dict[str, str]:
    return {"message": "Access granted to admin", "user_id": str(user.id)}


@api_router.get("/guards/store-manager", tags=["guards"])
def store_manager_guard(
    user: Annotated[User, Depends(require_store_manager)],
) -> dict[str, str]:
    return {"message": "Access granted to store manager", "user_id": str(user.id)}


@api_router.get("/guards/driver", tags=["guards"])
def driver_guard(
    user: Annotated[User, Depends(require_driver)],
) -> dict[str, str]:
    return {"message": "Access granted to driver", "user_id": str(user.id)}
