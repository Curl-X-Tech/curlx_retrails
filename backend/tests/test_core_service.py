"""
Tests for core_service.
"""

import pytest
from fastapi.testclient import TestClient

from core_service.app.main import app as _core_app


@pytest.fixture
def core_app():
    return _core_app


@pytest.fixture
def client(core_app):
    return TestClient(core_app)


def test_core_service_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "core-service"
    assert data["status"] == "ok"


def test_core_service_routes_registered(core_app):
    openapi_paths = set(core_app.openapi()["paths"].keys())

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

    # Verify auth & user endpoints
    assert "/api/v1/auth/jwt/login" in openapi_paths
    assert "/api/v1/auth/reset-password" in openapi_paths
    assert "/api/v1/users" in openapi_paths


def test_core_service_openapi_schema(core_app):
    openapi = core_app.openapi()
    assert openapi["info"]["title"] == "Waypoint — Core Service"
    assert "/orders/v1/orders" in openapi["paths"]
    assert "/outlets/v1/outlets" in openapi["paths"]
    assert "/routes/v1/routes" in openapi["paths"]
    assert "/vehicles/v1/vehicles" in openapi["paths"]
    assert "/dispatch/v1/trips" in openapi["paths"]
    assert "/api/v1/auth/jwt/login" in openapi["paths"]
