import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.entities.brand import Brand
from app.entities.item import Item
from app.enums.master import DeliveryWindowType


@pytest.mark.anyio
async def test_create_and_get_item(
    client: AsyncClient,
    session: AsyncSession,
    superuser_token_headers: dict[str, str],
) -> None:
    # 1. Setup brand
    brand = Brand(
        code="FRESH",
        name="Waypoint Fresh",
        delivery_window_type=DeliveryWindowType.MORNING_STRICT,
        requires_cold_chain=True,
        daily_time_budget_min=270,
    )
    session.add(brand)
    await session.commit()
    await session.refresh(brand)

    # 2. Create item as admin
    item_payload = {
        "sku": "SKU-MLK-01",
        "brand_id": str(brand.id),
        "name": "Farm Fresh Chilled Full Cream Milk (1L x 24)",
        "category": "Dairy & Chilled",
        "unit": "Crate",
        "unit_weight_kg": 25.5,
        "unit_volume_m3": 0.18,
        "requires_cold_chain": True,
        "special_handling_code": "COL",
    }
    response = await client.post(
        "/api/v1/master/items",
        json=item_payload,
        headers=superuser_token_headers,
    )
    assert response.status_code == 201
    created_item = response.json()
    assert created_item["sku"] == "SKU-MLK-01"
    assert created_item["unit_weight_kg"] == 25.5
    assert created_item["unit_volume_m3"] == 0.18
    assert created_item["requires_cold_chain"] is True
    assert created_item["special_handling_code"] == "COL"
    item_id = created_item["id"]

    # 3. Get item by UUID
    res_by_uuid = await client.get(f"/api/v1/master/items/{item_id}")
    assert res_by_uuid.status_code == 200
    assert res_by_uuid.json()["sku"] == "SKU-MLK-01"

    # 4. Get item by SKU string
    res_by_sku = await client.get("/api/v1/master/items/SKU-MLK-01")
    assert res_by_sku.status_code == 200
    assert res_by_sku.json()["id"] == item_id

    # 5. List items
    res_list = await client.get("/api/v1/master/items")
    assert res_list.status_code == 200
    items = res_list.json()
    assert len(items) >= 1
    assert any(i["sku"] == "SKU-MLK-01" for i in items)


@pytest.mark.anyio
async def test_filter_items(
    client: AsyncClient,
    session: AsyncSession,
) -> None:
    b1 = Brand(
        code="FRESH",
        name="Waypoint Fresh",
        delivery_window_type=DeliveryWindowType.MORNING_STRICT,
        requires_cold_chain=True,
        daily_time_budget_min=270,
    )
    b2 = Brand(
        code="STYLE",
        name="Waypoint Style",
        delivery_window_type=DeliveryWindowType.STANDARD_RETAIL,
        requires_cold_chain=False,
        daily_time_budget_min=480,
    )
    session.add_all([b1, b2])
    await session.commit()
    await session.refresh(b1)
    await session.refresh(b2)

    item1 = Item(
        sku="SKU-COLD-01",
        brand_id=b1.id,
        name="Cold Item",
        category="Dairy",
        unit="Crate",
        unit_weight_kg=10.0,
        unit_volume_m3=0.05,
        requires_cold_chain=True,
        special_handling_code="COL",
    )
    item2 = Item(
        sku="SKU-DRY-02",
        brand_id=b2.id,
        name="Dry Apparel",
        category="Apparel",
        unit="Carton",
        unit_weight_kg=5.0,
        unit_volume_m3=0.08,
        requires_cold_chain=False,
        special_handling_code="MAL",
    )
    session.add_all([item1, item2])
    await session.commit()

    # Filter by category
    res_cat = await client.get("/api/v1/master/items?category=Dairy")
    assert res_cat.status_code == 200
    cat_items = res_cat.json()
    assert len(cat_items) == 1
    assert cat_items[0]["sku"] == "SKU-COLD-01"

    # Filter by cold chain requirement
    res_cold = await client.get("/api/v1/master/items?requires_cold_chain=true")
    assert res_cold.status_code == 200
    cold_skus = [i["sku"] for i in res_cold.json()]
    assert "SKU-COLD-01" in cold_skus
    assert "SKU-DRY-02" not in cold_skus

    # Filter by special handling code
    res_mal = await client.get("/api/v1/master/items?special_handling_code=MAL")
    assert res_mal.status_code == 200
    mal_items = res_mal.json()
    assert len(mal_items) == 1
    assert mal_items[0]["sku"] == "SKU-DRY-02"


@pytest.mark.anyio
async def test_create_item_duplicate_sku(
    client: AsyncClient,
    session: AsyncSession,
    superuser_token_headers: dict[str, str],
) -> None:
    brand = Brand(
        code="FRESH",
        name="Waypoint Fresh",
        delivery_window_type=DeliveryWindowType.MORNING_STRICT,
        requires_cold_chain=True,
        daily_time_budget_min=270,
    )
    session.add(brand)
    await session.commit()
    await session.refresh(brand)

    payload = {
        "sku": "SKU-DUP-01",
        "brand_id": str(brand.id),
        "name": "Duplicate Test",
        "category": "Test",
        "unit": "Nos",
        "unit_weight_kg": 1.0,
        "unit_volume_m3": 0.01,
        "requires_cold_chain": False,
    }
    res1 = await client.post(
        "/api/v1/master/items",
        json=payload,
        headers=superuser_token_headers,
    )
    assert res1.status_code == 201

    res2 = await client.post(
        "/api/v1/master/items",
        json=payload,
        headers=superuser_token_headers,
    )
    assert res2.status_code == 400
    assert res2.json()["detail"] == "ITEM_SKU_ALREADY_EXISTS"


@pytest.mark.anyio
async def test_create_item_invalid_brand(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    payload = {
        "sku": "SKU-NO-BRAND",
        "brand_id": str(uuid.uuid4()),
        "name": "No Brand Item",
        "category": "Test",
        "unit": "Nos",
        "unit_weight_kg": 1.0,
        "unit_volume_m3": 0.01,
        "requires_cold_chain": False,
    }
    res = await client.post(
        "/api/v1/master/items",
        json=payload,
        headers=superuser_token_headers,
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "BRAND_NOT_FOUND"


@pytest.mark.anyio
async def test_update_and_delete_item(
    client: AsyncClient,
    session: AsyncSession,
    superuser_token_headers: dict[str, str],
) -> None:
    brand = Brand(
        code="TECH",
        name="Waypoint Tech",
        delivery_window_type=DeliveryWindowType.MALL_BAY_RESTRICTED,
        requires_cold_chain=False,
        daily_time_budget_min=480,
    )
    session.add(brand)
    await session.commit()
    await session.refresh(brand)

    # 1. Create item
    create_res = await client.post(
        "/api/v1/master/items",
        json={
            "sku": "SKU-TCH-UPD",
            "brand_id": str(brand.id),
            "name": "Item To Update",
            "category": "Displays",
            "unit": "Box",
            "unit_weight_kg": 8.0,
            "unit_volume_m3": 0.1,
            "requires_cold_chain": False,
        },
        headers=superuser_token_headers,
    )
    assert create_res.status_code == 201
    item_id = create_res.json()["id"]

    # 2. Update item
    patch_res = await client.patch(
        f"/api/v1/master/items/{item_id}",
        json={"name": "Updated Monitor 4K", "unit_weight_kg": 9.5},
        headers=superuser_token_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Updated Monitor 4K"
    assert patch_res.json()["unit_weight_kg"] == 9.5

    # 3. Delete item by SKU string
    del_res = await client.delete(
        "/api/v1/master/items/SKU-TCH-UPD",
        headers=superuser_token_headers,
    )
    assert del_res.status_code == 204

    # 4. Verify 404
    get_res = await client.get(f"/api/v1/master/items/{item_id}")
    assert get_res.status_code == 404


@pytest.mark.anyio
async def test_get_nonexistent_item(
    client: AsyncClient,
) -> None:
    res = await client.get("/api/v1/master/items/NONEXISTENT_SKU")
    assert res.status_code == 404
    assert res.json()["detail"] == "ITEM_NOT_FOUND"
