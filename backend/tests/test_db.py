from contextlib import closing

from sqlalchemy import text

from app.core.db import Base, SessionLocal, engine, get_db


def test_database_engine_and_session():
    with SessionLocal() as session:
        result = session.execute(text("SELECT 1")).scalar()
        assert result == 1


def test_get_db_generator():
    with closing(get_db()) as db_gen:
        session = next(db_gen)
        result = session.execute(text("SELECT 1")).scalar()
        assert result == 1


def test_base_metadata():
    assert Base.metadata is not None
    assert engine is not None
