from datetime import time

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.entities.brand import Brand
from app.entities.depot import Depot
from app.entities.district import District
from app.entities.outlet import Outlet
from app.enums.master import DeliveryWindowType, DockType, ParkingConstraint


@pytest.mark.anyio
async def test_create_and_get_outlet(
    client: AsyncClient,
    session: AsyncSession,
    superuser_token_headers: dict[str, str],
) -> None:
    # 1. Setup master references
    depot = Depot(
        code="PEL",
        name="Peliyagoda DC",
        latitude=6.9649,
        longitude=79.8872,
    )
    brand = Brand(
        code="FRESH",
        name="Waypoint Fresh",
        delivery_window_type=DeliveryWindowType.MORNING_STRICT,
        requires_cold_chain=True,
        daily_time_budget_min=270,
    )
    session.add_all([depot, brand])
    await session.commit()
    await session.refresh(depot)
    await session.refresh(brand)

    district = District(
        name="Colombo",
        province="Western",
        assigned_depot_id=depot.id,
    )
    session.add(district)
    await session.commit()
    await session.refresh(district)

    # 2. Create Outlet as Admin
    outlet_payload = {
        "outlet_id": "OUT001",
        "name": "Waypoint Fresh - Pettah Central",
        "brand_id": str(brand.id),
        "district_id": str(district.id),
        "depot_id": str(depot.id),
        "dock_type": "street",
        "parking_constraint": "van_only",
        "window_open_time": "05:00:00",
        "window_close_time": "07:30:00",
        "latitude": 6.9355,
        "longitude": 79.8533,
        "contact_phone": "+94 11 234 5678",
        "is_active": True,
    }
    response = await client.post(
        "/api/v1/master/outlets",
        json=outlet_payload,
        headers=superuser_token_headers,
    )
    assert response.status_code == 201
    created_outlet = response.json()
    assert created_outlet["outlet_id"] == "OUT001"
    assert created_outlet["dock_type"] == "street"
    assert created_outlet["parking_constraint"] == "van_only"
    assert created_outlet["window_open_time"] == "05:00:00"
    assert created_outlet["window_close_time"] == "07:30:00"
    outlet_uuid = created_outlet["id"]

    # 3. Get outlet by UUID
    res_by_uuid = await client.get(f"/api/v1/master/outlets/{outlet_uuid}")
    assert res_by_uuid.status_code == 200
    assert res_by_uuid.json()["outlet_id"] == "OUT001"

    # 4. Get outlet by code (e.g. OUT001)
    res_by_code = await client.get("/api/v1/master/outlets/OUT001")
    assert res_by_code.status_code == 200
    assert res_by_code.json()["id"] == outlet_uuid

    # 5. List outlets
    res_list = await client.get("/api/v1/master/outlets")
    assert res_list.status_code == 200
    outlets = res_list.json()
    assert len(outlets) >= 1
    assert any(o["outlet_id"] == "OUT001" for o in outlets)


@pytest.mark.anyio
async def test_filter_outlets(
    client: AsyncClient,
    session: AsyncSession,
) -> None:
    depot = Depot(
        code="PEL",
        name="Peliyagoda DC",
        latitude=6.9649,
        longitude=79.8872,
    )
    b_fresh = Brand(
        code="FRESH",
        name="Waypoint Fresh",
        delivery_window_type=DeliveryWindowType.MORNING_STRICT,
        requires_cold_chain=True,
        daily_time_budget_min=270,
    )
    b_style = Brand(
        code="STYLE",
        name="Waypoint Style",
        delivery_window_type=DeliveryWindowType.STANDARD_RETAIL,
        requires_cold_chain=False,
        daily_time_budget_min=480,
    )
    session.add_all([depot, b_fresh, b_style])
    await session.commit()
    await session.refresh(depot)
    await session.refresh(b_fresh)
    await session.refresh(b_style)

    district = District(
        name="Colombo",
        province="Western",
        assigned_depot_id=depot.id,
    )
    session.add(district)
    await session.commit()
    await session.refresh(district)

    o1 = Outlet(
        outlet_id="OUT001",
        name="Fresh Store",
        brand_id=b_fresh.id,
        district_id=district.id,
        depot_id=depot.id,
        dock_type=DockType.STREET,
        parking_constraint=ParkingConstraint.VAN_ONLY,
        window_open_time=time(5, 0),
        window_close_time=time(7, 30),
    )
    o2 = Outlet(
        outlet_id="OUT015",
        name="Style Mall Store",
        brand_id=b_style.id,
        district_id=district.id,
        depot_id=depot.id,
        dock_type=DockType.MALL_BAY,
        parking_constraint=ParkingConstraint.MALL_DOCK,
        mall_window="09:00-11:00",
        window_open_time=time(9, 0),
        window_close_time=time(11, 0),
    )
    session.add_all([o1, o2])
    await session.commit()

    # Filter by dock_type=mall_bay
    res_mall = await client.get("/api/v1/master/outlets?dock_type=mall_bay")
    assert res_mall.status_code == 200
    mall_outlets = res_mall.json()
    assert len(mall_outlets) == 1
    assert mall_outlets[0]["outlet_id"] == "OUT015"

    # Filter by parking_constraint=van_only
    res_van = await client.get("/api/v1/master/outlets?parking_constraint=van_only")
    assert res_van.status_code == 200
    van_outlets = res_van.json()
    assert len(van_outlets) == 1
    assert van_outlets[0]["outlet_id"] == "OUT001"


@pytest.mark.anyio
async def test_get_nonexistent_outlet(
    client: AsyncClient,
) -> None:
    response = await client.get("/api/v1/master/outlets/NONEXISTENT")
    assert response.status_code == 404
    assert response.json()["detail"] == "OUTLET_NOT_FOUND"


@pytest.mark.anyio
async def test_update_and_delete_outlet(
    client: AsyncClient,
    session: AsyncSession,
    superuser_token_headers: dict[str, str],
) -> None:
    depot = Depot(
        code="DEP_OUT",
        name="Depot for Outlet",
        latitude=6.9,
        longitude=79.9,
    )
    brand = Brand(
        code="BR_OUT",
        name="Brand for Outlet",
        delivery_window_type=DeliveryWindowType.STANDARD_RETAIL,
        requires_cold_chain=False,
        daily_time_budget_min=480,
    )
    session.add_all([depot, brand])
    await session.commit()
    await session.refresh(depot)
    await session.refresh(brand)

    district = District(
        name="Dist for Outlet",
        province="Western",
        assigned_depot_id=depot.id,
    )
    session.add(district)
    await session.commit()
    await session.refresh(district)

    # 1. Create outlet
    create_res = await client.post(
        "/api/v1/master/outlets",
        json={
            "outlet_id": "OUT_UPD",
            "name": "Outlet To Update",
            "brand_id": str(brand.id),
            "district_id": str(district.id),
            "depot_id": str(depot.id),
            "dock_type": "rear_dock",
            "parking_constraint": "normal",
            "window_open_time": "08:00:00",
            "window_close_time": "12:00:00",
        },
        headers=superuser_token_headers,
    )
    assert create_res.status_code == 201
    outlet_id = create_res.json()["id"]

    # 2. Update outlet
    patch_res = await client.patch(
        f"/api/v1/master/outlets/{outlet_id}",
        json={"name": "Updated Outlet Name", "parking_constraint": "van_only"},
        headers=superuser_token_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Updated Outlet Name"
    assert patch_res.json()["parking_constraint"] == "van_only"

    # 3. Delete outlet by outlet_id code
    del_res = await client.delete(
        "/api/v1/master/outlets/OUT_UPD",
        headers=superuser_token_headers,
    )
    assert del_res.status_code == 204

    # 4. Verify 404
    get_res = await client.get(f"/api/v1/master/outlets/{outlet_id}")
    assert get_res.status_code == 404


@pytest.mark.anyio
async def test_outlet_windows_and_pagination(
    client: AsyncClient,
    session: AsyncSession,
) -> None:
    depot = Depot(code="PEL", name="Peliyagoda DC", latitude=6.9649, longitude=79.8872)
    brand = Brand(
        code="STYLE",
        name="Waypoint Style",
        delivery_window_type=DeliveryWindowType.MALL_BAY_RESTRICTED,
        requires_cold_chain=False,
        daily_time_budget_min=480,
    )
    session.add_all([depot, brand])
    await session.commit()
    await session.refresh(depot)
    await session.refresh(brand)

    district = District(name="Colombo", province="Western", assigned_depot_id=depot.id)
    session.add(district)
    await session.commit()
    await session.refresh(district)

    common = {"brand_id": brand.id, "district_id": district.id, "depot_id": depot.id, "dock_type": DockType.MALL_BAY}
    session.add_all(
        [
            Outlet(
                outlet_id="OUT101",
                name="Mall Store",
                parking_constraint=ParkingConstraint.MALL_DOCK,
                mall_window="09:00-11:00",
                window_open_time=time(8, 0),
                window_close_time=time(12, 0),
                **common,
            ),
            Outlet(
                outlet_id="OUT102",
                name="Street Store",
                parking_constraint=ParkingConstraint.NORMAL,
                window_open_time=time(7, 0),
                window_close_time=time(10, 0),
                **common,
            ),
        ]
    )
    await session.commit()

    mall = await client.get("/api/v1/master/outlets/out101/windows/effective")
    assert mall.status_code == 200
    assert mall.json() == {
        "outlet_id": "OUT101",
        "effective_open_time": "09:00:00",
        "effective_close_time": "11:00:00",
        "is_mall": True,
        "mall_window_applied": True,
    }

    plain = await client.get("/api/v1/master/outlets/OUT102/windows/effective")
    assert plain.json()["effective_open_time"] == "07:00:00"
    assert plain.json()["mall_window_applied"] is False

    assert (await client.get("/api/v1/master/outlets/NOPE/windows/effective")).status_code == 404

    by_district = await client.get("/api/v1/master/outlets/windows/by-district", params={"depot_id": str(depot.id)})
    assert by_district.status_code == 200
    assert [o["outlet_id"] for o in by_district.json()] == ["OUT101", "OUT102"]
    assert by_district.json()[0]["district"] == "Colombo"
    assert by_district.json()[0]["brand_code"] == "STYLE"

    page = await client.get("/api/v1/master/outlets", params={"limit": 1, "offset": 1})
    assert [o["outlet_id"] for o in page.json()] == ["OUT102"]
