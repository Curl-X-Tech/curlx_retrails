from sqlalchemy import text

from app.core.db import Base, SessionLocal, engine, get_db


def test_database_engine_and_session():
    # Test connection and session execution
    with SessionLocal() as session:
        result = session.execute(text("SELECT 1")).scalar()
        assert result == 1


def test_get_db_generator():
    db_gen = get_db()
    session = next(db_gen)
    try:
        result = session.execute(text("SELECT 1")).scalar()
        assert result == 1
    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass


def test_base_metadata():
    assert Base.metadata is not None
    assert engine is not None
