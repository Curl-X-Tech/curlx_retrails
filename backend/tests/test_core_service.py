"""
Tests for core_service routes and OpenAPI schema.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app as _core_app


@pytest.fixture
def core_app():
    return _core_app


@pytest.fixture
def core_client(core_app):
    return TestClient(core_app)


def test_core_service_health(core_client):
    response = core_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "core-service"
    assert data["status"] == "ok"


def test_core_service_routes_registered(core_app):
    openapi_paths = set(core_app.openapi()["paths"].keys())

    # Verify orders endpoints
    assert "/orders/v1/orders" in openapi_paths

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

    # Verify master domain endpoints
    assert "/api/v1/master/brands" in openapi_paths
    assert "/api/v1/master/depots" in openapi_paths
    assert "/api/v1/master/districts" in openapi_paths
    assert "/api/v1/master/items" in openapi_paths
    assert "/api/v1/master/outlets" in openapi_paths
    assert "/api/v1/master/outlets/{identifier}/windows/effective" in openapi_paths
    assert "/api/v1/master/outlets/windows/by-district" in openapi_paths
    assert "/outlets/v1/outlets" not in openapi_paths
    assert "/api/v1/master/prices" in openapi_paths
    assert "/api/v1/master/calendar/operating-days" in openapi_paths
    assert "/api/v1/sync/batch" in openapi_paths
    assert "/sync/batch" not in openapi_paths
    assert "/master/brands" not in openapi_paths
    assert "/master/depots" not in openapi_paths
    assert "/master/districts" not in openapi_paths
    assert "/master/items" not in openapi_paths
    assert "/master/outlets" not in openapi_paths
    assert "/master/prices" not in openapi_paths
    assert "/master/calendar" not in openapi_paths


def test_core_service_openapi_schema(core_app):
    openapi = core_app.openapi()
    assert openapi["info"]["title"] == "Waypoint — Core Service"
    assert "/orders/v1/orders" in openapi["paths"]
    assert "/routes/v1/routes" in openapi["paths"]
    assert "/vehicles/v1/vehicles" in openapi["paths"]
    assert "/dispatch/v1/trips" in openapi["paths"]
    assert "/api/v1/auth/jwt/login" in openapi["paths"]
    assert "/api/v1/master/brands" in openapi["paths"]
