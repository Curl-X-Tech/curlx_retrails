from datetime import date, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.entities.calendar_day import CalendarDay


@pytest.mark.anyio
async def test_create_and_get_calendar_day(
    client: AsyncClient,
    session: AsyncSession,
    superuser_token_headers: dict[str, str],
) -> None:
    test_date = date(2027, 4, 14)

    # 1. Create calendar day entry as admin
    payload = {
        "date": str(test_date),
        "festival": "Avurudu New Year",
        "festival_ramp": 1.0,
        "is_holiday": True,
        "monsoon": False,
        "is_operating": False,
    }
    create_res = await client.post(
        "/api/v1/master/calendar",
        json=payload,
        headers=superuser_token_headers,
    )
    assert create_res.status_code == 201
    created_day = create_res.json()
    assert created_day["date"] == "2027-04-14"
    assert created_day["dow"] == 2  # Wednesday
    assert created_day["dow_name"] == "Wed"
    assert created_day["iso_year"] == 2027
    assert created_day["festival"] == "Avurudu New Year"
    assert created_day["festival_ramp"] == 1.0
    assert created_day["is_holiday"] is True
    assert created_day["is_operating"] is False

    # 2. Get specific calendar day
    get_res = await client.get(f"/api/v1/master/calendar/{test_date}")
    assert get_res.status_code == 200
    assert get_res.json()["date"] == "2027-04-14"

    # 3. List calendar days with filters
    list_res = await client.get(
        f"/api/v1/master/calendar?from_date={test_date}&to_date={test_date}&festival=Avurudu%20New%20Year"
    )
    assert list_res.status_code == 200
    days = list_res.json()
    assert len(days) == 1
    assert days[0]["date"] == "2027-04-14"


@pytest.mark.anyio
async def test_upcoming_operating_days(
    client: AsyncClient,
    session: AsyncSession,
) -> None:
    start_d = date(2027, 6, 1)
    # Add 3 days: 2 operating, 1 non-operating
    d1 = CalendarDay(
        date=start_d,
        dow=1,
        dow_name="Tue",
        is_weekend=False,
        iso_year=2027,
        iso_week=22,
        is_operating=True,
    )
    d2 = CalendarDay(
        date=start_d + timedelta(days=1),
        dow=2,
        dow_name="Wed",
        is_weekend=False,
        iso_year=2027,
        iso_week=22,
        is_holiday=True,
        is_operating=False,
    )
    d3 = CalendarDay(
        date=start_d + timedelta(days=2),
        dow=3,
        dow_name="Thu",
        is_weekend=False,
        iso_year=2027,
        iso_week=22,
        is_operating=True,
    )
    session.add_all([d1, d2, d3])
    await session.commit()

    res = await client.get(f"/api/v1/master/calendar/operating-days?start_date={start_d}&days=5")
    assert res.status_code == 200
    op_days = res.json()
    dates = [d["date"] for d in op_days]
    assert "2027-06-01" in dates
    assert "2027-06-02" not in dates
    assert "2027-06-03" in dates


@pytest.mark.anyio
async def test_demand_surge_calculation(
    client: AsyncClient,
    session: AsyncSession,
) -> None:
    surge_date = date(2027, 12, 25)
    # Christmas day: festival ramp 1.0 (+40%), payday (+15%), monsoon (-5%) => 1.0 + 0.40 + 0.15 - 0.05 = 1.50
    day = CalendarDay(
        date=surge_date,
        dow=5,
        dow_name="Sat",
        is_weekend=False,
        iso_year=2027,
        iso_week=51,
        is_payday=True,
        festival="Christmas",
        festival_ramp=1.0,
        is_holiday=True,
        monsoon=True,
        is_operating=False,
    )
    session.add(day)
    await session.commit()

    res = await client.get(f"/api/v1/master/calendar/surge?from_date={surge_date}&to_date={surge_date}")
    assert res.status_code == 200
    surge_data = res.json()
    assert len(surge_data) == 1
    assert surge_data[0]["date"] == "2027-12-25"
    assert surge_data[0]["surge_multiplier"] == 1.50
    assert surge_data[0]["festival"] == "Christmas"
    assert surge_data[0]["is_payday"] is True


@pytest.mark.anyio
async def test_update_and_delete_calendar_day(
    client: AsyncClient,
    session: AsyncSession,
    superuser_token_headers: dict[str, str],
) -> None:
    target_date = date(2027, 8, 10)
    day = CalendarDay(
        date=target_date,
        dow=1,
        dow_name="Tue",
        is_weekend=False,
        iso_year=2027,
        iso_week=32,
        is_operating=True,
    )
    session.add(day)
    await session.commit()

    # 1. Update operating status
    patch_res = await client.patch(
        f"/api/v1/master/calendar/{target_date}",
        json={"is_operating": False, "festival": "Special Closure"},
        headers=superuser_token_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["is_operating"] is False
    assert patch_res.json()["festival"] == "Special Closure"

    # 2. Verify patching forbidden/immutable fields like date or iso_week fails with 422
    forbidden_patch_res = await client.patch(
        f"/api/v1/master/calendar/{target_date}",
        json={"date": "2027-08-11"},
        headers=superuser_token_headers,
    )
    assert forbidden_patch_res.status_code == 422

    # 3. Delete calendar day
    del_res = await client.delete(
        f"/api/v1/master/calendar/{target_date}",
        headers=superuser_token_headers,
    )
    assert del_res.status_code == 204

    # 4. Verify 404
    get_res = await client.get(f"/api/v1/master/calendar/{target_date}")
    assert get_res.status_code == 404


@pytest.mark.anyio
async def test_calendar_admin_authorization(
    client: AsyncClient,
) -> None:
    test_date = date(2027, 9, 15)

    # Anonymous user cannot create
    create_res = await client.post(
        "/api/v1/master/calendar",
        json={"date": str(test_date)},
    )
    assert create_res.status_code == 401


@pytest.mark.anyio
async def test_bulk_generate_skips_existing_days(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    payload = {"from_date": "2026-10-03", "to_date": "2026-10-05"}
    first = await client.post("/api/v1/master/calendar/bulk-generate", json=payload, headers=superuser_token_headers)
    assert first.status_code == 201
    assert [d["date"] for d in first.json()] == ["2026-10-03", "2026-10-04", "2026-10-05"]
    assert [d["is_operating"] for d in first.json()] == [True, False, True]

    second = await client.post("/api/v1/master/calendar/bulk-generate", json=payload, headers=superuser_token_headers)
    assert second.status_code == 201
    assert second.json() == []

    invalid = {"from_date": "2026-10-05", "to_date": "2026-10-03"}
    bad = await client.post("/api/v1/master/calendar/bulk-generate", json=invalid, headers=superuser_token_headers)
    assert bad.status_code == 422
