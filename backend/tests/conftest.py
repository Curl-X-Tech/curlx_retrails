from collections.abc import AsyncGenerator

import pytest
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.core.config import settings
from app.core.db import get_async_session
from app.core.users import UserManager
from app.guards import auth_rate_limiter, register_rate_limiter
from app.main import app
from app.models import RoleType, User, UserCreate, UserType
from app.services.email import email_service

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

test_session_maker = async_sessionmaker(
    test_engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


@pytest.fixture(autouse=True)
async def prepare_test_db() -> AsyncGenerator[None, None]:
    auth_rate_limiter.reset()
    register_rate_limiter.reset()
    email_service.clear_outbox()
    orig_resend_key = settings.RESEND_API_KEY
    settings.RESEND_API_KEY = ""
    for table in SQLModel.metadata.tables.values():
        seen_idx = set()
        deduped_idx = set()
        for idx in table.indexes:
            if idx.name not in seen_idx:
                seen_idx.add(idx.name)
                deduped_idx.add(idx)
        table.indexes.clear()
        table.indexes.update(deduped_idx)

    from app.core.database import Base

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    settings.RESEND_API_KEY = orig_resend_key
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest.fixture
async def session() -> AsyncGenerator[AsyncSession, None]:
    async with test_session_maker() as s:
        yield s


@pytest.fixture
async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_async_session() -> AsyncGenerator[AsyncSession, None]:
        yield session

    app.dependency_overrides[get_async_session] = override_get_async_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(session: AsyncSession) -> User:
    user_db = SQLAlchemyUserDatabase(session, User)
    user_manager = UserManager(user_db)
    user = await user_manager.create(
        UserCreate(
            email="user@example.com",
            password="userpassword123",
            name="Regular User",
            user_type=RoleType.DISPATCHER,
            is_active=True,
        )
    )
    return user


@pytest.fixture
async def test_driver(session: AsyncSession) -> User:
    user_db = SQLAlchemyUserDatabase(session, User)
    user_manager = UserManager(user_db)
    driver = await user_manager.create(
        UserCreate(
            email="driver@example.com",
            password="driverpassword123",
            name="Driver User",
            user_type=RoleType.DRIVER,
            is_active=True,
        )
    )
    return driver


@pytest.fixture
async def test_superuser(session: AsyncSession) -> User:
    user_db = SQLAlchemyUserDatabase(session, User)
    user_manager = UserManager(user_db)
    hashed_pw = user_manager.password_helper.hash("superuserpassword123")
    superuser = User(
        email="superuser@example.com",
        hashed_password=hashed_pw,
        name="Super User",
        user_type=UserType.SYSTEM_ADMIN,
        is_active=True,
    )
    session.add(superuser)
    await session.commit()
    await session.refresh(superuser)
    return superuser


@pytest.fixture
async def user_token_headers(client: AsyncClient, test_user: User) -> dict[str, str]:
    login_data = {
        "username": "user@example.com",
        "password": "userpassword123",
    }
    response = await client.post("/api/v1/auth/jwt/login", data=login_data)
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def driver_token_headers(client: AsyncClient, test_driver: User) -> dict[str, str]:
    login_data = {
        "username": "driver@example.com",
        "password": "driverpassword123",
    }
    response = await client.post("/api/v1/auth/jwt/login", data=login_data)
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def superuser_token_headers(client: AsyncClient, test_superuser: User) -> dict[str, str]:
    login_data = {
        "username": "superuser@example.com",
        "password": "superuserpassword123",
    }
    response = await client.post("/api/v1/auth/jwt/login", data=login_data)
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
