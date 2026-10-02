"""
Tests for planning_service.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

PLANNING_SERVICE_DIR = Path(__file__).resolve().parent.parent / "planning_service"


def _clean_app_modules():
    for k in list(sys.modules.keys()):
        if k == "app" or k.startswith("app."):
            del sys.modules[k]


@pytest.fixture
def planning_client():
    _clean_app_modules()
    if str(PLANNING_SERVICE_DIR) not in sys.path:
        sys.path.insert(0, str(PLANNING_SERVICE_DIR))
    from app.main import app as planning_app

    client = TestClient(planning_app)
    yield client
    _clean_app_modules()


def test_planning_service_health(planning_client):
    response = planning_client.get("/planning/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "planning-engine"
    assert data["status"] == "ok"


def test_planning_service_config():
    _clean_app_modules()
    if str(PLANNING_SERVICE_DIR) not in sys.path:
        sys.path.insert(0, str(PLANNING_SERVICE_DIR))
    from app.core.config import get_settings

    settings = get_settings()
    assert settings.CORE_SERVICE_URL == "http://localhost:8000"
    _clean_app_modules()
