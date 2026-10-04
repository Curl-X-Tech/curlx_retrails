"""Deterministic priority-ordered heuristic allocation solver."""

from __future__ import annotations

from collections import defaultdict
import time as clock
import uuid

from app.services.allocation.solver_base import (
    AllocationOrder,
    AllocationVehicle,
    BaseAllocationSolver,
    DeferredRecord,
    ProposedLeg,
    ProposedTrip,
    SolverResult,
)
from app.services.allocation.time_budget import (
    FRESH_DAILY_BUDGET_MIN,
    GENERAL_DAILY_BUDGET_MIN,
    MAX_TRIPS_PER_VEHICLE,
    calculate_trip_minutes,
    get_service_allowance_min,
    get_travel_allowances,
)


class HeuristicAllocationSolver(BaseAllocationSolver):
    """Greedy priority-ordered solver enforcing all 7 feasibility rules."""

    def solve(
        self,
        orders: list[AllocationOrder],
        vehicles: list[AllocationVehicle],
    ) -> SolverResult:
        start_time = clock.perf_counter()
        proposed_trips: list[ProposedTrip] = []
        deferred_records: list[DeferredRecord] = []

        # Sort orders strictly by priority: deferred_yesterday, days_since_last_served, is_urgent
        sorted_orders = sorted(orders, key=lambda o: -o.priority_score)

        # Group by (depot_id, brand_id, district_id) to enforce Rule 1 & Rule 4
        clusters: dict[tuple[uuid.UUID, uuid.UUID, uuid.UUID], list[AllocationOrder]] = defaultdict(list)
        for order in sorted_orders:
            clusters[(order.depot_id, order.brand_id, order.district_id)].append(order)

        # Deep clone vehicle states for allocation tracking
        vehicle_pool = [
            AllocationVehicle(
                vehicle_id=v.vehicle_id,
                code=v.code,
                model_name=v.model_name,
                type=v.type,
                temp=v.temp,
                weight_cap_kg=v.weight_cap_kg,
                volume_cap_m3=v.volume_cap_m3,
                depot_id=v.depot_id,
                depot_name=v.depot_name,
                assigned_driver_id=v.assigned_driver_id,
                trips_assigned=0,
                fresh_minutes_used=0.0,
                general_minutes_used=0.0,
            )
            for v in vehicles
        ]

        def record_deferral(order: AllocationOrder, reason: str, resource: str) -> None:
            deferred_records.append(
                DeferredRecord(
                    order_id=order.order_id,
                    order_ref=order.order_ref,
                    outlet_id=order.outlet_id,
                    reason_code=reason,
                    limiting_resource=resource,
                )
            )

        for (depot_id, brand_id, district_id), cluster_orders in clusters.items():
            remaining_orders = list(cluster_orders)

            while remaining_orders:
                # Find candidate orders that can fit in a single trip
                has_chilled = any(o.temp_requirement == "chilled" for o in remaining_orders)

                # Filter eligible vehicles from home depot
                eligible_vehicles = [
                    v for v in vehicle_pool if v.depot_id == depot_id and v.trips_assigned < MAX_TRIPS_PER_VEHICLE
                ]

                if not eligible_vehicles:
                    for o in remaining_orders:
                        record_deferral(o, "fleet_unavailable", "fleet_downtime")
                    break

                # Pick the best vehicle that satisfies van, refrigeration, and time budget
                best_vehicle: AllocationVehicle | None = None
                best_orders: list[AllocationOrder] = []
                best_duration = 0.0

                for v in eligible_vehicles:
                    # Rule 2: Chilled requirement
                    if has_chilled and v.temp != "reefer":
                        # This vehicle cannot carry chilled orders
                        candidate_pool = [o for o in remaining_orders if o.temp_requirement != "chilled"]
                    else:
                        candidate_pool = list(remaining_orders)

                    if not candidate_pool:
                        continue

                    # Rule 3: Van access
                    if v.type != "van":
                        candidate_pool = [o for o in candidate_pool if o.parking_constraint != "van_only"]

                    if not candidate_pool:
                        continue

                    # Pack orders into vehicle under capacity limits (Rule 5 whole orders & Rule 6 capacity)
                    packed: list[AllocationOrder] = []
                    current_w = 0.0
                    current_v = 0.0

                    for ord_item in candidate_pool:
                        if (
                            current_w + ord_item.total_weight_kg <= v.weight_cap_kg
                            and current_v + ord_item.total_volume_m3 <= v.volume_cap_m3
                        ):
                            # Test time budget (Rule 7)
                            trial_docks = [o.dock_type for o in packed] + [ord_item.dock_type]
                            trial_duration = calculate_trip_minutes(
                                v.depot_name,
                                ord_item.district_name,
                                ord_item.brand_name,
                                trial_docks,
                            )
                            is_fresh = ord_item.brand_name.strip().lower() == "fresh"
                            allowed_budget = FRESH_DAILY_BUDGET_MIN if is_fresh else GENERAL_DAILY_BUDGET_MIN
                            used_budget = v.fresh_minutes_used if is_fresh else v.general_minutes_used

                            if used_budget + trial_duration <= allowed_budget:
                                packed.append(ord_item)
                                current_w += ord_item.total_weight_kg
                                current_v += ord_item.total_volume_m3

                    if packed and len(packed) > len(best_orders):
                        trip_duration = calculate_trip_minutes(
                            v.depot_name,
                            packed[0].district_name,
                            packed[0].brand_name,
                            [o.dock_type for o in packed],
                        )
                        best_vehicle = v
                        best_orders = packed
                        best_duration = trip_duration

                if not best_vehicle or not best_orders:
                    # Orders in remaining_orders cannot be fulfilled
                    for o in remaining_orders:
                        if o.temp_requirement == "chilled" and not any(v.temp == "reefer" for v in eligible_vehicles):
                            record_deferral(o, "insufficient_reefer_capacity", "fleet_downtime")
                        elif o.parking_constraint == "van_only" and not any(v.type == "van" for v in eligible_vehicles):
                            record_deferral(o, "van_access_shortage", "fleet_downtime")
                        else:
                            record_deferral(o, "time_budget_limit", "time_budget")
                    break

                # Assign best_orders to best_vehicle
                best_vehicle.trips_assigned += 1
                is_fresh_trip = best_orders[0].brand_name.strip().lower() == "fresh"
                if is_fresh_trip:
                    best_vehicle.fresh_minutes_used += best_duration
                else:
                    best_vehicle.general_minutes_used += best_duration

                outbound_min, inter_stop_min = get_travel_allowances(
                    best_vehicle.depot_name, best_orders[0].district_name
                )
                legs: list[ProposedLeg] = []
                cum_minutes = 0.0

                for seq, o in enumerate(best_orders):
                    travel_min = outbound_min if seq == 0 else inter_stop_min
                    cum_minutes += travel_min
                    arr_min = cum_minutes
                    hand_min = get_service_allowance_min(o.brand_name, o.dock_type)
                    cum_minutes += hand_min
                    legs.append(
                        ProposedLeg(
                            seq=seq,
                            order_id=o.order_id,
                            outlet_id=o.outlet_id,
                            outlet_name=o.outlet_name,
                            dock_type=o.dock_type,
                            weight_kg=o.total_weight_kg,
                            volume_m3=o.total_volume_m3,
                            planned_depart_time=f"{int(arr_min // 60):02d}:{int(arr_min % 60):02d}",
                            planned_arrival_time=f"{int(arr_min // 60):02d}:{int(arr_min % 60):02d}",
                            travel_duration_min=travel_min,
                            handling_min=hand_min,
                        )
                    )

                proposed_trips.append(
                    ProposedTrip(
                        trip_sequence=best_vehicle.trips_assigned,
                        vehicle_id=best_vehicle.vehicle_id,
                        driver_id=best_vehicle.assigned_driver_id,
                        brand_id=best_orders[0].brand_id,
                        brand_name=best_orders[0].brand_name,
                        district_id=best_orders[0].district_id,
                        district_name=best_orders[0].district_name,
                        depot_id=best_orders[0].depot_id,
                        depot_name=best_orders[0].depot_name,
                        orders=best_orders,
                        legs=legs,
                        total_weight_kg=round(sum(o.total_weight_kg for o in best_orders), 2),
                        total_volume_m3=round(sum(o.total_volume_m3 for o in best_orders), 3),
                        total_duration_min=best_duration,
                        total_distance_km=round(len(best_orders) * 15.0, 2),
                    )
                )

                # Remove allocated orders from remaining
                allocated_ids = {o.order_id for o in best_orders}
                remaining_orders = [o for o in remaining_orders if o.order_id not in allocated_ids]

        elapsed_ms = int((clock.perf_counter() - start_time) * 1000)
        return SolverResult(
            proposed_trips=proposed_trips,
            deferred_orders=deferred_records,
            solver_status="optimal" if not deferred_records else "feasible",
            execution_time_ms=elapsed_ms,
        )
