import pytest
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.users import UserManager
from app.guards import auth_rate_limiter
from app.models import BaseEntity, RoleType, User, UserCreate, UserType


@pytest.mark.asyncio
async def test_public_registration_is_disabled(client: AsyncClient):
    payload = {
        "email": "newuser@example.com",
        "password": "validpassword123",
        "name": "New User",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_admin_create_user_success(
    client: AsyncClient, superuser_token_headers: dict[str, str], test_superuser: User
):
    payload = {
        "email": "newdriver@example.com",
        "password": "validpassword123",
        "name": "New Driver",
        "user_type": RoleType.DRIVER.value,
    }
    response = await client.post("/api/v1/users", json=payload, headers=superuser_token_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newdriver@example.com"
    assert data["name"] == "New Driver"
    assert data["is_active"] is True
    assert data["is_verified"] is True
    assert data["user_type"] == RoleType.DRIVER.value
    assert "hashed_password" not in data
    assert data["created_by"] == str(test_superuser.id)
    assert data["updated_by"] == str(test_superuser.id)


@pytest.mark.asyncio
async def test_admin_create_user_duplicate_email(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
    test_user: User,
):
    payload = {
        "email": test_user.email,
        "password": "someotherpassword123",
        "name": "Duplicate User",
        "user_type": RoleType.DISPATCHER.value,
    }
    response = await client.post("/api/v1/users", json=payload, headers=superuser_token_headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "REGISTER_USER_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_non_admin_cannot_create_user(client: AsyncClient, driver_token_headers: dict[str, str]):
    payload = {
        "email": "unauthorized_create@example.com",
        "password": "validpassword123",
        "name": "Hacker",
        "user_type": RoleType.DISPATCHER.value,
    }
    response = await client.post("/api/v1/users", json=payload, headers=driver_token_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_unauthenticated_cannot_create_user(client: AsyncClient):
    payload = {
        "email": "unauth@example.com",
        "password": "validpassword123",
        "name": "Anonymous",
        "user_type": RoleType.DISPATCHER.value,
    }
    response = await client.post("/api/v1/users", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_list_users(client: AsyncClient, superuser_token_headers: dict[str, str]):
    response = await client.get("/api/v1/users", headers=superuser_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_non_admin_cannot_list_users(client: AsyncClient, driver_token_headers: dict[str, str]):
    response = await client.get("/api/v1/users", headers=driver_token_headers)
    assert response.status_code == 403


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
async def test_inactive_user_cannot_login(client: AsyncClient, session: AsyncSession):
    user_db = SQLAlchemyUserDatabase(session, User)
    user_manager = UserManager(user_db)
    user = await user_manager.create(
        UserCreate(
            email="inactive@example.com",
            password="validpassword123",
            name="Inactive User",
        )
    )
    await user_db.update(user, {"is_active": False})

    login_resp = await client.post(
        "/api/v1/auth/jwt/login",
        data={"username": "inactive@example.com", "password": "validpassword123"},
    )
    assert login_resp.status_code == 400
    assert login_resp.json()["detail"] == "LOGIN_BAD_CREDENTIALS"


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, user_token_headers: dict[str, str]):
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
async def test_update_current_user_name(client: AsyncClient, user_token_headers: dict[str, str]):
    response = await client.patch(
        "/api/v1/users/me",
        headers=user_token_headers,
        json={"name": "Updated Name"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["created_by"] is not None
    assert data["updated_by"] is not None


@pytest.mark.asyncio
async def test_self_update_cannot_escalate_to_system_admin(client: AsyncClient, driver_token_headers: dict[str, str]):
    # Self-update runs in safe mode which silently strips user_type modifications
    response = await client.patch(
        "/api/v1/users/me",
        headers=driver_token_headers,
        json={"user_type": "SYSTEM_ADMIN", "name": "Driver Trying Escalation"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Driver Trying Escalation"
    assert data["user_type"] == RoleType.DRIVER.value


@pytest.mark.asyncio
async def test_self_update_cannot_change_own_role(client: AsyncClient, driver_token_headers: dict[str, str]):
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
    resp_driver_on_admin = await client.get("/api/v1/guards/admin-only", headers=driver_token_headers)
    assert resp_driver_on_admin.status_code == 403

    resp_su_on_admin = await client.get("/api/v1/guards/admin-only", headers=superuser_token_headers)
    assert resp_su_on_admin.status_code == 200

    resp_driver_on_driver = await client.get("/api/v1/guards/driver", headers=driver_token_headers)
    assert resp_driver_on_driver.status_code == 200

    resp_su_on_driver = await client.get("/api/v1/guards/driver", headers=superuser_token_headers)
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
    assert RoleType.STORE_MANAGER.value == "store_manager"
    assert RoleType.DRIVER.value == "driver"
    assert RoleType.LOADER.value == "loader"
    assert RoleType.DISPATCHER.value == "dispatcher"
    assert UserType.SYSTEM_ADMIN.value == "system_admin"
    assert UserType.STORE_MANAGER.value == "store_manager"
    # Case-insensitive resolution check
    assert RoleType("STORE_MANAGER") == RoleType.STORE_MANAGER
    assert UserType("SYSTEM_ADMIN") == UserType.SYSTEM_ADMIN

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
    assert user.created_by == user.id
    assert user.updated_by == user.id
    assert user.is_active is True
    assert user.is_verified is True
    assert user.is_superuser is False
    assert user.user_type == UserType.STORE_MANAGER
