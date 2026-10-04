from datetime import date

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed_database
from app.entities.customer_order import CustomerOrder, OrderItem


async def _first_ids(client: AsyncClient, headers: dict[str, str]) -> tuple[str, str]:
    outlets = (await client.get("/api/v1/master/outlets")).json()
    items = (await client.get("/api/v1/master/items")).json()
    return outlets[0]["id"], items[0]["id"]


@pytest.mark.asyncio
async def test_fleet_endpoints_match_frontend_shape(
    client: AsyncClient, session: AsyncSession, user_token_headers: dict[str, str]
) -> None:
    await seed_database(session)
    vehicles = (await client.get("/api/v1/fleet/vehicles", headers=user_token_headers)).json()
    assert len(vehicles) == 60
    first = vehicles[0]
    assert {"id", "vehicle_id", "reg_number", "assigned_depot_id", "weekly_fuel_quota_l", "status"} <= first.keys()

    reefers = (await client.get("/api/v1/fleet/vehicles?temp=reefer&type=van", headers=user_token_headers)).json()
    assert reefers and all(v["temp"] == "reefer" and v["type"] == "van" for v in reefers)

    drivers = (await client.get("/api/v1/fleet/drivers", headers=user_token_headers)).json()
    assert len(drivers) == 60
    assert {"license_number", "phone_number", "assigned_depot_id"} <= drivers[0].keys()

    patched = await client.patch(
        f"/api/v1/fleet/vehicles/{first['id']}",
        json={"status": "in_workshop", "assigned_driver_id": None},
        headers=user_token_headers,
    )
    assert patched.status_code == 200
    assert patched.json()["status"] == "in_workshop"
    assert patched.json()["assigned_driver_id"] is None

    created = await client.post(
        "/api/v1/fleet/vehicles",
        json={
            "reg_number": "XX-0001",
            "model_name": "Test Van",
            "type": "van",
            "temp": "ambient",
            "weight_cap_kg": 800,
            "volume_cap_m3": 4,
            "km_per_l": 9,
            "weekly_fuel_quota_l": 90,
            "assigned_depot_id": first["assigned_depot_id"],
        },
        headers=user_token_headers,
    )
    assert created.status_code == 201
    assert created.json()["vehicle_id"] == "VEH061"


@pytest.mark.asyncio
async def test_fleet_requires_authentication(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/fleet/vehicles")).status_code == 401


@pytest.mark.asyncio
async def test_order_lifecycle_and_deferrals(
    client: AsyncClient, session: AsyncSession, user_token_headers: dict[str, str]
) -> None:
    await seed_database(session)
    outlet_id, item_id = await _first_ids(client, user_token_headers)
    payload = {
        "outlet_id": outlet_id,
        "order_date": "2031-03-05",
        "idempotency_key": "key-1",
        "items": [{"item_id": item_id, "requested_qty": 4}],
    }
    created = await client.post("/api/v1/orders", json=payload, headers=user_token_headers)
    assert created.status_code == 201
    order = created.json()
    assert order["status"] == "pending"
    assert order["total_weight_kg"] > 0

    repeat = await client.post("/api/v1/orders", json=payload, headers=user_token_headers)
    assert repeat.json()["id"] == order["id"]

    detail = (await client.get(f"/api/v1/orders/{order['id']}", headers=user_token_headers)).json()
    assert len(detail["items"]) == 1
    assert detail["items"][0]["item_name"]
    assert detail["delivery_window"]

    listed = (
        await client.get("/api/v1/orders?order_date=2031-03-05&status=pending", headers=user_token_headers)
    ).json()
    assert [o["id"] for o in listed] == [order["id"]]

    deferred = await client.post(
        f"/api/v1/orders/{order['id']}/defer",
        json={"reason": "time_budget_limit", "limiting_resource": "time_budget"},
        headers=user_token_headers,
    )
    assert deferred.status_code == 201
    deferrals = (await client.get("/api/v1/deferrals", headers=user_token_headers)).json()
    assert order["id"] in [d["id"] for d in deferrals]
    summary = (await client.get("/api/v1/deferrals/summary", headers=user_token_headers)).json()
    assert summary["total_deferred_orders"] == len(deferrals)

    requeued = await client.post(f"/api/v1/deferrals/{order['id']}/re-queue", json={}, headers=user_token_headers)
    assert requeued.json() == {"success": True, "id": order["id"]}

    updated = await client.patch(
        f"/api/v1/orders/{order['id']}/status", json={"status": "allocated"}, headers=user_token_headers
    )
    assert updated.json()["status"] == "allocated"


@pytest.mark.asyncio
async def test_sync_batch_creates_orders_once(
    client: AsyncClient, session: AsyncSession, user_token_headers: dict[str, str]
) -> None:
    await seed_database(session)
    outlet_id, item_id = await _first_ids(client, user_token_headers)
    mutation = {
        "idempotency_key": "offline-1",
        "entity_type": "order",
        "action": "create",
        "payload": {
            "outlet_id": outlet_id,
            "order_date": "2031-03-06",
            "items": [{"item_id": item_id, "requested_qty": 2}],
        },
    }
    body = {"client_device_id": "device-1", "mutations": [mutation]}
    first = (await client.post("/api/v1/sync/batch", json=body, headers=user_token_headers)).json()
    second = (await client.post("/api/v1/sync/batch", json=body, headers=user_token_headers)).json()
    assert first["results"][0]["status"] == "applied"
    assert second["results"][0]["status"] == "duplicate_ignored"
    count = (
        await session.execute(
            select(func.count()).select_from(CustomerOrder).where(CustomerOrder.order_date == date(2031, 3, 6))
        )
    ).scalar()
    lines = (await session.execute(select(func.count()).select_from(OrderItem))).scalar()
    assert count == 1
    assert lines > 0
