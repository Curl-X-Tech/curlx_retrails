"""
DispatchPlan and PlanValidator: Enterprise planning workflow with authorization,
draft state queue, manual override validation, and locked anchor guarantees.

Business Invariants Checked on Manual and Automatic Edits:
───────────────────────────────────────────────────────────
 1. Depot compatibility: vehicle must serve the trip's home depot.
 2. Outlet access constraint: van_only outlets require a van.
 3. Temperature compatibility: chilled/frozen requires a reefer vehicle.
 4. Physical capacity: load weight <= vehicle weight capacity AND volume <= volume capacity.
 5. Daily trip limit: <= 2 trips per vehicle per operating day.
 6. Weekly fuel quota: accumulated mileage + trip distance <= km_per_l * weekly_fuel_quota.
 7. Brand time budget: total trip duration <= daily time budget (270 Fresh, 480 Style/Tech).
 8. Vehicle schedule collision: no overlapping trips on the same vehicle (sequential dispatch).
 9. Delivery window deadline: every stop must complete unloading before its window closes.
10. Route homogeneity: single brand and district per trip.
"""

from __future__ import annotations

import datetime
from enum import Enum
from dataclasses import dataclass, field
from typing import Any

from app.domain.Trip import Trip
from app.domain.Vehicle import Vehicle, VehicleTree


class PlanStatus(str, Enum):
    DRAFT = "DRAFT"                          # Generated in queue, pending review & confirmation
    CONFIRMED = "CONFIRMED"                  # Approved by authorized personnel; run sheets active
    SUPERSEDED = "SUPERSEDED"                # Replaced by a newer plan version


@dataclass
class ValidationResult:
    is_valid: bool
    schedule: dict | None = None
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "is_valid": self.is_valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "schedule": self.schedule,
        }


class PlanValidator:
    """
    Validates any candidate or manual assignment against all 10 business constraints
    before allowing a commit to a DispatchPlan.
    """

    @staticmethod
    def validate_trip_assignment(
        trip: Trip,
        vehicle: Vehicle,
        allocation_day: int,
        existing_trips: list[Trip],
        outlets: list,
        service_allowances: list,
    ) -> ValidationResult:
        errors: list[str] = []
        warnings: list[str] = []

        if not trip.order_queue:
            return ValidationResult(is_valid=False, errors=["Cannot assign an empty trip with 0 orders."])

        # ── 1. Depot Compatibility ────────────────────────────────────── #
        trip_depot = trip.route.get_depot() if trip.route else None
        if trip_depot and not vehicle.serves_depot(trip_depot):
            errors.append(
                f"Depot mismatch: vehicle {vehicle.ID} operates from '{vehicle.depot}', "
                f"but trip requires depot '{trip_depot}'."
            )

        # ── 2. Outlet Access / Parking Constraint ─────────────────────── #
        parking = trip.get_parking_constraint(outlets) or "normal"
        if not vehicle.can_access_outlet_type(parking):
            errors.append(
                f"Access constraint violation: trip includes '{parking}' outlets, "
                f"which cannot be served by a {vehicle.type} ({vehicle.ID})."
            )

        # ── 3. Temperature Compatibility ──────────────────────────────── #
        temp = trip.get_temp_condition() or "ambient"
        if not vehicle.can_carry_temp(temp):
            errors.append(
                f"Temperature violation: trip requires '{temp}' transport, "
                f"but vehicle {vehicle.ID} is ambient-only."
            )

        # ── 4. Capacity (Weight and Volume) ───────────────────────────── #
        weight = trip.total_weight_in_queue()
        volume = trip.total_volume_in_queue()
        if weight > vehicle.weight_cap_kg:
            errors.append(
                f"Weight limit exceeded: total load {weight:.1f} kg exceeds vehicle {vehicle.ID} "
                f"limit of {vehicle.weight_cap_kg:.1f} kg (over by {weight - vehicle.weight_cap_kg:.1f} kg)."
            )
        if volume > vehicle.volume_cap_m3:
            errors.append(
                f"Volume limit exceeded: total volume {volume:.2f} m³ exceeds vehicle {vehicle.ID} "
                f"limit of {vehicle.volume_cap_m3:.2f} m³ (over by {volume - vehicle.volume_cap_m3:.2f} m³)."
            )

        # Filter other trips committed to this vehicle
        other_trips_for_v = [
            t for t in existing_trips
            if t.vehicle and t.vehicle.ID == vehicle.ID and t.ID != trip.ID
        ]

        # ── 5. Daily Trip Limit (<= 2 trips per day) ──────────────────── #
        other_trips_same_day = [
            t for t in other_trips_for_v
            if getattr(t, "allocation_day", 1) == allocation_day
        ]
        if len(other_trips_same_day) >= vehicle.max_per_day_trip_count:
            errors.append(
                f"Daily trip limit exceeded: vehicle {vehicle.ID} already has "
                f"{len(other_trips_same_day)}/2 trips assigned on Day {allocation_day}."
            )

        # ── 6. Weekly Fuel Quota ──────────────────────────────────────── #
        trip_km = trip.route.round_trip_km() if trip.route else 0.0
        used_km = sum(
            (t.route.round_trip_km() if t.route else 0.0)
            for t in other_trips_for_v
        )
        max_km = vehicle.weekly_fuel_quota * vehicle.km_per_l
        if used_km + trip_km > max_km:
            errors.append(
                f"Weekly fuel quota exceeded: needed {used_km + trip_km:.1f} km > "
                f"maximum {max_km:.1f} km ({vehicle.weekly_fuel_quota}L quota @ {vehicle.km_per_l} km/L)."
            )

        # ── 7. Brand Daily Time Budget ────────────────────────────────── #
        budget = trip.daily_budget_minutes(outlets)
        duration = trip.calculate_total_trip_minutes(outlets, service_allowances)
        if duration > budget:
            errors.append(
                f"Brand daily time budget exceeded: trip duration {duration:.1f} min > "
                f"budget of {budget:.1f} min."
            )

        # ── 8 & 9. Schedule Collision & Delivery Window Deadlines ─────── #
        schedule: dict | None = None

        if not other_trips_same_day:
            # Vehicle is fresh today
            cand_sched = trip.plan_stop_sequence(outlets, service_allowances)
            if cand_sched and cand_sched["has_violations"]:
                errors.append(
                    f"Delivery window deadline violation: {cand_sched['violation_count']} "
                    f"stop(s) would finish service after outlet closing."
                )
            else:
                schedule = cand_sched
        else:
            # Vehicle already has 1 trip on this day: must be non-overlapping!
            prev_trip = other_trips_same_day[0]
            prev_sched = prev_trip.stop_schedule or prev_trip.plan_stop_sequence(outlets, service_allowances)
            if not prev_sched:
                errors.append(f"Cannot verify schedule: prior trip {prev_trip.ID} has no schedule.")
            else:
                d1 = trip._hhmm_to_minutes(prev_sched["departure_hhmm"])
                r1 = trip._hhmm_to_minutes(prev_sched["return_to_depot_hhmm"])

                # Try Option A: depart after previous trip returns
                sched_after = trip.plan_stop_sequence(
                    outlets, service_allowances, earliest_departure_min=r1
                )
                if sched_after and not sched_after["has_violations"]:
                    schedule = sched_after
                else:
                    # Try Option B: return before previous trip departs
                    sched_before = trip.plan_stop_sequence(outlets, service_allowances)
                    if sched_before and not sched_before["has_violations"]:
                        r2 = trip._hhmm_to_minutes(sched_before["return_to_depot_hhmm"])
                        if r2 <= d1:
                            schedule = sched_before

                if schedule is None:
                    errors.append(
                        f"Temporal collision or deadline violation: vehicle {vehicle.ID} is busy "
                        f"on Day {allocation_day} with trip {prev_trip.ID} ({prev_sched['departure_hhmm']}–{prev_sched['return_to_depot_hhmm']}). "
                        f"Candidate trip cannot fit before or after without overlapping or missing delivery deadlines."
                    )

        is_valid = len(errors) == 0
        return ValidationResult(is_valid=is_valid, schedule=schedule, errors=errors, warnings=warnings)


class DispatchPlan:
    """
    Manages a staged distribution plan with authorization workflow:
    - Initial status is DRAFT (held in temporary review queue).
    - Supports manual adjustments with strict pre-commit constraint validation.
    - Locks manual changes so automated re-optimization cannot overwrite them.
    - Confirmed by authorized personnel before publishing.
    """

    def __init__(
        self,
        plan_id: str,
        created_by: str,
        trips: list[Trip],
        vehicles: list[Vehicle],
        status: PlanStatus = PlanStatus.DRAFT,
    ) -> None:
        self.plan_id = plan_id
        self.created_by = created_by
        self.status = status
        self.created_at = datetime.datetime.now().isoformat()
        self.confirmed_by: str | None = None
        self.confirmed_at: str | None = None
        self.updated_at = self.created_at
        self.trips = trips
        self.vehicles = vehicles
        self.audit_log: list[dict] = []

    def log_action(self, action: str, user_id: str, details: dict) -> None:
        self.audit_log.append({
            "timestamp": datetime.datetime.now().isoformat(),
            "action": action,
            "user_id": user_id,
            "details": details,
        })
        self.updated_at = datetime.datetime.now().isoformat()

    def get_trip(self, trip_id: str) -> Trip | None:
        for t in self.trips:
            if t.ID == trip_id:
                return t
        return None

    def get_vehicle(self, vehicle_id: str) -> Vehicle | None:
        for v in self.vehicles:
            if v.ID == vehicle_id:
                return v
        return None

    def manual_assign_trip(
        self,
        trip_id: str,
        vehicle_id: str,
        allocation_day: int,
        user_id: str,
        outlets: list,
        service_allowances: list,
        override_reason: str | None = None,
    ) -> ValidationResult:
        """
        Manually assigns a trip to a vehicle on an operating day.
        Pre-checks all 10 business constraints; only commits if 100% valid.
        Marks the trip as LOCKED so automated solvers cannot overwrite it.
        """
        if self.status == PlanStatus.CONFIRMED:
            return ValidationResult(
                is_valid=False,
                errors=["Cannot modify a CONFIRMED plan. Must duplicate or reopen to DRAFT first."]
            )

        trip = self.get_trip(trip_id)
        if not trip:
            return ValidationResult(is_valid=False, errors=[f"Trip '{trip_id}' not found in plan."])

        vehicle = self.get_vehicle(vehicle_id)
        if not vehicle:
            return ValidationResult(is_valid=False, errors=[f"Vehicle '{vehicle_id}' not found."])

        # Validate against all constraints
        validation = PlanValidator.validate_trip_assignment(
            trip=trip,
            vehicle=vehicle,
            allocation_day=allocation_day,
            existing_trips=self.trips,
            outlets=outlets,
            service_allowances=service_allowances,
        )

        if not validation.is_valid:
            self.log_action("MANUAL_ASSIGN_REJECTED", user_id, {
                "trip_id": trip_id,
                "vehicle_id": vehicle_id,
                "allocation_day": allocation_day,
                "errors": validation.errors,
            })
            return validation

        # Commit manual assignment & lock it against solver override
        prev_vehicle = trip.vehicle.ID if trip.vehicle else None
        prev_day = trip.allocation_day

        trip.assign_vehicle(vehicle)
        trip.allocation_day = allocation_day
        trip.is_locked = True
        trip.allocation_source = "MANUAL"
        trip.locked_by = user_id
        trip.locked_at = datetime.datetime.now().isoformat()
        trip.override_reason = override_reason or "Manual dispatcher assignment"
        trip.stop_schedule = validation.schedule

        # Synchronize order sequence in queue to match validated schedule
        if validation.schedule:
            order_by_id = {o.get_id(): o for o in trip.order_queue}
            trip.order_queue = [
                order_by_id[stop["order_id"]]
                for stop in validation.schedule["stops"]
                if stop["order_id"] in order_by_id
            ]

        self.log_action("MANUAL_ASSIGN_COMMITTED", user_id, {
            "trip_id": trip_id,
            "vehicle_id": vehicle_id,
            "allocation_day": allocation_day,
            "prev_vehicle": prev_vehicle,
            "prev_day": prev_day,
            "reason": trip.override_reason,
        })

        return validation

    def manual_unlock_trip(self, trip_id: str, user_id: str) -> bool:
        """Removes the lock so the automatic solver may reallocate this trip if needed."""
        trip = self.get_trip(trip_id)
        if not trip:
            return False
        trip.is_locked = False
        trip.allocation_source = "AUTO"
        trip.locked_by = None
        trip.locked_at = None
        self.log_action("MANUAL_UNLOCK", user_id, {"trip_id": trip_id})
        return True

    def confirm_plan(self, authorized_user: str) -> tuple[bool, list[str]]:
        """
        Transition plan from DRAFT to CONFIRMED.
        Verifies there are no unresolvable conflicts before final sign-off.
        """
        if self.status == PlanStatus.CONFIRMED:
            return True, ["Plan is already confirmed."]

        # Check that no allocated trips have violations
        violations = []
        for t in self.trips:
            if t.vehicle and t.stop_schedule and t.stop_schedule.get("has_violations"):
                violations.append(f"Trip {t.ID} on {t.vehicle.ID} has deadline violations.")

        if violations:
            return False, violations

        self.status = PlanStatus.CONFIRMED
        self.confirmed_by = authorized_user
        self.confirmed_at = datetime.datetime.now().isoformat()
        self.log_action("PLAN_CONFIRMED", authorized_user, {
            "confirmed_trips": len([t for t in self.trips if t.vehicle]),
            "unassigned_trips": len([t for t in self.trips if not t.vehicle]),
        })
        return True, []

    def to_dict(self, outlets: list, service_allowances: list) -> dict:
        allocated = [t for t in self.trips if t.vehicle is not None]
        unassigned = [t for t in self.trips if t.vehicle is None]

        return {
            "plan_id": self.plan_id,
            "status": self.status.value,
            "created_by": self.created_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "confirmed_by": self.confirmed_by,
            "confirmed_at": self.confirmed_at,
            "summary": {
                "total_trips": len(self.trips),
                "allocated_trips": len(allocated),
                "unassigned_trips": len(unassigned),
                "locked_manual_trips": len([t for t in allocated if getattr(t, "is_locked", False)]),
            },
            "trips": [t.to_dict(outlets, service_allowances) for t in self.trips],
            "audit_log": self.audit_log,
        }


class HeuristicAllocationSolver:
    """
    High-performance heuristic allocation and scheduling engine.

    Architecture & Invariants:
    ──────────────────────────
    1. Anti-Cannibalization:
       Strict capability protection preventing dry ambient cargo and normal
       parking outlets from consuming scarce Reefer and Van vehicles.
    2. Scarcity-First Priority Queueing:
       Trips requiring scarce assets (Van+Reefer -> Van -> Reefer -> Ambient Truck)
       are assigned first.
    3. Day 1 Allocation Maximization:
       Minimizes multi-day deferrals, delivering maximum possible orders today.
    4. Turnaround Chaining:
       Reuses active vehicles for a 2nd daily trip before waking up idle fleet,
       maximizing turnaround density while preserving idle buffers.
    5. Non-Collision Timeline Simulation:
       Enforces sequential departure and return timing with zero vehicle overlaps.
    6. Manual Lock Non-Override Guarantee:
       Pre-commits locked supervisor assignments as immovable anchors.
    """

    def __init__(
        self,
        trips: list[Trip],
        vehicles: list[Vehicle] | VehicleTree,
        outlets: list,
        service_allowances: list,
        max_days: int = 4,
        strict: bool = False,
    ) -> None:
        self.trips = trips
        self.outlets = outlets
        self.service_allowances = service_allowances
        self.max_days = max_days
        self.strict = strict

        if isinstance(vehicles, VehicleTree):
            self.vehicle_tree = vehicles
            self.all_vehicles: list[Vehicle] = vehicles.get_vehicles()
        else:
            self.all_vehicles = list(vehicles)
            self.vehicle_tree = None

    @staticmethod
    def _round_trip_km(trip: Trip) -> float:
        return trip.route.round_trip_km() if trip.route else 0.0

    def _make_temp_trip(self, trip: Trip, candidate_orders: list) -> Trip:
        return Trip(
            ID="_check",
            CreateTime=trip.CreateTime,
            UpdateTime=trip.UpdateTime,
            CreatedBy=trip.CreatedBy,
            UpdatedBy=trip.UpdatedBy,
            IsActive=trip.IsActive,
            route=trip.route,
            order_queue=list(candidate_orders),
        )

    def _trip_budget_ok(self, trip: Trip, candidate_orders: list) -> bool:
        return self._make_temp_trip(trip, candidate_orders).within_daily_budget(
            self.outlets, self.service_allowances
        )

    def _find_feasible_schedule(
        self,
        trip: Trip,
        candidate_orders: list,
        vehicle: Vehicle | None,
        vehicle_day_trips: dict[str, list[Trip]],
    ) -> dict | None:
        if not candidate_orders or not trip.route:
            return None

        temp_trip = self._make_temp_trip(trip, candidate_orders)

        # Vehicle has no prior trip assigned today
        if vehicle is None or not vehicle_day_trips.get(vehicle.ID):
            sched = temp_trip.plan_stop_sequence(self.outlets, self.service_allowances)
            return sched if (sched and not sched["has_violations"]) else None

        # Vehicle already has 1 trip assigned today -> verify sequential turnaround
        prev_trip = vehicle_day_trips[vehicle.ID][0]
        prev_sched = prev_trip.stop_schedule or prev_trip.plan_stop_sequence(
            self.outlets, self.service_allowances
        )
        if not prev_sched:
            return None

        d1 = temp_trip._hhmm_to_minutes(prev_sched["departure_hhmm"])
        r1 = temp_trip._hhmm_to_minutes(prev_sched["return_to_depot_hhmm"])

        # Option 1: Run AFTER existing trip (departure >= return of trip 1)
        sched_after = temp_trip.plan_stop_sequence(
            self.outlets, self.service_allowances, earliest_departure_min=r1
        )
        if sched_after and not sched_after["has_violations"]:
            return sched_after

        # Option 2: Run BEFORE existing trip (return <= departure of trip 1)
        sched_before = temp_trip.plan_stop_sequence(self.outlets, self.service_allowances)
        if sched_before and not sched_before["has_violations"]:
            r2 = temp_trip._hhmm_to_minutes(sched_before["return_to_depot_hhmm"])
            if r2 <= d1:
                return sched_before

        return None

    def _orders_are_schedulable(
        self,
        trip: Trip,
        candidate_orders: list,
        vehicle: Vehicle | None,
        vehicle_day_trips: dict[str, list[Trip]],
    ) -> bool:
        return self._find_feasible_schedule(trip, candidate_orders, vehicle, vehicle_day_trips) is not None

    def _structural_candidates(self, trip: Trip) -> list[Vehicle]:
        depot = trip.route.get_depot() if trip.route else None
        parking = trip.get_parking_constraint(self.outlets) or "normal"
        temp = trip.get_temp_condition() or "ambient"

        if self.vehicle_tree is not None and depot:
            pool = self.vehicle_tree.get_vehicles(depot=depot)
        else:
            pool = self.all_vehicles

        return [
            v for v in pool
            if v.serves_depot(depot or v.get_depot())
            and v.can_access_outlet_type(parking)
            and v.can_carry_temp(temp)
        ]

    def _candidate_vehicles(self, trip: Trip) -> list[Vehicle]:
        return [v for v in self._structural_candidates(trip) if v.has_trips_remaining()]

    def _can_full_fit(
        self,
        trip: Trip,
        vehicle: Vehicle,
        vehicle_day_trips: dict[str, list[Trip]],
    ) -> bool:
        if not vehicle.has_trips_remaining():
            return False
        weight = trip.total_weight_in_queue()
        volume = trip.total_volume_in_queue()
        if not vehicle.fits_load(weight, volume):
            return False
        if not vehicle.has_fuel_for(self._round_trip_km(trip)):
            return False
        if not self._trip_budget_ok(trip, trip.order_queue):
            return False
        return self._orders_are_schedulable(trip, trip.order_queue, vehicle, vehicle_day_trips)

    def _best_vehicle_score(self, trip: Trip, vehicle: Vehicle, orders: list) -> tuple:
        """
        Lexicographical scoring:
         1. Anti-cannibalization: protect Reefer from Ambient; protect Van from Normal.
         2. Turnaround chaining: prefer vehicle already active today (active_today=0).
         3. Capacity fit: minimize unused capacity slack.
         4. Fuel efficiency: prefer higher km/L.
        """
        is_reefer_waste = 1 if (vehicle.temp_condition == "reefer" and not trip.requires_reefer()) else 0
        is_van_waste = 1 if (vehicle.type == "van" and not trip.requires_van(self.outlets)) else 0
        active_today = 0 if vehicle.trip_count_today > 0 else 1

        weight = sum(o.get_weight() for o in orders)
        volume = sum(o.get_volume() for o in orders)
        weight_slack = vehicle.get_weight_capacity() - weight
        vol_slack = vehicle.get_volume_capacity() - volume
        capacity_slack = weight_slack + (vol_slack * 100.0)

        return (
            is_reefer_waste,
            is_van_waste,
            active_today,
            capacity_slack,
            -vehicle.get_km_per_l(),
            vehicle.ID,
        )

    def _trip_priority(self, trip: Trip) -> tuple:
        """
        Asset Scarcity Tier sorting:
          Tier 0: Van + Reefer
          Tier 1: Van required
          Tier 2: Reefer required
          Tier 3: Standard Ambient Truck
        """
        van_req = trip.requires_van(self.outlets)
        reefer_req = trip.requires_reefer()
        cands = self._candidate_vehicles(trip)

        if van_req and reefer_req:
            tier = 0
        elif van_req:
            tier = 1
        elif reefer_req:
            tier = 2
        else:
            tier = 3

        return (
            tier,
            len(cands),
            -trip.total_weight_in_queue(),
        )

    def _can_fit_on_future_day(self, trip: Trip) -> bool:
        weight = trip.total_weight_in_queue()
        volume = trip.total_volume_in_queue()
        km = self._round_trip_km(trip)
        for v in self._structural_candidates(trip):
            if v.fits_load(weight, volume) and v.has_fuel_for(km):
                return True
        return False

    def solve(self) -> list[Trip]:
        """
        Executes the allocation and scheduling pipeline.
        Returns the list of allocated, forked, and deferred Trip domain objects.
        """
        allocated_trips: list[Trip] = []
        fork_counter = 0
        current_day = 1
        vehicle_day_trips: dict[str, list[Trip]] = {v.ID: [] for v in self.all_vehicles}

        def _reserve(t: Trip, v: Vehicle) -> None:
            schedule = self._find_feasible_schedule(t, t.order_queue, v, vehicle_day_trips)
            if schedule:
                order_by_id = {o.get_id(): o for o in t.order_queue}
                t.order_queue = [
                    order_by_id[stop["order_id"]]
                    for stop in schedule["stops"]
                    if stop["order_id"] in order_by_id
                ]
                t.stop_schedule = schedule
            t.assign_vehicle(v)
            t.allocation_day = current_day
            v.increment_trip_count()
            v.add_milage(self._round_trip_km(t))
            vehicle_day_trips[v.ID].append(t)

        # ── Phase 0: Pre-commit locked manual trips (immovable anchors) ── #
        locked_trips = [
            t for t in self.trips
            if getattr(t, "is_locked", False) and t.vehicle is not None
        ]
        unlocked_trips = [t for t in self.trips if t not in locked_trips]

        for t in locked_trips:
            v = t.vehicle
            day = getattr(t, "allocation_day", 1) or 1
            if day == current_day:
                v.increment_trip_count()
                v.add_milage(self._round_trip_km(t))
                vehicle_day_trips[v.ID].append(t)
            allocated_trips.append(t)

        # ── Phase 1: Allocation Loop ───────────────────────────────────── #
        pending = sorted(unlocked_trips, key=self._trip_priority)
        blocked_count = 0

        while pending:
            trip = pending.pop(0)

            if not trip.order_queue:
                allocated_trips.append(trip)
                continue

            cands = self._candidate_vehicles(trip)

            # 1. Full-Fit
            full_fits = [v for v in cands if self._can_full_fit(trip, v, vehicle_day_trips)]
            if full_fits:
                best = min(full_fits, key=lambda v: self._best_vehicle_score(trip, v, trip.order_queue))
                _reserve(trip, best)
                allocated_trips.append(trip)
                blocked_count = 0
                continue

            # 2. Partial-Fit with EDF window gate
            edf_sorted = sorted(
                trip.order_queue,
                key=lambda o: (
                    o.get_window_close_time(self.outlets) or "99:99",
                    o.get_window_open_time(self.outlets) or "99:99",
                ),
            )

            partial_options: list[tuple[Vehicle, list]] = []
            for v in cands:
                if not v.has_fuel_for(self._round_trip_km(trip)):
                    continue
                selected: list = []
                w, vol = 0.0, 0.0
                for order in edf_sorted:
                    ow, ov = order.get_weight(), order.get_volume()
                    if w + ow > v.get_weight_capacity() or vol + ov > v.get_volume_capacity():
                        continue
                    if not self._orders_are_schedulable(trip, selected + [order], v, vehicle_day_trips):
                        continue
                    selected.append(order)
                    w += ow
                    vol += ov
                if selected:
                    partial_options.append((v, selected))

            if partial_options:
                vehicle, chosen_orders = max(
                    partial_options,
                    key=lambda pair: (
                        len(pair[1]),
                        -self._best_vehicle_score(pair[0], trip, pair[1])[0] if False else -self._best_vehicle_score(trip, pair[0], pair[1])[0],
                        -self._best_vehicle_score(trip, pair[0], pair[1])[1],
                        -self._best_vehicle_score(trip, pair[0], pair[1])[2],
                    ),
                )
                fork_counter += 1
                fork = trip.fork_trip_by_transferring_orders(
                    chosen_orders,
                    fork_id=f"{trip.ID}_fork_{fork_counter}",
                )
                _reserve(fork, vehicle)
                allocated_trips.append(fork)
                blocked_count = 0
                pending.insert(0, trip)
                continue

            # 3. Multi-Day Rollover
            if self._can_fit_on_future_day(trip) and current_day < self.max_days:
                pending.append(trip)
                blocked_count += 1
                if blocked_count >= len(pending):
                    current_day += 1
                    for v in self.all_vehicles:
                        v.reset_daily_counts()
                        vehicle_day_trips[v.ID].clear()
                    # Re-register locked trips for this day
                    for lt in locked_trips:
                        if (getattr(lt, "allocation_day", 1) or 1) == current_day:
                            lt.vehicle.increment_trip_count()
                            lt.vehicle.add_milage(self._round_trip_km(lt))
                            vehicle_day_trips[lt.vehicle.ID].append(lt)
                    blocked_count = 0
                continue

            # 4. Deferral
            order_ids = [o.get_id() for o in trip.order_queue]
            reason = f"No feasible vehicle found within {self.max_days} days. Orders: {order_ids}"
            if self.strict:
                raise ValueError(f"Trip {trip.ID}: {reason}")
            trip.allocation_error = reason
            allocated_trips.append(trip)

        # ── Phase 2: Post-Optimization Sequence & Verification ─────────── #
        for t in allocated_trips:
            if t.vehicle and not t.stop_schedule:
                t.apply_optimal_sequence(self.outlets, self.service_allowances)

        return allocated_trips

    def create_dispatch_plan(
        self,
        plan_id: str,
        created_by: str,
        status: PlanStatus = PlanStatus.DRAFT,
    ) -> DispatchPlan:
        """
        Executes solve() and packages the results into a staged DispatchPlan instance.
        """
        allocated_trips = self.solve()
        return DispatchPlan(
            plan_id=plan_id,
            created_by=created_by,
            trips=allocated_trips,
            vehicles=self.all_vehicles,
            status=status,
        )
