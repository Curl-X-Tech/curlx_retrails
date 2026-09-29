"""
Trip domain model.
"""

from __future__ import annotations

import math
import datetime
from app.domain.Base import BaseModel
from app.domain.Service_allowance import ServiceAllowance

FRESH_BUDGET_MINUTES = 270          # 03:30–08:00
STYLE_TECH_BUDGET_MINUTES = 480     # full trading day

FRESH_WINDOW_START = "03:30"
FRESH_WINDOW_END = "08:00"


class Trip(BaseModel):
    def __init__(
        self,
        ID: str,
        CreateTime,
        UpdateTime,
        CreatedBy: str | None,
        UpdatedBy: str | None,
        IsActive: bool,
        route=None,
        vehicle=None,
        order_queue: list | None = None,
        outlets=None,
    ) -> None:
        super().__init__(ID, CreateTime, UpdateTime, CreatedBy, UpdatedBy, IsActive)
        self.route = route
        self.vehicle = vehicle
        self.order_queue: list = self._sorted_queue(order_queue or [], outlets)

        self.allocation_day: int | None = None
        self.allocation_error: str | None = None
        self.stop_schedule: dict | None = None

        self.is_locked: bool = False
        self.allocation_source: str = "AUTO"
        self.locked_by: str | None = None
        self.locked_at: str | None = None
        self.override_reason: str | None = None

    def _sorted_queue(self, orders: list, outlets) -> list:
        if not orders or outlets is None:
            return list(orders)

        def _sort_key(order):
            t = order.get_window_open_time(outlets)
            return t if t is not None else "99:99"

        return sorted(orders, key=_sort_key)

    def set_order_queue(self, orders: list, outlets) -> None:
        self.order_queue = self._sorted_queue(orders, outlets)

    def add_order_to_queue(self, order, outlets=None) -> bool:
        if order in self.order_queue:
            return False
        if self.vehicle is not None:
            new_weight = self.total_weight_in_queue() + order.get_weight()
            new_volume = self.total_volume_in_queue() + order.get_volume()
            if not self.vehicle.fits_load(new_weight, new_volume):
                return False
            if not self.vehicle.can_carry_temp(order.get_temp_condition()):
                return False
        self.order_queue.append(order)
        return True

    def eliminate_order_from_queue(self, order) -> bool:
        if order in self.order_queue:
            self.order_queue.remove(order)
            return True
        return False

    def pop_order_from_queue(self):
        return self.order_queue.pop(0) if self.order_queue else None

    def assign_vehicle(self, vehicle) -> None:
        self.vehicle = vehicle

    def assign_route(self, route) -> None:
        self.route = route

    def total_weight_in_queue(self) -> float:
        return sum(o.get_weight() for o in self.order_queue)

    def total_volume_in_queue(self) -> float:
        return sum(o.get_volume() for o in self.order_queue)

    def remaining_weight_capacity(self) -> float:
        if self.vehicle is None:
            return math.inf
        return self.vehicle.get_weight_capacity() - self.total_weight_in_queue()

    def remaining_volume_capacity(self) -> float:
        if self.vehicle is None:
            return math.inf
        return self.vehicle.get_volume_capacity() - self.total_volume_in_queue()

    def get_brand(self, outlets) -> str | None:
        if self.order_queue:
            return self.order_queue[0].get_brand(outlets)
        return None

    def get_parking_constraint(self, outlets) -> str | None:
        if self.order_queue:
            return self.order_queue[0].get_parking_constraint(outlets)
        return None

    def get_temp_condition(self) -> str | None:
        if self.order_queue:
            return self.order_queue[0].get_temp_condition()
        return None

    def requires_reefer(self) -> bool:
        return any(o.requires_reefer() for o in self.order_queue)

    def requires_van(self, outlets) -> bool:
        return any(
            o.get_parking_constraint(outlets) == "van_only"
            for o in self.order_queue
        )

    @staticmethod
    def _hhmm_to_minutes(hhmm: str) -> int:
        h, m = hhmm.split(":")
        return int(h) * 60 + int(m)

    @staticmethod
    def _minutes_to_hhmm(minutes: float) -> str:
        total = max(0, int(round(minutes)))
        h = total // 60
        m = total % 60
        return f"{h:02d}:{m:02d}"

    def get_earliest_open_time(self, outlets) -> str | None:
        times = [
            o.get_window_open_time(outlets)
            for o in self.order_queue
            if o.get_window_open_time(outlets) is not None
        ]
        return min(times) if times else None

    def get_latest_close_time(self, outlets) -> str | None:
        times = [
            o.get_window_close_time(outlets)
            for o in self.order_queue
            if o.get_window_close_time(outlets) is not None
        ]
        return max(times) if times else None

    def get_earliest_close_time(self, outlets) -> str | None:
        times = [
            o.get_window_close_time(outlets)
            for o in self.order_queue
            if o.get_window_close_time(outlets) is not None
        ]
        return min(times) if times else None

    def _service_allowances_per_stop(self, outlets, service_allowances) -> list[float]:
        result = []
        for order in self.order_queue:
            brand = order.get_brand(outlets)
            dock_type = order.get_dock_type(outlets)
            minutes = ServiceAllowance.get_service_allowance(brand, dock_type, service_allowances)
            result.append(minutes if minutes is not None else 0.0)
        return result

    def calculate_total_trip_minutes(self, outlets, service_allowances) -> float:
        if not self.route or not self.order_queue:
            return 0.0
        allowances = self._service_allowances_per_stop(outlets, service_allowances)
        return self.route.calculate_trip_minutes(len(self.order_queue), allowances)

    def calculate_total_delivery_time(self, outlets, service_allowances) -> float:
        return self.calculate_total_trip_minutes(outlets, service_allowances)

    def calculate_total_in_district_delivery_time(self, outlets, service_allowances) -> float:
        if not self.route or not self.order_queue:
            return 0.0
        stops = len(self.order_queue)
        inter_stop = self.route.get_inter_stop_freeflow_min() * max(0, stops - 1)
        allowances = self._service_allowances_per_stop(outlets, service_allowances)
        return inter_stop + sum(allowances)

    def daily_budget_minutes(self, outlets) -> int:
        brand = self.get_brand(outlets)
        if brand == "Fresh":
            return FRESH_BUDGET_MINUTES
        return STYLE_TECH_BUDGET_MINUTES

    def satisfy_time_window(self, outlets, service_allowances) -> bool:
        open_t = self.get_earliest_open_time(outlets)
        close_t = self.get_latest_close_time(outlets)
        if open_t is None or close_t is None:
            return True
        window_minutes = self._hhmm_to_minutes(close_t) - self._hhmm_to_minutes(open_t)
        if window_minutes <= 0:
            return False
        trip_minutes = self.calculate_total_in_district_delivery_time(outlets, service_allowances)
        return trip_minutes <= window_minutes

    def within_daily_budget(self, outlets, service_allowances) -> bool:
        budget = self.daily_budget_minutes(outlets)
        return self.calculate_total_trip_minutes(outlets, service_allowances) <= budget

    def satisfy_time_constaints(self, outlets, service_allowances) -> bool:
        return self.satisfy_time_window(outlets, service_allowances)

    _DEPARTURE_FLOOR: dict[str, str] = {
        "Fresh": "03:30",
        "Style": "07:00",
        "Tech":  "07:00",
    }

    def plan_stop_sequence(
        self,
        outlets,
        service_allowances,
        earliest_departure_min: float | None = None,
    ) -> dict | None:
        if not self.order_queue or not self.route:
            return None

        outbound_min   = self.route.get_depot_to_district_freeflow_min()
        inter_stop_min = self.route.get_inter_stop_freeflow_min()
        brand          = self.get_brand(outlets) or "Fresh"
        floor_hhmm     = self._DEPARTURE_FLOOR.get(brand, "03:30")

        def _edf_key(order):
            close = order.get_window_close_time(outlets)
            open_ = order.get_window_open_time(outlets)
            return (close or "99:99", open_ or "99:99")

        ordered = sorted(self.order_queue, key=_edf_key)

        open_times = [
            o.get_window_open_time(outlets)
            for o in ordered
            if o.get_window_open_time(outlets)
        ]
        earliest_open_min = (
            self._hhmm_to_minutes(min(open_times))
            if open_times else self._hhmm_to_minutes(floor_hhmm)
        )
        depart_min = earliest_open_min - outbound_min
        depart_min = max(depart_min, self._hhmm_to_minutes(floor_hhmm))
        if earliest_departure_min is not None:
            depart_min = max(depart_min, int(earliest_departure_min))

        current_min  = depart_min + outbound_min
        stops        = []
        total_wait   = 0.0
        violations   = 0

        for i, order in enumerate(ordered):
            if i > 0:
                current_min += inter_stop_min

            open_t  = order.get_window_open_time(outlets)
            close_t = order.get_window_close_time(outlets)
            open_min  = self._hhmm_to_minutes(open_t)  if open_t  else 0
            close_min = self._hhmm_to_minutes(close_t) if close_t else 1439

            arrive_min     = current_min
            early_by       = max(0.0, open_min  - arrive_min)
            svc_start_min  = arrive_min + early_by
            total_wait    += early_by

            svc_brand = order.get_brand(outlets)
            dock      = order.get_dock_type(outlets)
            allowance = (
                ServiceAllowance.get_service_allowance(svc_brand, dock, service_allowances)
                or 0.0
            )

            leave_min      = svc_start_min + allowance
            current_min    = leave_min

            late_by        = max(0.0, leave_min - close_min)
            on_time        = late_by == 0
            if not on_time:
                violations += 1

            stops.append({
                "seq":                  i + 1,
                "order_id":             order.get_id(),
                "outlet_id":            order.outlet_id,
                "weight_kg":            order.get_weight(),
                "volume_m3":            order.get_volume(),
                "window_open":          open_t,
                "window_close":         close_t,
                "arrive_hhmm":          self._minutes_to_hhmm(arrive_min),
                "early_by_min":         round(early_by),
                "service_start_hhmm":   self._minutes_to_hhmm(svc_start_min),
                "service_allowance_min": allowance,
                "depart_hhmm":          self._minutes_to_hhmm(leave_min),
                "on_time":              on_time,
                "late_by_min":          round(late_by),
            })

        return {
            "sequence_method":          "EDF",
            "departure_hhmm":           self._minutes_to_hhmm(depart_min),
            "arrival_at_district_hhmm": self._minutes_to_hhmm(depart_min + outbound_min),
            "return_to_depot_hhmm":     self._minutes_to_hhmm(current_min + outbound_min),
            "stops":                    stops,
            "has_violations":           violations > 0,
            "violation_count":          violations,
            "total_wait_min":           round(total_wait),
        }

    def apply_optimal_sequence(
        self,
        outlets,
        service_allowances,
        earliest_departure_min: float | None = None,
    ) -> dict | None:
        schedule = self.plan_stop_sequence(
            outlets, service_allowances, earliest_departure_min=earliest_departure_min
        )
        if schedule is None:
            return None
        order_by_id = {o.get_id(): o for o in self.order_queue}
        self.order_queue = [
            order_by_id[stop["order_id"]]
            for stop in schedule["stops"]
            if stop["order_id"] in order_by_id
        ]
        self.stop_schedule = schedule
        return schedule

    def fork_trip_by_transferring_orders(self, orders_to_transfer: list, fork_id: str | None = None) -> "Trip":
        import datetime

        new_trip = Trip(
            ID=fork_id or f"{self.ID}_fork",
            CreateTime=self.CreateTime,
            UpdateTime=datetime.datetime.now(),
            CreatedBy=self.CreatedBy,
            UpdatedBy=self.UpdatedBy,
            IsActive=self.IsActive,
            route=self.route,
            vehicle=None,
            order_queue=[],
        )

        for order in orders_to_transfer:
            if order in self.order_queue:
                self.order_queue.remove(order)
                new_trip.order_queue.append(order)

        return new_trip

    def to_dict(self, outlets, service_allowances) -> dict:
        schedule = self.stop_schedule or self.plan_stop_sequence(outlets, service_allowances)
        d = self._audit_dict()
        d.update(
            vehicle=self.vehicle.ID if self.vehicle else None,
            allocation_day=self.allocation_day,
            allocation_error=self.allocation_error,
            route=self.route.to_dict_compact() if self.route else None,
            order_queue=[o.get_id() for o in self.order_queue],
            brand=self.get_brand(outlets),
            parking_constraint=self.get_parking_constraint(outlets),
            temp_condition=self.get_temp_condition(),
            requires_reefer=self.requires_reefer(),
            total_weight_kg=self.total_weight_in_queue(),
            total_volume_m3=self.total_volume_in_queue(),
            trip_minutes=self.calculate_total_trip_minutes(outlets, service_allowances),
            in_district_minutes=self.calculate_total_in_district_delivery_time(outlets, service_allowances),
            daily_budget_minutes=self.daily_budget_minutes(outlets),
            within_daily_budget=self.within_daily_budget(outlets, service_allowances),
            satisfy_time_window=self.satisfy_time_window(outlets, service_allowances),
            orders=[o.to_dict_compact(outlets) for o in self.order_queue],
            stop_schedule=schedule,
            is_locked=getattr(self, "is_locked", False),
            allocation_source=getattr(self, "allocation_source", "AUTO"),
            locked_by=getattr(self, "locked_by", None),
            locked_at=getattr(self, "locked_at", None),
            override_reason=getattr(self, "override_reason", None),
        )
        return d

    def __str__(self) -> str:
        vehicle_id = self.vehicle.ID if self.vehicle else "unassigned"
        return (
            f"Trip(ID={self.ID}, vehicle={vehicle_id}, "
            f"orders={len(self.order_queue)}, "
            f"weight={self.total_weight_in_queue():.1f}kg, "
            f"volume={self.total_volume_in_queue():.2f}m³)"
        )

    def __repr__(self) -> str:
        return self.__str__()
