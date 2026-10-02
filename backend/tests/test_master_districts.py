import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.entities.depot import Depot
from app.entities.district import District


@pytest.mark.anyio
async def test_create_and_get_district(
    client: AsyncClient,
    session: AsyncSession,
    superuser_token_headers: dict[str, str],
) -> None:
    # 1. Create a Depot first
    depot = Depot(
        code="PEL",
        name="Peliyagoda DC",
        latitude=6.9649,
        longitude=79.8872,
    )
    session.add(depot)
    await session.commit()
    await session.refresh(depot)

    # 2. Create District as admin
    district_payload = {
        "name": "Colombo",
        "province": "Western",
        "assigned_depot_id": str(depot.id),
    }
    response = await client.post(
        "/api/v1/master/districts",
        json=district_payload,
        headers=superuser_token_headers,
    )
    assert response.status_code == 201
    created_dist = response.json()
    assert created_dist["name"] == "Colombo"
    assert created_dist["province"] == "Western"
    assert created_dist["assigned_depot_id"] == str(depot.id)
    district_id = created_dist["id"]

    # 3. Get District by ID
    get_res = await client.get(f"/api/v1/master/districts/{district_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Colombo"

    # 4. List Districts
    list_res = await client.get("/api/v1/master/districts")
    assert list_res.status_code == 200
    districts = list_res.json()
    assert any(d["name"] == "Colombo" for d in districts)


@pytest.mark.anyio
async def test_filter_districts_by_province_and_depot(
    client: AsyncClient,
    session: AsyncSession,
) -> None:
    d1 = Depot(
        code="PEL",
        name="Peliyagoda DC",
        latitude=6.9649,
        longitude=79.8872,
    )
    d2 = Depot(
        code="KDY",
        name="Kandy Regional Hub",
        latitude=7.2906,
        longitude=80.6337,
    )
    session.add_all([d1, d2])
    await session.commit()
    await session.refresh(d1)
    await session.refresh(d2)

    dist_colombo = District(
        name="Colombo",
        province="Western",
        assigned_depot_id=d1.id,
    )
    dist_kandy = District(
        name="Kandy",
        province="Central",
        assigned_depot_id=d2.id,
    )
    session.add_all([dist_colombo, dist_kandy])
    await session.commit()

    # Filter by Western province
    res_west = await client.get("/api/v1/master/districts?province=Western")
    assert res_west.status_code == 200
    west_names = [d["name"] for d in res_west.json()]
    assert "Colombo" in west_names
    assert "Kandy" not in west_names

    # Filter by Depot ID
    res_kdy = await client.get(f"/api/v1/master/districts?depot_id={d2.id}")
    assert res_kdy.status_code == 200
    kdy_names = [d["name"] for d in res_kdy.json()]
    assert "Kandy" in kdy_names
    assert "Colombo" not in kdy_names


@pytest.mark.anyio
async def test_create_district_invalid_depot(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    district_payload = {
        "name": "Matale",
        "province": "Central",
        "assigned_depot_id": str(uuid.uuid4()),
    }
    response = await client.post(
        "/api/v1/master/districts",
        json=district_payload,
        headers=superuser_token_headers,
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "ASSIGNED_DEPOT_NOT_FOUND"


@pytest.mark.anyio
async def test_get_nonexistent_district(
    client: AsyncClient,
) -> None:
    random_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/master/districts/{random_id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "DISTRICT_NOT_FOUND"


@pytest.mark.anyio
async def test_update_and_delete_district(
    client: AsyncClient,
    session: AsyncSession,
    superuser_token_headers: dict[str, str],
) -> None:
    depot = Depot(
        code="DEP_DIST",
        name="Depot for District",
        latitude=6.9,
        longitude=79.9,
    )
    session.add(depot)
    await session.commit()
    await session.refresh(depot)

    # 1. Create district
    create_res = await client.post(
        "/api/v1/master/districts",
        json={
            "name": "Temp District",
            "province": "Western",
            "assigned_depot_id": str(depot.id),
        },
        headers=superuser_token_headers,
    )
    assert create_res.status_code == 201
    dist_id = create_res.json()["id"]

    # 2. Update district
    patch_res = await client.patch(
        f"/api/v1/master/districts/{dist_id}",
        json={"name": "Updated District Name"},
        headers=superuser_token_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Updated District Name"

    # 3. Delete district
    del_res = await client.delete(
        f"/api/v1/master/districts/{dist_id}",
        headers=superuser_token_headers,
    )
    assert del_res.status_code == 204

    # 4. Verify 404
    get_res = await client.get(f"/api/v1/master/districts/{dist_id}")
    assert get_res.status_code == 404
