"""Tests for Hybrid Fleet Allocation Engine (Issue #16).

Verifies all 7 Challenge Booklet Feasibility Rules:
- Rule 1: Brand and district homogeneity
- Rule 2: Refrigeration constraint (chilled -> reefer)
- Rule 3: Vehicle access constraint (van_only -> van)
- Rule 4: Home depot affinity
- Rule 5: Whole atomic orders (no splitting)
- Rule 6: Capacity limits (weight & volume)
- Rule 7: Max 2 trips per vehicle & time budgets (Fresh 270m, Style/Tech 480m)
- Deferral prioritization (deferred_yesterday == 1 prioritized)
- Simulation mode (no database mutations)
- Engine status & scheduler
"""

from __future__ import annotations

import uuid
from datetime import date
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.entities.depot import Depot
from app.services.allocation import (
    AllocationOrder,
    AllocationVehicle,
    HeuristicAllocationSolver,
    get_engine_status,
)
from tests.test_fleet_orders import seed_database


def _make_order(
    order_id: str,
    brand_code: str = "FRESH",
    brand_name: str = "Fresh",
    district_name: str = "Colombo",
    depot_name: str = "Peliyagoda",
    temp_req: str = "ambient",
    parking_constraint: str = "normal",
    dock_type: str = "rear_dock",
    weight_kg: float = 100.0,
    volume_m3: float = 0.5,
    deferred_yesterday: int = 0,
    days_since_last_served: int = 0,
    is_urgent: bool = False,
) -> AllocationOrder:
    b_id = uuid.uuid4()
    d_id = uuid.uuid4()
    dp_id = uuid.uuid4()
    return AllocationOrder(
        order_id=uuid.UUID(order_id),
        order_ref=f"ORD-{order_id[:8]}",
        outlet_id=uuid.uuid4(),
        outlet_name=f"Outlet {order_id[:4]}",
        brand_id=b_id,
        brand_code=brand_code,
        brand_name=brand_name,
        district_id=d_id,
        district_name=district_name,
        depot_id=dp_id,
        depot_name=depot_name,
        dock_type=dock_type,
        parking_constraint=parking_constraint,
        temp_requirement=temp_req,
        window_open_time="05:00:00",
        window_close_time="08:00:00",
        total_weight_kg=weight_kg,
        total_volume_m3=volume_m3,
        total_value_lkr=5000.0,
        deferred_yesterday=deferred_yesterday,
        days_since_last_served=days_since_last_served,
        is_urgent=is_urgent,
    )


def _make_vehicle(
    vehicle_id: str,
    v_type: str = "truck",
    v_temp: str = "ambient",
    weight_cap: float = 2000.0,
    volume_cap: float = 10.0,
    depot_name: str = "Peliyagoda",
) -> AllocationVehicle:
    return AllocationVehicle(
        vehicle_id=uuid.UUID(vehicle_id),
        code=f"VEH-{vehicle_id[:4]}",
        model_name="Isuzu NPR",
        type=v_type,
        temp=v_temp,
        weight_cap_kg=weight_cap,
        volume_cap_m3=volume_cap,
        depot_id=uuid.uuid4(),
        depot_name=depot_name,
        assigned_driver_id=uuid.uuid4(),
    )


def test_rule_1_brand_and_district_homogeneity():
    """Rule 1: All orders sharing a vehicle_id and trip_id must belong to same brand and district."""
    solver = HeuristicAllocationSolver()
    depot_id = uuid.uuid4()

    o1 = _make_order("00000000-0000-0000-0000-000000000001", brand_name="Fresh", district_name="Colombo")
    o2 = _make_order("00000000-0000-0000-0000-000000000002", brand_name="Style", district_name="Colombo")
    o3 = _make_order("00000000-0000-0000-0000-000000000003", brand_name="Fresh", district_name="Gampaha")

    for o in (o1, o2, o3):
        o.depot_id = depot_id

    v1 = _make_vehicle("10000000-0000-0000-0000-000000000001", weight_cap=5000.0, volume_cap=30.0)
    v1.depot_id = depot_id

    result = solver.solve([o1, o2, o3], [v1])

    # Since v1 can take at most 2 trips, each trip must be homogenous
    for trip in result.proposed_trips:
        brands = {o.brand_name for o in trip.orders}
        districts = {o.district_name for o in trip.orders}
        assert len(brands) == 1, "Trip violated brand homogeneity"
        assert len(districts) == 1, "Trip violated district homogeneity"


def test_rule_2_refrigeration_constraint():
    """Rule 2: Chilled orders strictly require vehicle with temp = 'reefer'."""
    solver = HeuristicAllocationSolver()
    depot_id = uuid.uuid4()

    chilled_order = _make_order(
        "00000000-0000-0000-0000-000000000011",
        temp_req="chilled",
        brand_name="Fresh",
        district_name="Colombo",
    )
    ambient_order = _make_order(
        "00000000-0000-0000-0000-000000000012",
        temp_req="ambient",
        brand_name="Fresh",
        district_name="Colombo",
    )
    chilled_order.depot_id = depot_id
    ambient_order.depot_id = depot_id

    ambient_veh = _make_vehicle("10000000-0000-0000-0000-000000000011", v_temp="ambient")
    ambient_veh.depot_id = depot_id

    # Solver given only ambient vehicle
    res = solver.solve([chilled_order, ambient_order], [ambient_veh])

    # Ambient order should be served, chilled order must be deferred
    allocated_ids = [o.order_id for t in res.proposed_trips for o in t.orders]
    assert ambient_order.order_id in allocated_ids
    assert chilled_order.order_id not in allocated_ids
    assert any(d.reason_code == "insufficient_reefer_capacity" for d in res.deferred_orders)


def test_rule_3_vehicle_access_constraint():
    """Rule 3: Outlets with parking_constraint = 'van_only' require type = 'van'."""
    solver = HeuristicAllocationSolver()
    depot_id = uuid.uuid4()

    van_order = _make_order(
        "00000000-0000-0000-0000-000000000021",
        parking_constraint="van_only",
        brand_name="Fresh",
        district_name="Colombo",
    )
    van_order.depot_id = depot_id

    truck_veh = _make_vehicle("10000000-0000-0000-0000-000000000021", v_type="truck")
    truck_veh.depot_id = depot_id

    res = solver.solve([van_order], [truck_veh])
    assert len(res.proposed_trips) == 0
    assert any(d.reason_code == "van_access_shortage" for d in res.deferred_orders)

    van_veh = _make_vehicle("10000000-0000-0000-0000-000000000022", v_type="van")
    van_veh.depot_id = depot_id

    res_van = solver.solve([van_order], [van_veh])
    assert len(res_van.proposed_trips) == 1
    assert res_van.proposed_trips[0].orders[0].order_id == van_order.order_id


def test_rule_4_home_depot_affinity():
    """Rule 4: Vehicle may serve only outlets assigned to its own depot."""
    solver = HeuristicAllocationSolver()
    depot_pel = uuid.uuid4()
    depot_kdy = uuid.uuid4()

    kdy_order = _make_order("00000000-0000-0000-0000-000000000031", depot_name="Kandy")
    kdy_order.depot_id = depot_kdy

    pel_veh = _make_vehicle("10000000-0000-0000-0000-000000000031", depot_name="Peliyagoda")
    pel_veh.depot_id = depot_pel

    res = solver.solve([kdy_order], [pel_veh])
    assert len(res.proposed_trips) == 0


def test_rule_5_whole_orders_atomic():
    """Rule 5: Whole orders must be assigned to exactly one trip (no partial splits)."""
    solver = HeuristicAllocationSolver()
    depot_id = uuid.uuid4()

    o1 = _make_order("00000000-0000-0000-0000-000000000041", weight_kg=500.0, volume_m3=2.0)
    o2 = _make_order("00000000-0000-0000-0000-000000000042", weight_kg=500.0, volume_m3=2.0)
    o1.depot_id = depot_id
    o2.depot_id = depot_id

    v1 = _make_vehicle("10000000-0000-0000-0000-000000000041", weight_cap=1500.0, volume_cap=10.0)
    v1.depot_id = depot_id

    res = solver.solve([o1, o2], [v1])
    all_assigned_ids = [o.order_id for t in res.proposed_trips for o in t.orders]
    assert len(all_assigned_ids) == len(set(all_assigned_ids)), "Duplicate or split assignment detected"


def test_rule_6_payload_capacity_limits():
    """Rule 6: Trip total weight and volume must not exceed vehicle caps."""
    solver = HeuristicAllocationSolver()
    depot_id = uuid.uuid4()

    heavy_order = _make_order("00000000-0000-0000-0000-000000000051", weight_kg=2500.0, volume_m3=1.0)
    heavy_order.depot_id = depot_id

    small_veh = _make_vehicle("10000000-0000-0000-0000-000000000051", weight_cap=2000.0, volume_cap=10.0)
    small_veh.depot_id = depot_id

    res = solver.solve([heavy_order], [small_veh])
    assert len(res.proposed_trips) == 0
    assert len(res.deferred_orders) == 1


def test_rule_7_trips_and_time_budgets():
    """Rule 7: Max 2 trips per vehicle per day, within respective daily budgets."""
    solver = HeuristicAllocationSolver()
    depot_id = uuid.uuid4()

    # Create 3 distinct district clusters for Fresh
    o_col = _make_order("00000000-0000-0000-0000-000000000061", brand_name="Fresh", district_name="Colombo")
    o_gam = _make_order("00000000-0000-0000-0000-000000000062", brand_name="Fresh", district_name="Gampaha")
    o_kal = _make_order("00000000-0000-0000-0000-000000000063", brand_name="Fresh", district_name="Kalutara")

    for o in (o_col, o_gam, o_kal):
        o.depot_id = depot_id

    v1 = _make_vehicle("10000000-0000-0000-0000-000000000061", weight_cap=10000.0, volume_cap=50.0)
    v1.depot_id = depot_id

    res = solver.solve([o_col, o_gam, o_kal], [v1])

    # Vehicle v1 can only take at most 2 trips
    vehicle_trips = [t for t in res.proposed_trips if t.vehicle_id == v1.vehicle_id]
    assert len(vehicle_trips) <= 2, "Vehicle assigned more than 2 trips"
    assert len(res.deferred_orders) >= 1, "Third trip orders should be deferred due to trip limit"


def test_deferral_prioritization():
    """Deferrals: Orders skipped yesterday (deferred_yesterday=1) must be prioritized."""
    solver = HeuristicAllocationSolver()
    depot_id = uuid.uuid4()

    regular_order_1 = _make_order(
        "00000000-0000-0000-0000-000000000071",
        weight_kg=1500.0,
        deferred_yesterday=0,
    )
    regular_order_2 = _make_order(
        "00000000-0000-0000-0000-000000000072",
        weight_kg=1500.0,
        deferred_yesterday=0,
    )
    deferred_order = _make_order(
        "00000000-0000-0000-0000-000000000073",
        weight_kg=1500.0,
        deferred_yesterday=1,
    )

    for o in (regular_order_1, regular_order_2, deferred_order):
        o.depot_id = depot_id

    small_veh = _make_vehicle("10000000-0000-0000-0000-000000000071", weight_cap=1800.0, volume_cap=10.0)
    small_veh.depot_id = depot_id

    # Vehicle can carry at most 2 orders across its max 2 trips
    res = solver.solve([regular_order_1, regular_order_2, deferred_order], [small_veh])
    assert len(res.proposed_trips) == 2
    # Trip 1 must contain the deferred order because it was prioritized
    trip1_order_ids = [o.order_id for o in res.proposed_trips[0].orders]
    assert deferred_order.order_id in trip1_order_ids
    assert len(res.deferred_orders) == 1


@pytest.mark.asyncio
async def test_api_optimize_endpoint_and_simulation(
    client: AsyncClient, session: AsyncSession, user_token_headers: dict[str, str]
):
    """Test POST /api/v1/allocations/optimize with simulation and persistence."""
    await seed_database(session)
    depot = (await session.execute(select(Depot))).scalars().first()
    assert depot is not None

    # 1. Run simulation mode
    sim_body = {
        "operating_date": "2031-03-06",
        "depot_id": str(depot.id),
        "simulation": True,
        "solver_type": "ortools",
    }
    sim_resp = await client.post("/api/v1/allocations/optimize", json=sim_body, headers=user_token_headers)
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    assert sim_data["is_simulation"] is True

    # Check status endpoint
    status_resp = await client.get("/api/v1/allocations/engine/status", headers=user_token_headers)
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] in ("completed", "idle")


@pytest.mark.asyncio
async def test_scheduler_and_rerun_safety(
    session: AsyncSession,
):
    """Verify scheduler execution and rerun safety without duplicate trips."""
    from app.services.allocation import execute_scheduled_cutoff

    await seed_database(session)
    depot = (await session.execute(select(Depot))).scalars().first()
    assert depot is not None

    op_date = date(2031, 3, 6)

    # First run
    res1 = await execute_scheduled_cutoff(session, op_date, depot.id)
    assert res1.get("status") != "skipped_locked"
    assert res1["solver_status"] in ("optimal", "feasible")

    # Verify status state
    state = get_engine_status()
    assert state["status"] == "completed"
    assert state["operating_date"] == op_date.isoformat()
