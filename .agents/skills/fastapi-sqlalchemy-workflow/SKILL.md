---
name: fastapi-sqlalchemy-workflow
description: Best practices, standards, and patterns for developing FastAPI and SQLAlchemy 2.0 services in Curl X
---

# FastAPI + SQLAlchemy 2.0 Development Workflow

## 1. Directory Structure (`backend/app/`)
- `core/config.py`: Environment configurations powered by `pydantic-settings`.
- `core/db.py`: DeclarativeBase, database engine, SessionLocal factory, and table creation logic.
- `core/security.py`: Password hashing (Argon2/Bcrypt) and JWT token generation/validation.
- `models/` or `models.py`: SQLAlchemy 2.0 declarative models using `Mapped[...]` and `mapped_column(...)`.
- `schemas/` or `schemas.py`: Pydantic v2 schemas for request validation and response serialization (`ConfigDict(from_attributes=True)`).
- `crud/` or `crud.py`: Reusable data access operations using SQLAlchemy 2.0 `select()` and session methods.
- `api/deps.py`: FastAPI dependency injections (Database Session `get_db`, Current User `get_current_user`, Superuser guard).
- `api/main.py`: Top-level `/api/v1` router aggregator.
- `api/routes/`: Route modules (`auth.py`, `users.py`, `items.py`, `sync.py`, `utils.py`).

## 2. Model and Schema Separation Conventions
Maintain strict separation between database entities and API contracts:
1. `models.py`: Declarative SQLAlchemy 2.0 models with type annotations (`Mapped[...]`).
2. `schemas.py`:
   - `[Entity]Base(BaseModel)`: Common entity fields.
   - `[Entity]Create([Entity]Base)`: Fields required on creation.
   - `[Entity]Update(BaseModel)`: Optional fields for partial updates.
   - `[Entity]Public([Entity]Base)`: Safe API response model including `id`, `created_at`, `updated_at`, with `model_config = ConfigDict(from_attributes=True)`.
   - `[Entity]sPublic(BaseModel)`: Paginated response model (`data: list[[Entity]Public]`, `count: int`).

## 3. Database & Migrations
- Primary DB: PostgreSQL via `psycopg[binary]`.
- Fallback DB: SQLite support when `USE_SQLITE=true`.
- Alembic migrations:
  - Generate: `uv run alembic revision --autogenerate -m "description"`
  - Apply: `uv run alembic upgrade head`
