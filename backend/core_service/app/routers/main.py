from collections.abc import Sequence
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi_users import exceptions
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.routers.deferrals import router as deferrals_router
from app.routers.fleet import router as fleet_router
from app.routers.master import master_router
from app.routers.store_orders import router as store_orders_router
from app.core.db import get_async_session
from app.core.users import (
    UserManager,
    auth_backend,
    fastapi_users,
    get_user_manager,
)
from app.entities import User
from app.guards import (
    auth_rate_limiter,
    require_driver,
    require_store_manager,
    require_system_admin,
)
from app.schemas import UserCreate, UserRead, UserUpdate

from app.routers.allocations import router as allocations_router
from app.routers.auth_refresh import router as auth_refresh_router
from app.routers.deliveries import router as deliveries_router
from app.routers.driver_route import router as driver_route_router
from app.routers.loader import router as loader_router
from app.routers.sync import router as sync_router
from app.routers.telemetry import router as telemetry_router

api_router = APIRouter()

api_router.include_router(master_router)
api_router.include_router(fleet_router)
api_router.include_router(store_orders_router)
api_router.include_router(deferrals_router)
for _router in (
    allocations_router,
    loader_router,
    driver_route_router,
    deliveries_router,
    telemetry_router,
    auth_refresh_router,
    sync_router,
):
    api_router.include_router(_router)

api_router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
    dependencies=[Depends(auth_rate_limiter)],
)

api_router.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
    dependencies=[Depends(auth_rate_limiter)],
)


@api_router.post(
    "/users",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    tags=["users"],
)
async def create_user_by_admin(
    user_create: UserCreate,
    request: Request,
    admin: Annotated[User, Depends(require_system_admin)],
    user_manager: Annotated[UserManager, Depends(get_user_manager)],
) -> User:
    """Create a new user account (Admin only)."""
    try:
        user_create.created_by = admin.id
        user_create.updated_by = admin.id
        user_create.is_active = True
        user_create.is_verified = True
        return await user_manager.create(user_create, safe=False, request=request)
    except exceptions.UserAlreadyExists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="REGISTER_USER_ALREADY_EXISTS",
        )
    except exceptions.InvalidPasswordException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.reason,
        )


@api_router.get(
    "/users",
    response_model=list[UserRead],
    tags=["users"],
)
async def list_users_by_admin(
    admin: Annotated[User, Depends(require_system_admin)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> Sequence[User]:
    """List all user accounts (Admin only)."""
    result = await session.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


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
