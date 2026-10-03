import uuid
from datetime import timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.entities.base import utc_today
from app.entities.brand import Brand
from app.entities.item import Item
from app.entities.price_list import PriceList
from app.enums.master import DeliveryWindowType


@pytest.mark.anyio
async def test_create_and_get_price_entry(
    client: AsyncClient,
    session: AsyncSession,
    superuser_token_headers: dict[str, str],
) -> None:
    # 1. Setup brand and item
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

    item = Item(
        sku="SKU-MLK-99",
        brand_id=brand.id,
        name="Test Milk",
        category="Dairy",
        unit="Crate",
        unit_weight_kg=25.0,
        unit_volume_m3=0.18,
        requires_cold_chain=True,
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)

    # 2. Create price list record as admin
    price_payload = {
        "item_id": str(item.id),
        "cost_price": 9200.0,
        "unit_price": 11500.0,
        "currency": "LKR",
        "effective_from": str(utc_today()),
        "price_change_reason": "standard_pricing",
        "is_active": True,
    }
    response = await client.post(
        "/api/v1/master/prices",
        json=price_payload,
        headers=superuser_token_headers,
    )
    assert response.status_code == 201
    created_price = response.json()
    assert created_price["item_id"] == str(item.id)
    assert created_price["cost_price"] == 9200.0
    assert created_price["unit_price"] == 11500.0
    assert created_price["currency"] == "LKR"
    price_id = created_price["id"]

    # 3. Get price by ID
    get_res = await client.get(f"/api/v1/master/prices/{price_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == price_id

    # 4. List prices filtered by item_id
    list_res = await client.get(f"/api/v1/master/prices?item_id={item.id}")
    assert list_res.status_code == 200
    prices = list_res.json()
    assert len(prices) == 1
    assert prices[0]["id"] == price_id


@pytest.mark.anyio
async def test_list_active_prices(
    client: AsyncClient,
    session: AsyncSession,
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

    item1 = Item(
        sku="SKU-ACT-01",
        brand_id=brand.id,
        name="Active Item 1",
        category="Produce",
        unit="Box",
        unit_weight_kg=10.0,
        unit_volume_m3=0.05,
    )
    item2 = Item(
        sku="SKU-FUT-02",
        brand_id=brand.id,
        name="Future Item 2",
        category="Produce",
        unit="Box",
        unit_weight_kg=5.0,
        unit_volume_m3=0.03,
    )
    session.add_all([item1, item2])
    await session.commit()
    await session.refresh(item1)
    await session.refresh(item2)

    # Price 1: Active today
    p1 = PriceList(
        item_id=item1.id,
        cost_price=4000.0,
        unit_price=5000.0,
        effective_from=utc_today() - timedelta(days=10),
        effective_to=None,
        is_active=True,
    )
    # Price 2: Future start (should NOT be active today)
    p2 = PriceList(
        item_id=item2.id,
        cost_price=2000.0,
        unit_price=3000.0,
        effective_from=utc_today() + timedelta(days=10),
        effective_to=None,
        is_active=True,
    )
    session.add_all([p1, p2])
    await session.commit()

    # Query active prices today
    res = await client.get("/api/v1/master/prices/active")
    assert res.status_code == 200
    active_prices = res.json()
    active_skus = [p["sku"] for p in active_prices]
    assert "SKU-ACT-01" in active_skus
    assert "SKU-FUT-02" not in active_skus


@pytest.mark.anyio
async def test_get_active_price_for_item_by_sku_and_uuid(
    client: AsyncClient,
    session: AsyncSession,
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

    item = Item(
        sku="SKU-TCH-MON",
        brand_id=brand.id,
        name="Tech 4K Monitor",
        category="Displays",
        unit="Box",
        unit_weight_kg=12.0,
        unit_volume_m3=0.15,
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)

    price = PriceList(
        item_id=item.id,
        cost_price=90000.0,
        unit_price=120000.0,
        currency="LKR",
        effective_from=utc_today() - timedelta(days=5),
        is_active=True,
    )
    session.add(price)
    await session.commit()

    # Query by SKU
    res_sku = await client.get("/api/v1/master/prices/items/SKU-TCH-MON/active")
    assert res_sku.status_code == 200
    assert res_sku.json()["unit_price"] == 120000.0
    assert res_sku.json()["sku"] == "SKU-TCH-MON"

    # Query by Item UUID
    res_uuid = await client.get(f"/api/v1/master/prices/items/{item.id}/active")
    assert res_uuid.status_code == 200
    assert res_uuid.json()["unit_price"] == 120000.0


@pytest.mark.anyio
async def test_update_and_delete_price_entry(
    client: AsyncClient,
    session: AsyncSession,
    superuser_token_headers: dict[str, str],
) -> None:
    brand = Brand(
        code="STYLE",
        name="Waypoint Style",
        delivery_window_type=DeliveryWindowType.STANDARD_RETAIL,
        requires_cold_chain=False,
        daily_time_budget_min=480,
    )
    session.add(brand)
    await session.commit()
    await session.refresh(brand)

    item = Item(
        sku="SKU-STY-SHT",
        brand_id=brand.id,
        name="Cotton Shirt",
        category="Apparel",
        unit="Carton",
        unit_weight_kg=8.0,
        unit_volume_m3=0.09,
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)

    # 1. Create price entry
    create_res = await client.post(
        "/api/v1/master/prices",
        json={
            "item_id": str(item.id),
            "cost_price": 15000.0,
            "unit_price": 20000.0,
            "currency": "LKR",
            "effective_from": str(utc_today()),
        },
        headers=superuser_token_headers,
    )
    assert create_res.status_code == 201
    price_id = create_res.json()["id"]

    # 2. Update price entry
    patch_res = await client.patch(
        f"/api/v1/master/prices/{price_id}",
        json={"unit_price": 22000.0, "price_change_reason": "supplier_revision"},
        headers=superuser_token_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["unit_price"] == 22000.0
    assert patch_res.json()["price_change_reason"] == "supplier_revision"

    # 3. Delete price entry
    del_res = await client.delete(
        f"/api/v1/master/prices/{price_id}",
        headers=superuser_token_headers,
    )
    assert del_res.status_code == 204

    # 4. Verify 404
    get_res = await client.get(f"/api/v1/master/prices/{price_id}")
    assert get_res.status_code == 404


@pytest.mark.anyio
async def test_create_price_invalid_item_or_dates(
    client: AsyncClient,
    session: AsyncSession,
    superuser_token_headers: dict[str, str],
) -> None:
    # Invalid item
    res_no_item = await client.post(
        "/api/v1/master/prices",
        json={
            "item_id": str(uuid.uuid4()),
            "cost_price": 100.0,
            "unit_price": 150.0,
            "effective_from": str(utc_today()),
        },
        headers=superuser_token_headers,
    )
    assert res_no_item.status_code == 400
    assert res_no_item.json()["detail"] == "ITEM_NOT_FOUND"

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

    item = Item(
        sku="SKU-DATE-TEST",
        brand_id=brand.id,
        name="Date Test Item",
        category="Test",
        unit="Nos",
        unit_weight_kg=1.0,
        unit_volume_m3=0.01,
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)

    # Invalid dates: effective_to before effective_from
    res_dates = await client.post(
        "/api/v1/master/prices",
        json={
            "item_id": str(item.id),
            "cost_price": 100.0,
            "unit_price": 150.0,
            "effective_from": str(utc_today()),
            "effective_to": str(utc_today() - timedelta(days=2)),
        },
        headers=superuser_token_headers,
    )
    assert res_dates.status_code == 400
    assert res_dates.json()["detail"] == "EFFECTIVE_TO_BEFORE_EFFECTIVE_FROM"
