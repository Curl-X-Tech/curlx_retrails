---
name: sqlalchemy
description: Use when writing or reviewing Python code with SQLAlchemy 2.0, especially declarative models with Mapped and mapped_column, sessions, queries, relationships, cascading, creates, updates, and deletes.
---

# SQLAlchemy 2.0 Patterns and Best Practices

Use modern SQLAlchemy 2.0 declarative style and query syntax. Do not use legacy 1.x patterns such as `declarative_base()`, `Column()`, `session.query()`, or legacy string-based query syntax.

## 1. Declarative Base and Models

Define a single declarative base class inheriting from `DeclarativeBase`:

```python
from datetime import datetime, timezone
from uuid import UUID, uuid4
from sqlalchemy import ForeignKey, String, Text, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), default=None)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    items: Mapped[list["Item"]] = relationship(
        back_populates="owner",
        cascade="all, delete-orphan",
    )


class Item(Base):
    __tablename__ = "items"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, default=None)
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    owner: Mapped[User] = relationship(back_populates="items")
```

## 2. Engine and Session Management

Create synchronous engine and sessionmaker:

```python
from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session
```

## 3. Querying with SQLAlchemy 2.0 `select()`

Always use `select(...)` executable statements. Avoid `session.query(...)`.

```python
from sqlalchemy import select

# Select by primary key
user = session.get(User, user_id)

# Select one or none
statement = select(User).where(User.email == email)
user = session.execute(statement).scalar_one_or_none()

# Select multiple with pagination
statement = select(Item).where(Item.owner_id == user_id).offset(skip).limit(limit)
items = session.execute(statement).scalars().all()

# Count query
from sqlalchemy import func
count_stmt = select(func.count()).select_from(Item).where(Item.owner_id == user_id)
total = session.execute(count_stmt).scalar_one()
```

## 4. Insert, Update, and Delete Operations

```python
# Create
new_item = Item(title="Sample", owner_id=user_id)
session.add(new_item)
session.commit()
session.refresh(new_item)

# Update in place
user.full_name = "New Name"
session.commit()
session.refresh(user)

# Delete
session.delete(item)
session.commit()
```

## 5. Integration with Pydantic v2

Use `model_config = ConfigDict(from_attributes=True)` on Pydantic response models:

```python
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


class ItemPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
```
