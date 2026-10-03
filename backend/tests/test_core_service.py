"""
Tests for core_service.
"""

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

CORE_SERVICE_DIR = Path(__file__).resolve().parent.parent / "core_service"


@pytest.fixture
def core_app():
    saved_modules = {k: v for k, v in list(sys.modules.items()) if k == "app" or k.startswith("app.")}
    for k in list(saved_modules.keys()):
        del sys.modules[k]
    sys.path.insert(0, str(CORE_SERVICE_DIR))
    try:
        from app.main import app as _app

        yield _app
    finally:
        for k in list(sys.modules.keys()):
            if k == "app" or k.startswith("app."):
                del sys.modules[k]
        if str(CORE_SERVICE_DIR) in sys.path:
            sys.path.remove(str(CORE_SERVICE_DIR))
        sys.modules.update(saved_modules)


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
