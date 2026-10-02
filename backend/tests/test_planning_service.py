"""
Tests for planning_service.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

PLANNING_SERVICE_DIR = Path(__file__).resolve().parent.parent / "planning_service"


@pytest.fixture
def planning_client():
    saved_modules = {k: v for k, v in list(sys.modules.items()) if k == "app" or k.startswith("app.")}
    for k in list(saved_modules.keys()):
        del sys.modules[k]
    sys.path.insert(0, str(PLANNING_SERVICE_DIR))
    try:
        from app.main import app as planning_app

        client = TestClient(planning_app)
        yield client
    finally:
        for k in list(sys.modules.keys()):
            if k == "app" or k.startswith("app."):
                del sys.modules[k]
        if str(PLANNING_SERVICE_DIR) in sys.path:
            sys.path.remove(str(PLANNING_SERVICE_DIR))
        sys.modules.update(saved_modules)


def test_planning_service_health(planning_client):
    response = planning_client.get("/planning/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "planning-engine"
    assert data["status"] == "ok"


def test_planning_service_config():
    saved_modules = {k: v for k, v in list(sys.modules.items()) if k == "app" or k.startswith("app.")}
    for k in list(saved_modules.keys()):
        del sys.modules[k]
    sys.path.insert(0, str(PLANNING_SERVICE_DIR))
    try:
        from app.core.config import get_settings

        settings = get_settings()
        assert settings.CORE_SERVICE_URL == "http://localhost:8000"
    finally:
        for k in list(sys.modules.keys()):
            if k == "app" or k.startswith("app."):
                del sys.modules[k]
        if str(PLANNING_SERVICE_DIR) in sys.path:
            sys.path.remove(str(PLANNING_SERVICE_DIR))
        sys.modules.update(saved_modules)
