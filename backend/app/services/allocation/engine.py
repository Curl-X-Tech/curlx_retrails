"""Allocation Engine Orchestrator: Database integration and execution."""

from __future__ import annotations

import time as clock
import uuid
from datetime import date, datetime, time
from typing import Any, Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import SRI_LANKA_TZ, utc_now
from app.entities.brand import Brand
from app.entities.customer_order import CustomerOrder, DeferralAuditLog, OrderItem
from app.entities.depot import Depot
from app.entities.district import District
from app.entities.outlet import Outlet
from app.entities.staff_profile import StaffProfile
from app.entities.trip import RouteLeg, Trip
from app.entities.vehicle import Vehicle
from app.services.allocation.heuristic_solver import HeuristicAllocationSolver
from app.services.allocation.ortools_solver import ORToolsAllocationSolver
from app.services.allocation.solver_base import (
    AllocationOrder,
    AllocationVehicle,
    BaseAllocationSolver,
    OrderItemData,
    SolverResult,
)


def get_solver(solver_type: str = "ortools") -> BaseAllocationSolver:
    """Factory to instantiate solver strategy."""
    if solver_type.strip().lower() == "heuristic":
        return HeuristicAllocationSolver()
    return ORToolsAllocationSolver()


async def fetch_allocation_orders(
    session: AsyncSession,
    depot_id: uuid.UUID,
    operating_date: date,
    order_ids: list[uuid.UUID] | None = None,
) -> list[AllocationOrder]:
    """Fetch and construct AllocationOrder instances from database."""
    query = (
        select(CustomerOrder, Outlet, Brand, District, Depot)
        .join(Outlet, Outlet.id == CustomerOrder.outlet_id)
        .join(Brand, Brand.id == Outlet.brand_id)
        .join(District, District.id == Outlet.district_id)
        .join(Depot, Depot.id == Outlet.depot_id)
        .where(
            Outlet.depot_id == depot_id,
            CustomerOrder.status.in_(("pending", "deferred")),
            CustomerOrder.order_date <= operating_date,
        )
    )

    if order_ids:
        query = query.where(CustomerOrder.id.in_(order_ids))

    rows = (await session.execute(query)).all()
    if not rows:
        return []

    order_map = {order.id: (order, outlet, brand, district, depot) for order, outlet, brand, district, depot in rows}

    # Fetch line items
    item_rows = (
        (await session.execute(select(OrderItem).where(OrderItem.order_id.in_(list(order_map.keys()))))).scalars().all()
    )

    items_by_order: dict[uuid.UUID, list[OrderItemData]] = {oid: [] for oid in order_map}
    for item in item_rows:
        items_by_order[item.order_id].append(
            OrderItemData(
                item_id=item.item_id,
                sku=item.package_code,
                requested_qty=item.requested_qty,
                unit_weight_kg=float(item.unit_weight_kg),
                unit_volume_m3=float(item.unit_volume_m3),
                unit_price=float(item.unit_price),
                special_handling_code=item.special_handling_code,
            )
        )

    orders: list[AllocationOrder] = []
    for order, outlet, brand, district, depot in rows:
        lines = items_by_order.get(order.id, [])
        total_w = sum(item_line.requested_qty * item_line.unit_weight_kg for item_line in lines)
        total_v = sum(item_line.requested_qty * item_line.unit_volume_m3 for item_line in lines)
        total_val = sum(item_line.requested_qty * item_line.unit_price for item_line in lines)

        orders.append(
            AllocationOrder(
                order_id=order.id,
                order_ref=order.order_ref,
                outlet_id=outlet.id,
                outlet_name=outlet.name,
                brand_id=brand.id,
                brand_code=brand.code,
                brand_name=brand.name,
                district_id=district.id,
                district_name=district.name,
                depot_id=depot.id,
                depot_name=depot.name,
                dock_type=outlet.dock_type,
                parking_constraint=outlet.parking_constraint,
                temp_requirement=order.temp_requirement,
                window_open_time=str(outlet.window_open_time),
                window_close_time=str(outlet.window_close_time),
                total_weight_kg=round(total_w, 3),
                total_volume_m3=round(total_v, 4),
                total_value_lkr=round(total_val, 2),
                deferred_yesterday=order.deferred_yesterday,
                days_since_last_served=order.days_since_last_served,
                is_urgent=order.is_urgent,
                items=lines,
            )
        )

    return orders


async def fetch_allocation_vehicles(
    session: AsyncSession,
    depot_id: uuid.UUID,
    operating_date: date,
    unavailable_vehicle_ids: set[uuid.UUID],
) -> list[AllocationVehicle]:
    """Fetch active fleet vehicles for the depot excluding workshop and overrides."""
    query = (
        select(Vehicle, Depot)
        .join(Depot, Depot.id == Vehicle.depot_id)
        .where(
            Vehicle.depot_id == depot_id,
            Vehicle.is_active.is_(True),
            Vehicle.status.notin_(("in_workshop", "breakdown")),
        )
    )

    rows = (await session.execute(query)).all()

    # Check how many trips each vehicle already has scheduled on operating_date
    used_trips_rows = (
        await session.execute(
            select(Trip.vehicle_id, func.count(Trip.id))
            .where(Trip.dispatch_date == operating_date, Trip.status != "cancelled")
            .group_by(Trip.vehicle_id)
        )
    ).all()
    used_trips = {vid: count for vid, count in used_trips_rows}

    vehicles: list[AllocationVehicle] = []
    for vehicle, depot in rows:
        if vehicle.id in unavailable_vehicle_ids:
            continue

        vehicles.append(
            AllocationVehicle(
                vehicle_id=vehicle.id,
                code=vehicle.vehicle_id,
                model_name=vehicle.model_name,
                type=vehicle.type,
                temp=vehicle.temp,
                weight_cap_kg=float(vehicle.weight_cap_kg),
                volume_cap_m3=float(vehicle.volume_cap_m3),
                depot_id=depot.id,
                depot_name=depot.name,
                assigned_driver_id=vehicle.assigned_driver_id,
                trips_assigned=used_trips.get(vehicle.id, 0),
            )
        )

    return vehicles


async def run_allocation_engine(
    session: AsyncSession,
    operating_date: date,
    depot_id: uuid.UUID,
    order_ids: list[uuid.UUID] | None = None,
    unavailable_vehicle_ids: set[uuid.UUID] | None = None,
    staff_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    simulation: bool = False,
    solver_type: Literal["ortools", "heuristic"] = "ortools",
) -> dict[str, Any]:
    """Execute fleet allocation engine on database orders and fleet."""
    started = clock.perf_counter()
    unavailable = unavailable_vehicle_ids or set()

    # 1. Fetch DB data
    orders = await fetch_allocation_orders(session, depot_id, operating_date, order_ids)
    vehicles = await fetch_allocation_vehicles(session, depot_id, operating_date, unavailable)

    # 2. Run solver
    solver = get_solver(solver_type)
    solver_result: SolverResult = solver.solve(orders, vehicles)

    # 3. If not simulation, persist trips, route legs, deferral audit log and order mutations
    trip_records_out: list[dict[str, Any]] = []
    if not simulation:
        existing_trip_count = (await session.execute(select(func.count()).select_from(Trip))).scalar_one()

        depot_driver_id = (
            await session.execute(
                select(StaffProfile.id).where(StaffProfile.depot_id == depot_id, StaffProfile.role == "driver").limit(1)
            )
        ).scalar_one_or_none()
        if not depot_driver_id:
            depot_driver_id = (
                await session.execute(select(StaffProfile.id).where(StaffProfile.role == "driver").limit(1))
            ).scalar_one_or_none()

        vehicle_seq_map: dict[uuid.UUID, int] = {}
        for trip_idx, pt in enumerate(solver_result.proposed_trips, start=1):
            trip_num = existing_trip_count + trip_idx
            trip_code = f"TRP-{operating_date:%Y%m%d}-{trip_num:04d}"
            base_time = datetime.combine(operating_date, time(5, 0))

            if pt.vehicle_id not in vehicle_seq_map:
                max_seq = (
                    await session.execute(
                        select(func.coalesce(func.max(Trip.trip_sequence), 0)).where(
                            Trip.dispatch_date == operating_date,
                            Trip.vehicle_id == pt.vehicle_id,
                        )
                    )
                ).scalar_one()
                vehicle_seq_map[pt.vehicle_id] = max_seq

            vehicle_seq_map[pt.vehicle_id] += 1
            assigned_seq = vehicle_seq_map[pt.vehicle_id]

            driver_id = pt.driver_id or depot_driver_id
            if not driver_id:
                # Create a placeholder driver if no driver exists in test environment
                driver_profile = StaffProfile(
                    employee_code=f"DRV-GEN-{trip_num:03d}",
                    first_name="Driver",
                    last_name=str(trip_num),
                    email=f"driver.gen.{trip_num}@curlx.tech",
                    phone="+94 77 000 0000",
                    role="driver",
                    depot_id=depot_id,
                )
                session.add(driver_profile)
                await session.flush()
                driver_id = driver_profile.id

            trip = Trip(
                name=f"Trip {trip_num}",
                trip_code=trip_code,
                dispatch_date=operating_date,
                trip_sequence=assigned_seq,
                vehicle_id=pt.vehicle_id,
                driver_id=driver_id,
                depot_id=pt.depot_id,
                brand_id=pt.brand_id,
                district_id=pt.district_id,
                status="scheduled",
                planned_start_time=base_time.replace(tzinfo=SRI_LANKA_TZ),
                outbound_travel_min=pt.legs[0].travel_duration_min if pt.legs else 0.0,
                inter_stop_travel_min=sum(leg.travel_duration_min for leg in pt.legs[1:]) if len(pt.legs) > 1 else 0.0,
                total_handling_min=sum(leg.handling_min for leg in pt.legs),
                total_trip_duration_min=pt.total_duration_min,
                total_distance_km=pt.total_distance_km,
                created_by=user_id,
                updated_by=user_id,
            )
            session.add(trip)
            await session.flush()

            for leg in pt.legs:
                dep_h, dep_m = map(int, leg.planned_depart_time.split(":"))
                arr_h, arr_m = map(int, leg.planned_arrival_time.split(":"))
                session.add(
                    RouteLeg(
                        name=f"Leg {leg.seq}",
                        leg_id=f"{trip_code}-{leg.seq}",
                        trip_id=trip.id,
                        seq=leg.seq,
                        from_point="DEPOT" if leg.seq == 0 else str(pt.legs[leg.seq - 1].outlet_id),
                        to_outlet_id=leg.outlet_id,
                        order_id=leg.order_id,
                        distance_km=15.0,
                        planned_depart_time=time(dep_h % 24, dep_m % 60),
                        planned_travel_duration_min=leg.travel_duration_min,
                        planned_arrival_time=time(arr_h % 24, arr_m % 60),
                        status="pending",
                    )
                )

            # Update served orders status to allocated
            served_order_ids = [o.order_id for o in pt.orders]
            served_db_orders = (
                (await session.execute(select(CustomerOrder).where(CustomerOrder.id.in_(served_order_ids))))
                .scalars()
                .all()
            )
            for o in served_db_orders:
                o.status = "allocated"
                o.updated_at = utc_now()

            trip_records_out.append(
                {
                    "trip_id": str(trip.id),
                    "trip_code": trip_code,
                    "brand_id": str(pt.brand_id),
                    "district_id": str(pt.district_id),
                    "vehicle_id": str(pt.vehicle_id),
                    "driver_id": str(pt.driver_id) if pt.driver_id else None,
                    "order_ids": [str(o.order_id) for o in pt.orders],
                    "route_leg_count": len(pt.legs),
                    "total_weight_kg": pt.total_weight_kg,
                    "total_volume_m3": pt.total_volume_m3,
                    "estimated_duration_min": pt.total_duration_min,
                }
            )

        # Record deferrals in database
        for def_record in solver_result.deferred_orders:
            session.add(
                DeferralAuditLog(
                    name="Deferral",
                    order_id=def_record.order_id,
                    outlet_id=def_record.outlet_id,
                    dispatch_date=operating_date,
                    deferral_reason=def_record.reason_code,
                    limiting_resource=def_record.limiting_resource,
                    decision_maker_staff_id=staff_id or uuid.UUID(int=0),
                )
            )

        deferred_ids = [d.order_id for d in solver_result.deferred_orders]
        if deferred_ids:
            deferred_db_orders = (
                (await session.execute(select(CustomerOrder).where(CustomerOrder.id.in_(deferred_ids)))).scalars().all()
            )
            for o in deferred_db_orders:
                o.status = "deferred"
                o.deferred_yesterday = 1
                o.days_since_last_served += 1
                o.updated_at = utc_now()

        await session.flush()
    else:
        # In simulation mode, build transient trip structures
        for trip_idx, pt in enumerate(solver_result.proposed_trips, start=1):
            trip_records_out.append(
                {
                    "trip_id": f"sim-{trip_idx}",
                    "trip_code": f"SIM-{operating_date:%Y%m%d}-{trip_idx:04d}",
                    "brand_id": str(pt.brand_id),
                    "district_id": str(pt.district_id),
                    "vehicle_id": str(pt.vehicle_id),
                    "driver_id": str(pt.driver_id) if pt.driver_id else None,
                    "order_ids": [str(o.order_id) for o in pt.orders],
                    "route_leg_count": len(pt.legs),
                    "total_weight_kg": pt.total_weight_kg,
                    "total_volume_m3": pt.total_volume_m3,
                    "estimated_duration_min": pt.total_duration_min,
                }
            )

    deferred_out = [
        {
            "order_id": str(d.order_id),
            "order_ref": d.order_ref,
            "outlet_id": str(d.outlet_id),
            "reason_code": d.reason_code,
            "limiting_resource": d.limiting_resource,
        }
        for d in solver_result.deferred_orders
    ]

    allocated_count = sum(len(t["order_ids"]) for t in trip_records_out)
    total_time_ms = int((clock.perf_counter() - started) * 1000)

    return {
        "proposed_trips": trip_records_out,
        "deferred_orders": deferred_out,
        "execution_time_ms": total_time_ms,
        "feasibility_passed": len(deferred_out) == 0,
        "solver_status": solver_result.solver_status,
        "is_simulation": simulation,
        "summary": {
            "total_orders_processed": len(orders),
            "allocated_orders_count": allocated_count,
            "deferred_orders_count": len(deferred_out),
            "total_trips_created": len(trip_records_out),
        },
    }
