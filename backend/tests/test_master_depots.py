import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.entities.depot import Depot


@pytest.mark.anyio
async def test_create_and_get_depot(
    client: AsyncClient,
    session: AsyncSession,
    superuser_token_headers: dict[str, str],
) -> None:
    # 1. Create a depot as admin
    depot_payload = {
        "code": "PEL",
        "name": "Peliyagoda Central DC",
        "latitude": 6.9649,
        "longitude": 79.8872,
        "address": "Peliyagoda Distribution Center, Western Province",
        "is_active": True,
    }
    response = await client.post(
        "/api/v1/master/depots",
        json=depot_payload,
        headers=superuser_token_headers,
    )
    assert response.status_code == 201
    created_depot = response.json()
    assert created_depot["code"] == "PEL"
    assert created_depot["name"] == "Peliyagoda Central DC"
    depot_id = created_depot["id"]

    # 2. Get depot by ID
    get_res = await client.get(f"/api/v1/master/depots/{depot_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == depot_id
    assert get_res.json()["latitude"] == 6.9649

    # 3. List depots
    list_res = await client.get("/api/v1/master/depots")
    assert list_res.status_code == 200
    depots = list_res.json()
    assert len(depots) >= 1
    assert any(d["code"] == "PEL" for d in depots)


@pytest.mark.anyio
async def test_create_depot_duplicate_code(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    depot_payload = {
        "code": "KDY",
        "name": "Kandy Regional Hub",
        "latitude": 7.2906,
        "longitude": 80.6337,
        "address": "Kandy Logistics Hub",
        "is_active": True,
    }
    # First creation
    res1 = await client.post(
        "/api/v1/master/depots",
        json=depot_payload,
        headers=superuser_token_headers,
    )
    assert res1.status_code == 201

    # Duplicate code creation
    res2 = await client.post(
        "/api/v1/master/depots",
        json=depot_payload,
        headers=superuser_token_headers,
    )
    assert res2.status_code == 400
    assert res2.json()["detail"] == "DEPOT_CODE_ALREADY_EXISTS"


@pytest.mark.anyio
async def test_create_depot_unauthorized_for_non_admin(
    client: AsyncClient,
    user_token_headers: dict[str, str],
) -> None:
    depot_payload = {
        "code": "TEST",
        "name": "Test Depot",
        "latitude": 6.9,
        "longitude": 79.9,
        "is_active": True,
    }
    response = await client.post(
        "/api/v1/master/depots",
        json=depot_payload,
        headers=user_token_headers,
    )
    assert response.status_code == 403


@pytest.mark.anyio
async def test_get_nonexistent_depot(
    client: AsyncClient,
) -> None:
    random_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/master/depots/{random_id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "DEPOT_NOT_FOUND"


@pytest.mark.anyio
async def test_list_depots_filter_active(
    client: AsyncClient,
    session: AsyncSession,
) -> None:
    d1 = Depot(
        code="ACT",
        name="Active Depot",
        latitude=6.0,
        longitude=79.0,
        is_active=True,
    )
    d2 = Depot(
        code="INACT",
        name="Inactive Depot",
        latitude=7.0,
        longitude=80.0,
        is_active=False,
    )
    session.add_all([d1, d2])
    await session.commit()

    # Filter active = True
    res_active = await client.get("/api/v1/master/depots?is_active=true")
    assert res_active.status_code == 200
    active_codes = [d["code"] for d in res_active.json()]
    assert "ACT" in active_codes
    assert "INACT" not in active_codes

    # Filter active = False
    res_inactive = await client.get("/api/v1/master/depots?is_active=false")
    assert res_inactive.status_code == 200
    inactive_codes = [d["code"] for d in res_inactive.json()]
    assert "INACT" in inactive_codes
    assert "ACT" not in inactive_codes


@pytest.mark.anyio
async def test_update_and_delete_depot(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    # 1. Create a depot
    create_res = await client.post(
        "/api/v1/master/depots",
        json={"code": "UPD", "name": "To Update", "latitude": 6.5, "longitude": 79.5},
        headers=superuser_token_headers,
    )
    assert create_res.status_code == 201
    depot_id = create_res.json()["id"]

    # 2. Update depot
    patch_res = await client.patch(
        f"/api/v1/master/depots/{depot_id}",
        json={"name": "Updated Depot Name", "is_active": False},
        headers=superuser_token_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Updated Depot Name"
    assert patch_res.json()["is_active"] is False

    # 3. Delete depot
    del_res = await client.delete(
        f"/api/v1/master/depots/{depot_id}",
        headers=superuser_token_headers,
    )
    assert del_res.status_code == 204

    # 4. Verify deleted
    get_res = await client.get(f"/api/v1/master/depots/{depot_id}")
    assert get_res.status_code == 404
