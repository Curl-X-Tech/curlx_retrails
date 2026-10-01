from contextlib import closing

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.db import Base, engine, get_db


def test_database_engine_and_session():
    test_sync_engine = create_engine("sqlite:///:memory:")
    test_session_local = sessionmaker(
        autocommit=False, autoflush=False, bind=test_sync_engine
    )
    with test_session_local() as session:
        result = session.execute(text("SELECT 1")).scalar()
        assert result == 1


def test_get_db_generator(monkeypatch: pytest.MonkeyPatch):
    test_sync_engine = create_engine("sqlite:///:memory:")
    test_session_local = sessionmaker(
        autocommit=False, autoflush=False, bind=test_sync_engine
    )
    monkeypatch.setattr("app.core.db.SessionLocal", test_session_local)
    with closing(get_db()) as db_gen:
        session = next(db_gen)
        result = session.execute(text("SELECT 1")).scalar()
        assert result == 1


def test_base_metadata():
    assert Base.metadata is not None
    assert engine is not None
