import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.entities.brand import Brand
from app.enums.master import DeliveryWindowType


@pytest.mark.anyio
async def test_create_and_get_brand(
    client: AsyncClient,
    session: AsyncSession,
    superuser_token_headers: dict[str, str],
) -> None:
    # 1. Create a brand as admin
    brand_payload = {
        "code": "FRESH",
        "name": "Waypoint Fresh",
        "delivery_window_type": "morning_strict",
        "requires_cold_chain": True,
        "daily_time_budget_min": 270,
    }
    response = await client.post(
        "/api/v1/master/brands",
        json=brand_payload,
        headers=superuser_token_headers,
    )
    assert response.status_code == 201
    created_brand = response.json()
    assert created_brand["code"] == "FRESH"
    assert created_brand["name"] == "Waypoint Fresh"
    assert created_brand["delivery_window_type"] == "morning_strict"
    assert created_brand["requires_cold_chain"] is True
    assert created_brand["daily_time_budget_min"] == 270
    brand_id = created_brand["id"]

    # 2. Get brand by ID
    get_res = await client.get(f"/api/v1/master/brands/{brand_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Waypoint Fresh"

    # 3. List brands
    list_res = await client.get("/api/v1/master/brands")
    assert list_res.status_code == 200
    brands = list_res.json()
    assert any(b["code"] == "FRESH" for b in brands)


@pytest.mark.anyio
async def test_filter_brands_by_cold_chain(
    client: AsyncClient,
    session: AsyncSession,
) -> None:
    b1 = Brand(
        code="FRESH",
        name="Fresh Brand",
        delivery_window_type=DeliveryWindowType.MORNING_STRICT,
        requires_cold_chain=True,
        daily_time_budget_min=270,
    )
    b2 = Brand(
        code="STYLE",
        name="Style Brand",
        delivery_window_type=DeliveryWindowType.STANDARD_RETAIL,
        requires_cold_chain=False,
        daily_time_budget_min=480,
    )
    session.add_all([b1, b2])
    await session.commit()

    # Cold chain = True
    res_cold = await client.get("/api/v1/master/brands?requires_cold_chain=true")
    assert res_cold.status_code == 200
    cold_codes = [b["code"] for b in res_cold.json()]
    assert "FRESH" in cold_codes
    assert "STYLE" not in cold_codes

    # Cold chain = False
    res_ambient = await client.get("/api/v1/master/brands?requires_cold_chain=false")
    assert res_ambient.status_code == 200
    ambient_codes = [b["code"] for b in res_ambient.json()]
    assert "STYLE" in ambient_codes
    assert "FRESH" not in ambient_codes


@pytest.mark.anyio
async def test_create_brand_duplicate_code(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    payload = {
        "code": "TECH",
        "name": "Waypoint Tech",
        "delivery_window_type": "mall_bay_restricted",
        "requires_cold_chain": False,
        "daily_time_budget_min": 480,
    }
    res1 = await client.post(
        "/api/v1/master/brands",
        json=payload,
        headers=superuser_token_headers,
    )
    assert res1.status_code == 201

    res2 = await client.post(
        "/api/v1/master/brands",
        json=payload,
        headers=superuser_token_headers,
    )
    assert res2.status_code == 400
    assert res2.json()["detail"] == "BRAND_CODE_ALREADY_EXISTS"


@pytest.mark.anyio
async def test_get_nonexistent_brand(
    client: AsyncClient,
) -> None:
    random_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/master/brands/{random_id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "BRAND_NOT_FOUND"


@pytest.mark.anyio
async def test_update_and_delete_brand(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    # 1. Create brand
    create_res = await client.post(
        "/api/v1/master/brands",
        json={
            "code": "TO_UPD",
            "name": "To Update Brand",
            "delivery_window_type": "standard_retail",
            "requires_cold_chain": False,
            "daily_time_budget_min": 300,
        },
        headers=superuser_token_headers,
    )
    assert create_res.status_code == 201
    brand_id = create_res.json()["id"]

    # 2. Update brand
    patch_res = await client.patch(
        f"/api/v1/master/brands/{brand_id}",
        json={"name": "Updated Brand Name", "daily_time_budget_min": 360},
        headers=superuser_token_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Updated Brand Name"
    assert patch_res.json()["daily_time_budget_min"] == 360

    # 3. Delete brand
    del_res = await client.delete(
        f"/api/v1/master/brands/{brand_id}",
        headers=superuser_token_headers,
    )
    assert del_res.status_code == 204

    # 4. Verify 404
    get_res = await client.get(f"/api/v1/master/brands/{brand_id}")
    assert get_res.status_code == 404
