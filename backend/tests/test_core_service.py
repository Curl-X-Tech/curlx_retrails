"""
Tests for core_service.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

CORE_SERVICE_DIR = Path(__file__).resolve().parent.parent / "core_service"
if str(CORE_SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(CORE_SERVICE_DIR))

from app.main import app  # noqa: E402


@pytest.fixture
def client():
    return TestClient(app)


def test_core_service_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "core-service"
    assert data["status"] == "ok"


def test_core_service_routes_registered():
    openapi_paths = set(app.openapi()["paths"].keys())

    # Verify orders endpoints
    assert "/orders/v1/orders" in openapi_paths

    # Verify outlets endpoints
    assert "/outlets/v1/outlets" in openapi_paths

    # Verify routes endpoints
    assert "/routes/v1/routes" in openapi_paths

    # Verify vehicles endpoints
    assert "/vehicles/v1/vehicles" in openapi_paths

    # Verify dispatch endpoints
    assert "/dispatch/v1/trips" in openapi_paths
    assert "/dispatch/v1/drivers" in openapi_paths


def test_core_service_openapi_schema():
    openapi = app.openapi()
    assert openapi["info"]["title"] == "Waypoint — Core Service"
    assert "/orders/v1/orders" in openapi["paths"]
    assert "/outlets/v1/outlets" in openapi["paths"]
    assert "/routes/v1/routes" in openapi["paths"]
    assert "/vehicles/v1/vehicles" in openapi["paths"]
    assert "/dispatch/v1/trips" in openapi["paths"]
