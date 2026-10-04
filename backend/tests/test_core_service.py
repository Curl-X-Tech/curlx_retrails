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
    assert "/api/v1/orders" in openapi_paths
    assert "/api/v1/orders/{id}" in openapi_paths
    assert "/api/v1/orders/{id}/status" in openapi_paths

    # Verify fleet & drivers endpoints
    assert "/api/v1/fleet/vehicles" in openapi_paths
    assert "/api/v1/fleet/drivers" in openapi_paths

    # Verify allocations & operations endpoints
    assert "/api/v1/allocations" in openapi_paths
    assert "/api/v1/loader/bays" in openapi_paths
    assert "/api/v1/driver/routes/current" in openapi_paths
    assert "/api/v1/sync/batch" in openapi_paths

    # Verify legacy microservice prefixes are not in openapi schema
    assert "/orders/v1/orders" not in openapi_paths
    assert "/routes/v1/routes" not in openapi_paths
    assert "/vehicles/v1/vehicles" not in openapi_paths
    assert "/dispatch/v1/trips" not in openapi_paths

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


def test_core_service_openapi_schema(core_app):
    openapi = core_app.openapi()
    assert openapi["info"]["title"] == "Waypoint — Core Service"
    assert "/api/v1/orders" in openapi["paths"]
    assert "/api/v1/fleet/vehicles" in openapi["paths"]
    assert "/api/v1/auth/jwt/login" in openapi["paths"]
    assert "/api/v1/master/brands" in openapi["paths"]
