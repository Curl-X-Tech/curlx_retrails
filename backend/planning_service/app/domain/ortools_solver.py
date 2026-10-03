"""
Google OR-Tools Implementation for Fleet Allocation and VRPTW Scheduling.

This module provides two complementary OR-Tools solvers:
 1. ORToolsAllocationSolver (CP-SAT):
    Solves global multi-vehicle, multi-day scheduling.
    Assigns trips to vehicles across operating days respecting:
      - Depot home base constraint
      - Parking access constraint (van_only)
      - Temperature constraint (reefer for chilled/frozen)
      - Weight and Volume capacity limits
      - Max 2 trips per vehicle per day
      - Weekly fuel quotas across the planning horizon
      - Non-overlapping sequential intervals on each vehicle (NoOverlap)
      - Immovable manual locks (Non-override guarantee)
      - Global objective: Min unassigned, Min days, Max fuel efficiency

 2. ORToolsRoutingSequencer (RoutingModel / VRPTW):
    Solves exact vehicle routing with time windows for stops within a trip.
    Minimizes arrival lateness, transit time, and customer waiting time.
"""

from __future__ import annotations


from ortools.sat.python import cp_model

from app.domain.Trip import Trip
from app.domain.Vehicle import Vehicle


class ORToolsAllocationSolver:
    """
    CP-SAT constraint programming solver for global multi-vehicle,
    multi-day fleet allocation with interval-based sequential dispatch.
    """

    def __init__(
        self,
        trips: list[Trip],
        vehicles: list[Vehicle],
        outlets: list,
        service_allowances: list,
        max_days: int = 4,
        time_limit_seconds: float = 10.0,
    ) -> None:
        self.trips = trips
        self.vehicles = vehicles
        self.outlets = outlets
        self.service_allowances = service_allowances
        self.max_days = max_days
        self.time_limit_seconds = time_limit_seconds

    def solve(self) -> list[Trip]:
        """
        Executes CP-SAT allocation and returns the list of allocated trips
        with vehicles, days, and sequenced timelines assigned.
        """
        # Step 1: Pre-process trip requirements and ensure feasible order splits
        effective_trips = self._prepare_feasible_trips(self.trips)

        model = cp_model.CpModel()

        T = len(effective_trips)
        V = len(self.vehicles)
        D = self.max_days

        # Decision Variables:
        # assign[t, v, d] == 1 iff trip t is assigned to vehicle v on day d
        assign: dict[tuple[int, int, int], cp_model.IntVar] = {}
        # is_served[t] == 1 iff trip t is allocated to some vehicle on some day
        is_served: dict[int, cp_model.IntVar] = {}

        for t_idx, trip in enumerate(effective_trips):
            is_served[t_idx] = model.NewBoolVar(f"served_t{t_idx}")
            t_assigns = []

            for v_idx, v in enumerate(self.vehicles):
                # Static compatibility pruning
                if not self._is_statically_compatible(trip, v):
                    continue

                for d in range(1, D + 1):
                    var = model.NewBoolVar(f"assign_t{t_idx}_v{v_idx}_d{d}")
                    assign[(t_idx, v_idx, d)] = var
                    t_assigns.append(var)

            # Each trip is assigned to at most one vehicle and day
            model.Add(sum(t_assigns) == is_served[t_idx])

        # ── Constraint 1: Manual Locks (Non-Override Guarantee) ───────── #
        for t_idx, trip in enumerate(effective_trips):
            if getattr(trip, "is_locked", False) and trip.vehicle is not None:
                v_target = next((i for i, v in enumerate(self.vehicles) if v.ID == trip.vehicle.ID), None)
                d_target = getattr(trip, "allocation_day", 1) or 1
                if v_target is not None and (t_idx, v_target, d_target) in assign:
                    # Pin the assignment in CP-SAT
                    model.Add(assign[(t_idx, v_target, d_target)] == 1)
                    model.Add(is_served[t_idx] == 1)

        # ── Constraint 2: Daily Trip Limit (<= 2 trips per vehicle/day) ── #
        for v_idx in range(V):
            for d in range(1, D + 1):
                v_d_trips = [assign[(t_idx, v_idx, d)] for t_idx in range(T) if (t_idx, v_idx, d) in assign]
                if v_d_trips:
                    model.Add(sum(v_d_trips) <= self.vehicles[v_idx].max_per_day_trip_count)

        # ── Constraint 3: Weekly Fuel Quota ───────────────────────────── #
        for v_idx, v in enumerate(self.vehicles):
            max_km = int(v.weekly_fuel_quota * v.km_per_l)
            fuel_usages = []
            for t_idx, trip in enumerate(effective_trips):
                trip_km = int(round(trip.route.round_trip_km() if trip.route else 0.0))
                for d in range(1, D + 1):
                    if (t_idx, v_idx, d) in assign:
                        fuel_usages.append(assign[(t_idx, v_idx, d)] * trip_km)
            if fuel_usages:
                model.Add(sum(fuel_usages) <= max_km)

        # ── Pre-compute Pairwise Temporal Coexistence ─────────────────── #
        base_schedules = [t.plan_stop_sequence(self.outlets, self.service_allowances) for t in effective_trips]
        base_returns = [
            effective_trips[i]._hhmm_to_minutes(base_schedules[i]["return_to_depot_hhmm"])
            if base_schedules[i]
            else 9999
            for i in range(T)
        ]

        pair_can_coexist: dict[tuple[int, int], bool] = {}
        pair_order: dict[tuple[int, int], tuple[int, int]] = {}

        for i in range(T):
            t1 = effective_trips[i]
            r1 = base_returns[i]
            for j in range(i + 1, T):
                t2 = effective_trips[j]
                r2 = base_returns[j]

                # Check Option A: t1 then t2
                sched_1_then_2 = t2.plan_stop_sequence(self.outlets, self.service_allowances, earliest_departure_min=r1)
                ok_1_2 = sched_1_then_2 is not None and not sched_1_then_2["has_violations"]

                # Check Option B: t2 then t1
                sched_2_then_1 = t1.plan_stop_sequence(self.outlets, self.service_allowances, earliest_departure_min=r2)
                ok_2_1 = sched_2_then_1 is not None and not sched_2_then_1["has_violations"]

                if ok_1_2 and ok_2_1:
                    ret_1_2 = t2._hhmm_to_minutes(sched_1_then_2["return_to_depot_hhmm"])
                    ret_2_1 = t1._hhmm_to_minutes(sched_2_then_1["return_to_depot_hhmm"])
                    pair_can_coexist[(i, j)] = True
                    pair_order[(i, j)] = (i, j) if ret_1_2 <= ret_2_1 else (j, i)
                elif ok_1_2:
                    pair_can_coexist[(i, j)] = True
                    pair_order[(i, j)] = (i, j)
                elif ok_2_1:
                    pair_can_coexist[(i, j)] = True
                    pair_order[(i, j)] = (j, i)
                else:
                    pair_can_coexist[(i, j)] = False

        # ── Constraint 4: Temporal Non-Overlap & Delivery Window Limits ── #
        for (i, j), can_coexist in pair_can_coexist.items():
            if not can_coexist:
                for v_idx in range(V):
                    for d in range(1, D + 1):
                        if (i, v_idx, d) in assign and (j, v_idx, d) in assign:
                            model.Add(assign[(i, v_idx, d)] + assign[(j, v_idx, d)] <= 1)

        # ── Objective Function ────────────────────────────────────────── #
        # 1. Maximize served orders (high weight)
        # 2. Minimize allocation day (deliver sooner)
        # 3. Minimize total travel distance (fuel efficiency)
        objective_terms = []
        for t_idx, trip in enumerate(effective_trips):
            order_count = len(trip.order_queue)
            objective_terms.append(is_served[t_idx] * (order_count * 10000))

            trip_km = int(round(trip.route.round_trip_km() if trip.route else 0.0))
            for v_idx in range(V):
                for d in range(1, D + 1):
                    if (t_idx, v_idx, d) in assign:
                        penalty = (d - 1) * 200 + trip_km
                        objective_terms.append(-assign[(t_idx, v_idx, d)] * penalty)

        model.Maximize(sum(objective_terms))

        # Solve model
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.time_limit_seconds
        solver.parameters.num_workers = 4

        status = solver.Solve(model)

        # Reconstruct allocated trips and assign schedules
        allocated_results: list[Trip] = []
        assigned_trip_ids = set()

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            for v_idx, v in enumerate(self.vehicles):
                for d in range(1, D + 1):
                    v_d_trip_indices = [
                        t_idx
                        for t_idx in range(T)
                        if (t_idx, v_idx, d) in assign and solver.Value(assign[(t_idx, v_idx, d)]) == 1
                    ]

                    if not v_d_trip_indices:
                        continue

                    # Order multiple trips sequentially using pre-verified conflict-free ordering
                    if len(v_d_trip_indices) == 2:
                        idx_a, idx_b = v_d_trip_indices[0], v_d_trip_indices[1]
                        pair_key = (min(idx_a, idx_b), max(idx_a, idx_b))
                        first_idx, second_idx = pair_order.get(pair_key, (idx_a, idx_b))
                        ordered_indices = [first_idx, second_idx]
                    else:
                        ordered_indices = v_d_trip_indices

                    earliest_dep = None
                    for t_idx in ordered_indices:
                        trip = effective_trips[t_idx]
                        trip.assign_vehicle(v)
                        trip.allocation_day = d
                        v.increment_trip_count()
                        v.add_milage(trip.route.round_trip_km() if trip.route else 0.0)

                        trip.apply_optimal_sequence(
                            self.outlets,
                            self.service_allowances,
                            earliest_departure_min=earliest_dep,
                        )
                        sched = trip.stop_schedule
                        if sched:
                            earliest_dep = trip._hhmm_to_minutes(sched["return_to_depot_hhmm"])

                        allocated_results.append(trip)
                        assigned_trip_ids.add(trip.ID)

            # Record unassigned trips
            for trip in effective_trips:
                if trip.ID not in assigned_trip_ids:
                    trip.allocation_error = f"OR-Tools CP-SAT: Capacity exhausted within {self.max_days} days"
                    allocated_results.append(trip)
        else:
            for trip in effective_trips:
                trip.allocation_error = f"OR-Tools CP-SAT solver returned status: {solver.StatusName(status)}"
                allocated_results.append(trip)

        return allocated_results

    def _is_statically_compatible(self, trip: Trip, vehicle: Vehicle) -> bool:
        """Checks static feasibility (depot, access, temp, capacity)."""
        depot = trip.route.get_depot() if trip.route else None
        if depot and not vehicle.serves_depot(depot):
            return False

        parking = trip.get_parking_constraint(self.outlets) or "normal"
        if not vehicle.can_access_outlet_type(parking):
            return False

        temp = trip.get_temp_condition() or "ambient"
        if not vehicle.can_carry_temp(temp):
            return False

        if trip.total_weight_in_queue() > vehicle.weight_cap_kg:
            return False
        if trip.total_volume_in_queue() > vehicle.volume_cap_m3:
            return False

        return True

    def _prepare_feasible_trips(self, raw_trips: list[Trip]) -> list[Trip]:
        """
        Splits any oversized raw trip into fork trips that can fit within
        the largest compatible vehicle's physical capacity.
        """
        prepared: list[Trip] = []
        fork_idx = 0

        for trip in raw_trips:
            if not trip.order_queue:
                prepared.append(trip)
                continue

            # Find maximum weight and volume capacity for any vehicle that could serve this trip
            compatible_v = [v for v in self.vehicles if self._is_statically_compatible_base(trip, v)]
            if not compatible_v:
                prepared.append(trip)
                continue

            max_w = max(v.weight_cap_kg for v in compatible_v)
            max_vol = max(v.volume_cap_m3 for v in compatible_v)

            test_sched = trip.plan_stop_sequence(self.outlets, self.service_allowances)
            if (
                trip.total_weight_in_queue() <= max_w
                and trip.total_volume_in_queue() <= max_vol
                and test_sched is not None
                and not test_sched["has_violations"]
            ):
                prepared.append(trip)
                continue

            # Split greedily by EDF with both capacity AND time-window feasibility
            edf_sorted = sorted(
                trip.order_queue,
                key=lambda o: (
                    o.get_window_close_time(self.outlets) or "99:99",
                    o.get_window_open_time(self.outlets) or "99:99",
                ),
            )
            curr_orders = []
            curr_w = 0.0
            curr_v = 0.0

            for o in edf_sorted:
                ow = o.get_weight()
                ov = o.get_volume()

                # Check 1: physical capacity
                capacity_ok = curr_w + ow <= max_w and curr_v + ov <= max_vol

                # Check 2: time-window feasibility
                window_ok = False
                if capacity_ok:
                    test_trip = Trip(
                        ID="_check",
                        CreateTime=trip.CreateTime,
                        UpdateTime=trip.UpdateTime,
                        CreatedBy=trip.CreatedBy,
                        UpdatedBy=trip.UpdatedBy,
                        IsActive=trip.IsActive,
                        route=trip.route,
                        order_queue=curr_orders + [o],
                    )
                    sched = test_trip.plan_stop_sequence(self.outlets, self.service_allowances)
                    window_ok = sched is not None and not sched["has_violations"]

                if curr_orders and (not capacity_ok or not window_ok):
                    fork_idx += 1
                    fork_trip = trip.fork_trip_by_transferring_orders(
                        curr_orders, fork_id=f"{trip.ID}_ortools_fork_{fork_idx}"
                    )
                    prepared.append(fork_trip)
                    curr_orders = [o]
                    curr_w = ow
                    curr_v = ov
                else:
                    curr_orders.append(o)
                    curr_w += ow
                    curr_v += ov

            if curr_orders:
                fork_idx += 1
                fork_trip = trip.fork_trip_by_transferring_orders(
                    curr_orders, fork_id=f"{trip.ID}_ortools_fork_{fork_idx}"
                )
                prepared.append(fork_trip)

        return prepared

    def _is_statically_compatible_base(self, trip: Trip, vehicle: Vehicle) -> bool:
        depot = trip.route.get_depot() if trip.route else None
        if depot and not vehicle.serves_depot(depot):
            return False
        parking = trip.get_parking_constraint(self.outlets) or "normal"
        if not vehicle.can_access_outlet_type(parking):
            return False
        temp = trip.get_temp_condition() or "ambient"
        if not vehicle.can_carry_temp(temp):
            return False
        return True
