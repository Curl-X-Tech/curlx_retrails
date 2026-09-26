---
name: fastapi-sqlmodel-workflow
description: Best practices, standards, and patterns for developing FastAPI and SQLModel services in Curl X
---

# FastAPI + SQLModel Development Workflow

## 1. Directory Structure (`backend/app/`)
- `core/config.py`: Environment configurations powered by `pydantic-settings`.
- `core/db.py`: Database engine, sessions, table creation, and fallback logic.
- `core/security.py`: Password hashing (Argon2/Bcrypt) and JWT token generation/validation.
- `models.py`: SQLModel table declarations and Pydantic schemas (Base, Create, Update, Public).
- `crud.py`: Reusable data access operations.
- `api/deps.py`: FastAPI dependency injections (Database Session, Current User, Superuser guard).
- `api/main.py`: Top-level `/api/v1` router aggregator.
- `api/routes/`: Route modules (`auth.py`, `users.py`, `items.py`, `sync.py`, `utils.py`).

## 2. SQLModel Schema Conventions
Always define layered models to avoid circular references and ensure strict input/output safety:
1. `[Entity]Base(SQLModel)`: Common fields (title, description, status).
2. `[Entity]Create([Entity]Base)`: Fields required on creation.
3. `[Entity]Update(SQLModel)`: Optional fields for updates.
4. `[Entity]([Entity]Base, table=True)`: Database model with primary keys, relations, timestamps.
5. `[Entity]Public([Entity]Base)`: Safe API response model including `id`, `created_at`, `updated_at`.
6. `[Entity]sPublic(SQLModel)`: Paginated response model (`data: list[[Entity]Public]`, `count: int`).

## 3. Database & Migrations
- Primary DB: PostgreSQL via `psycopg[binary]` or `asyncpg`.
- Fallback DB: SQLite support when `USE_SQLITE=true`.
- Alembic migrations:
  - Generate: `uv run alembic revision --autogenerate -m "description"`
  - Apply: `uv run alembic upgrade head`
