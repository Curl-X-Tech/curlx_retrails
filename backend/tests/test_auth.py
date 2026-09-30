import pytest
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.users import UserManager
from app.guards import auth_rate_limiter
from app.models import BaseEntity, RoleType, User, UserCreate, UserType


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    payload = {
        "email": "newuser@example.com",
        "password": "validpassword123",
        "name": "New User",
        "user_type": RoleType.DISPATCHER.value,
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["name"] == "New User"
    assert data["is_active"] is False
    assert data["user_type"] == RoleType.DISPATCHER.value
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_rejects_system_admin_payload(client: AsyncClient):
    payload = {
        "email": "hacker@example.com",
        "password": "validpassword123",
        "name": "Hacker",
        "user_type": "SYSTEM_ADMIN",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_rejects_short_password(client: AsyncClient):
    payload = {
        "email": "shortpass@example.com",
        "password": "short",
        "name": "Short Pass User",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, test_user: User):
    payload = {
        "email": test_user.email,
        "password": "someotherpassword123",
        "name": "Duplicate User",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "REGISTER_USER_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user: User):
    response = await client.post(
        "/api/v1/auth/jwt/login",
        data={"username": test_user.email, "password": "userpassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, test_user: User):
    response = await client.post(
        "/api/v1/auth/jwt/login",
        data={"username": test_user.email, "password": "wrongpassword"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "LOGIN_BAD_CREDENTIALS"


@pytest.mark.asyncio
async def test_unverified_inactive_user_cannot_login(client: AsyncClient):
    register_payload = {
        "email": "pending@example.com",
        "password": "validpassword123",
        "name": "Pending User",
    }
    reg_resp = await client.post("/api/v1/auth/register", json=register_payload)
    assert reg_resp.status_code == 201
    assert reg_resp.json()["is_active"] is False

    login_resp = await client.post(
        "/api/v1/auth/jwt/login",
        data={"username": "pending@example.com", "password": "validpassword123"},
    )
    assert login_resp.status_code == 400
    assert login_resp.json()["detail"] == "LOGIN_BAD_CREDENTIALS"


@pytest.mark.asyncio
async def test_user_verification_activates_account(
    client: AsyncClient, session: AsyncSession
):
    user_db = SQLAlchemyUserDatabase(session, User)
    user_manager = UserManager(user_db)

    user = await user_manager.create(
        UserCreate(
            email="to_verify@example.com",
            password="verifypassword123",
            name="To Verify",
            is_active=False,
        )
    )
    assert user.is_active is False
    assert user.is_verified is False

    # Simulate verification: setting is_verified activates the user
    await user_db.update(user, {"is_verified": True})
    assert user.is_active is True
    assert user.is_verified is True

    # Now login succeeds
    login_resp = await client.post(
        "/api/v1/auth/jwt/login",
        data={"username": "to_verify@example.com", "password": "verifypassword123"},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


@pytest.mark.asyncio
async def test_get_current_user(
    client: AsyncClient, user_token_headers: dict[str, str]
):
    response = await client.get("/api/v1/users/me", headers=user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@example.com"
    assert data["name"] == "Regular User"
    assert data["user_type"] == RoleType.DISPATCHER.value


@pytest.mark.asyncio
async def test_get_current_user_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_current_user_name(
    client: AsyncClient, user_token_headers: dict[str, str]
):
    response = await client.patch(
        "/api/v1/users/me",
        headers=user_token_headers,
        json={"name": "Updated Name"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"


@pytest.mark.asyncio
async def test_self_update_cannot_escalate_to_system_admin(
    client: AsyncClient, driver_token_headers: dict[str, str]
):
    # Attempting to send SYSTEM_ADMIN in payload is rejected by schema validator
    response = await client.patch(
        "/api/v1/users/me",
        headers=driver_token_headers,
        json={"user_type": "SYSTEM_ADMIN"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_self_update_cannot_change_own_role(
    client: AsyncClient, driver_token_headers: dict[str, str]
):
    # Even if valid RoleType is passed to self-update, safe mode strips role modifications
    response = await client.patch(
        "/api/v1/users/me",
        headers=driver_token_headers,
        json={"user_type": RoleType.STORE_MANAGER.value, "name": "Driver Renamed"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Driver Renamed"
    assert data["user_type"] == RoleType.DRIVER.value  # Role remained DRIVER


@pytest.mark.asyncio
async def test_auth_guards_access_control(
    client: AsyncClient,
    driver_token_headers: dict[str, str],
    superuser_token_headers: dict[str, str],
):
    resp_driver_on_admin = await client.get(
        "/api/v1/guards/admin-only", headers=driver_token_headers
    )
    assert resp_driver_on_admin.status_code == 403

    resp_su_on_admin = await client.get(
        "/api/v1/guards/admin-only", headers=superuser_token_headers
    )
    assert resp_su_on_admin.status_code == 200

    resp_driver_on_driver = await client.get(
        "/api/v1/guards/driver", headers=driver_token_headers
    )
    assert resp_driver_on_driver.status_code == 200

    resp_su_on_driver = await client.get(
        "/api/v1/guards/driver", headers=superuser_token_headers
    )
    assert resp_su_on_driver.status_code == 200


@pytest.mark.asyncio
async def test_rate_limit_guard_triggers(client: AsyncClient):
    auth_rate_limiter.reset()
    # Temporarily set a very small limit for testing
    old_limit = auth_rate_limiter.requests_per_minute
    auth_rate_limiter.requests_per_minute = 3
    try:
        login_data = {
            "username": "user@example.com",
            "password": "wrongpassword",
        }
        for _ in range(3):
            res = await client.post("/api/v1/auth/jwt/login", data=login_data)
            assert res.status_code == 400

        # 4th request must be rate limited
        blocked_res = await client.post("/api/v1/auth/jwt/login", data=login_data)
        assert blocked_res.status_code == 429
        assert "Retry-After" in blocked_res.headers
    finally:
        auth_rate_limiter.requests_per_minute = old_limit
        auth_rate_limiter.reset()


def test_base_entity_inheritance_and_user_types():
    assert issubclass(User, BaseEntity)
    assert RoleType.STORE_MANAGER.value == "STORE_MANAGER"
    assert RoleType.DRIVER.value == "DRIVER"
    assert RoleType.LOADER.value == "LOADER"
    assert RoleType.DISPATCHER.value == "DISPATCHER"
    assert UserType.SYSTEM_ADMIN.value == "SYSTEM_ADMIN"
    assert UserType.STORE_MANAGER.value == "STORE_MANAGER"

    user = User(
        email="entity_check@example.com",
        hashed_password="hash",
        name="Entity Check",
        user_type=RoleType.STORE_MANAGER,
    )
    assert user.id is not None
    assert user.name == "Entity Check"
    assert user.created_at is not None
    assert user.updated_at is not None
    assert user.is_active is False
    assert user.is_superuser is False
    assert user.user_type == UserType.STORE_MANAGER
