import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_async_session
from app.core.users import get_jwt_strategy
from app.entities.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

optional_bearer = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/jwt/login", auto_error=False)
REFRESH_GRACE = timedelta(days=7)
AUDIENCE = ["fastapi-users:auth"]


@router.post("/refresh")
async def refresh_token(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    token: Annotated[str | None, Depends(optional_bearer)] = None,
):
    """Issues a new access token for a bearer token that expired less than 7 days ago."""
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="REFRESH_NOT_ALLOWED")
    if not token:
        raise unauthorized
    try:
        claims = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"],
            audience=AUDIENCE,
            options={"verify_exp": False},
        )
        expires = claims.get("exp")
        user_id = claims["sub"]
    except (jwt.PyJWTError, KeyError):
        raise unauthorized from None
    if expires is None or datetime.now(UTC) - datetime.fromtimestamp(expires, UTC) > REFRESH_GRACE:
        raise unauthorized
    user = await session.get(User, uuid.UUID(user_id))
    if user is None or not user.is_active:
        raise unauthorized
    return {"access_token": await get_jwt_strategy().write_token(user), "token_type": "bearer"}
