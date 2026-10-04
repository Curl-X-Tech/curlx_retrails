from datetime import timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import sl_today
from app.db.seed import seed_database
from app.entities.staff_profile import StaffProfile
from app.entities.trip import Trip
from app.entities.user import User


@pytest.mark.asyncio
async def test_allocation_reads_and_loader_flow(
    client: AsyncClient, session: AsyncSession, user_token_headers: dict[str, str]
) -> None:
    await seed_database(session)
    allocations = (
        await client.get(
            f"/api/v1/allocations?dispatch_date={sl_today() + timedelta(days=1)}", headers=user_token_headers
        )
    ).json()
    assert allocations
    assert {"weight_utilization_pct", "cargo_value_lkr", "driver_name"} <= allocations[0].keys()

    kpis = (
        await client.get(
            f"/api/v1/allocations/summary?dispatch_date={sl_today() + timedelta(days=1)}", headers=user_token_headers
        )
    ).json()
    assert kpis["total_trips"] == len(allocations)

    loading = next(a for a in allocations if a["status"] == "loading")
    detail = (await client.get(f"/api/v1/allocations/{loading['id']}", headers=user_token_headers)).json()
    assert detail["legs"] and detail["summary"]["total_packages"] > 0

    bays = (await client.get("/api/v1/loader/bays", headers=user_token_headers)).json()
    assert any(b["trip"]["id"] == loading["id"] for b in bays)

    checklist = (await client.get(f"/api/v1/loader/trips/{loading['id']}/checklist", headers=user_token_headers)).json()
    assert checklist["summary"]["total_items"] > 0
    assert (await client.get("/api/v1/allocations/engine/status", headers=user_token_headers)).status_code == 200
    assert (await client.get("/api/v1/fleet/telemetry/live", headers=user_token_headers)).json()


@pytest.mark.asyncio
async def test_driver_delivery_flow(
    client: AsyncClient,
    session: AsyncSession,
    user_token_headers: dict[str, str],
    driver_token_headers: dict[str, str],
    test_driver: User,
) -> None:
    await seed_database(session)
    trip = (await session.execute(select(Trip).where(Trip.status == "loading").limit(1))).scalar_one()
    staff = await session.get(StaffProfile, trip.driver_id)
    staff.user_id = test_driver.id
    trip.status = "dispatched"
    await session.commit()

    route = (await client.get("/api/v1/driver/routes/current", headers=driver_token_headers)).json()
    waypoint = route["waypoints"][0]
    arrive = await client.post(
        f"/api/v1/deliveries/{waypoint['id']}/arrive",
        json={"arrived_at": "2026-01-01T06:00:00Z"},
        headers=driver_token_headers,
    )
    assert arrive.json()["status"] == "arrived"

    item = waypoint["order_summary"]["items"][0]
    pod = await client.post(
        f"/api/v1/deliveries/{waypoint['id']}/pod",
        json={
            "recipient_name": "Manager",
            "signature_data_url": "data:image/svg+xml;base64,AAAA",
            "arrived_at": "2026-01-01T06:00:00Z",
            "completed_at": "2026-01-01T06:10:00Z",
            "discrepancies": [{"item_id": item["id"], "issue_type": "missing_crate", "reported_qty": 1}],
        },
        headers=driver_token_headers,
    )
    assert pod.status_code == 200

    ping = await client.post(
        "/api/v1/fleet/telemetry/report",
        json={
            "vehicle_id": str(trip.vehicle_id),
            "trip_id": str(trip.id),
            "latitude": 6.9,
            "longitude": 79.9,
            "speed_kmh": 30,
        },
        headers=driver_token_headers,
    )
    assert ping.status_code == 201
    latest = await client.get(f"/api/v1/fleet/vehicles/{trip.vehicle_id}/telemetry/latest", headers=user_token_headers)
    assert latest.json()["speed_kmh"] == 30


@pytest.mark.asyncio
async def test_optimize_and_refresh(
    client: AsyncClient, session: AsyncSession, user_token_headers: dict[str, str]
) -> None:
    await seed_database(session)
    depot = (await client.get("/api/v1/master/depots")).json()[0]
    result = await client.post(
        "/api/v1/allocations/optimize",
        json={"operating_date": "2026-01-01", "depot_id": depot["id"]},
        headers=user_token_headers,
    )
    assert result.status_code == 200
    assert "proposed_trips" in result.json()

    token = user_token_headers["Authorization"].split(" ", 1)[1]
    refreshed = await client.post("/api/v1/auth/refresh", headers={"Authorization": f"Bearer {token}"})
    assert refreshed.status_code == 200 and refreshed.json()["access_token"]
    assert (await client.post("/api/v1/auth/refresh")).status_code == 401
