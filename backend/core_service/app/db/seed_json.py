import json
from collections import Counter
from collections.abc import Iterator
from dataclasses import dataclass, field
from datetime import date, datetime, time
from enum import Enum
from pathlib import Path
from typing import Any

from app.enums.master import DeliveryWindowType, DockType, ParkingConstraint
from app.enums.roles import UserType
from app.schemas.dispatch_schemas import StopStatus, TripLiveStatus
from app.schemas.order_schemas import OrderStatus, TempCondition
from app.schemas.route_schemas import RoadClass

SEED_DIR = Path(__file__).resolve().parent / "seed_data"
VEHICLE_TYPES = {"truck", "van"}
TEMP_CONDITIONS = {"reefer", "ambient"}
SPECIAL_HANDLING_CODES = {"COL", "FRG", "MAL", "HAZ"}


class SeedValidationError(Exception):
    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__(f"{len(errors)} seed data problem(s):\n" + "\n".join(errors))


class Row:
    def __init__(self, file: str, line: int, data: dict[str, str], errors: list[str]):
        self.file, self.line, self.data, self.errors = file, line, data, errors

    def fail(self, message: str) -> None:
        self.errors.append(f"{self.file}[{self.line}]: {message}")

    def text(self, col: str, required: bool = True) -> str | None:
        raw = self.data.get(col)
        value = "" if raw is None else str(raw).strip()
        if not value and required:
            self.fail(f"'{col}' is required")
        return value or None

    def number(self, col: str, lo: float | None = None, hi: float | None = None, required: bool = True) -> float | None:
        raw = self.text(col, required)
        if raw is None:
            return None
        try:
            value = float(raw)
        except ValueError:
            self.fail(f"'{col}' is not a number: {raw!r}")
            return None
        if (lo is not None and value < lo) or (hi is not None and value > hi):
            self.fail(f"'{col}' out of range: {raw}")
        return value

    def integer(self, col: str, lo: int | None = None) -> int | None:
        value = self.number(col, lo)
        return None if value is None else int(value)

    def flag(self, col: str, default: bool | None = None) -> bool | None:
        raw = self.text(col, required=default is None)
        if raw is None:
            return default
        if raw.lower() in {"1", "true"}:
            return True
        if raw.lower() in {"0", "false"}:
            return False
        self.fail(f"'{col}' is not a boolean: {raw!r}")
        return None

    def choice(self, col: str, enum_cls: type[Enum]) -> Any:
        raw = self.text(col)
        if raw is None:
            return None
        try:
            return enum_cls(raw.lower())
        except ValueError:
            self.fail(f"'{col}' must be one of {[e.value for e in enum_cls]}: {raw!r}")
            return None

    def member(self, col: str, allowed: set[str]) -> str | None:
        raw = self.text(col)
        if raw is not None and raw not in allowed:
            self.fail(f"'{col}' must be one of {sorted(allowed)}: {raw!r}")
            return None
        return raw

    def clock(self, col: str) -> time | None:
        raw = self.text(col)
        if raw is None:
            return None
        try:
            return time.fromisoformat(raw)
        except ValueError:
            self.fail(f"'{col}' is not a time (HH:MM[:SS]): {raw!r}")
            return None

    def stamp(self, col: str) -> datetime | None:
        raw = self.text(col)
        if raw is None:
            return None
        try:
            value = datetime.fromisoformat(raw)
        except ValueError:
            self.fail(f"'{col}' is not an ISO timestamp: {raw!r}")
            return None
        if value.tzinfo is None:
            self.fail(f"'{col}' must include a UTC offset: {raw!r}")
        return value

    def hhmm(self, col: str, required: bool = True) -> str | None:
        raw = self.text(col, required)
        if raw is not None:
            try:
                datetime.strptime(raw, "%H:%M")
            except ValueError:
                self.fail(f"'{col}' must be HH:MM: {raw!r}")
                return None
        return raw

    def day(self, col: str) -> date | None:
        raw = self.text(col)
        if raw is None:
            return None
        try:
            return date.fromisoformat(raw)
        except ValueError:
            self.fail(f"'{col}' is not a date (YYYY-MM-DD): {raw!r}")
            return None


def read_rows(filename: str, columns: list[str], errors: list[str]) -> Iterator[Row]:
    path = SEED_DIR / filename
    if not path.exists():
        errors.append(f"{filename}: file not found")
        return
    try:
        records = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"{filename}: invalid JSON ({exc})")
        return
    if not isinstance(records, list):
        errors.append(f"{filename}: top level must be a list of objects")
        return
    for index, data in enumerate(records, start=1):
        if not isinstance(data, dict):
            errors.append(f"{filename}[{index}]: record must be an object")
            continue
        missing = [c for c in columns if c not in data]
        if missing:
            errors.append(f"{filename}[{index}]: missing keys {missing}")
            continue
        yield Row(filename, index, data, errors)


def check_unique(rows: list[dict[str, Any]], key: str, filename: str, errors: list[str]) -> None:
    for value, count in Counter(r[key] for r in rows if r[key] is not None).items():
        if count > 1:
            errors.append(f"{filename}: duplicate {key} {value!r} ({count} rows)")


def check_parent(
    rows: list[dict[str, Any]], key: str, parents: set[Any], filename: str, parent: str, errors: list[str]
) -> None:
    for r in rows:
        if r[key] is not None and r[key] not in parents:
            errors.append(f"{filename}: orphan {key} {r[key]!r} has no row in {parent}")


@dataclass
class SeedData:
    depots: list[dict[str, Any]] = field(default_factory=list)
    brands: list[dict[str, Any]] = field(default_factory=list)
    districts: list[dict[str, Any]] = field(default_factory=list)
    items: list[dict[str, Any]] = field(default_factory=list)
    prices: list[dict[str, Any]] = field(default_factory=list)
    outlets: list[dict[str, Any]] = field(default_factory=list)
    calendar: list[dict[str, Any]] = field(default_factory=list)
    vehicles: list[dict[str, Any]] = field(default_factory=list)
    users: list[dict[str, Any]] = field(default_factory=list)
    drivers: list[dict[str, Any]] = field(default_factory=list)
    routes: list[dict[str, Any]] = field(default_factory=list)
    allowances: list[dict[str, Any]] = field(default_factory=list)
    orders: list[dict[str, Any]] = field(default_factory=list)
    trips: list[dict[str, Any]] = field(default_factory=list)
    logs: list[dict[str, Any]] = field(default_factory=list)


def resolve_depot(label: str, depots: list[dict[str, Any]]) -> str | None:
    """Maps a depot label such as 'Peliyagoda' to a depot code by code, name, or name prefix."""
    needle = label.lower()
    matches = [
        d["code"]
        for d in depots
        if needle in (d["code"].lower(), d["name"].lower()) or d["name"].lower().startswith(needle + " ")
    ]
    return matches[0] if len(matches) == 1 else None


def load_seed_data(include_demo: bool) -> SeedData:
    errors: list[str] = []
    d = SeedData()

    for r in read_rows("depots.json", ["code", "name", "latitude", "longitude", "address", "is_active"], errors):
        d.depots.append(
            {
                "code": (r.text("code") or "").upper() or None,
                "name": r.text("name"),
                "latitude": r.number("latitude", -90, 90),
                "longitude": r.number("longitude", -180, 180),
                "address": r.text("address", False),
                "is_active": r.flag("is_active", True),
            }
        )
    for r in read_rows(
        "brands.json", ["code", "name", "delivery_window_type", "requires_cold_chain", "daily_time_budget_min"], errors
    ):
        d.brands.append(
            {
                "code": (r.text("code") or "").upper() or None,
                "name": r.text("name"),
                "delivery_window_type": r.choice("delivery_window_type", DeliveryWindowType),
                "requires_cold_chain": r.flag("requires_cold_chain"),
                "daily_time_budget_min": r.integer("daily_time_budget_min", 1),
            }
        )
    for r in read_rows("districts.json", ["name", "province", "depot_code"], errors):
        d.districts.append(
            {
                "name": r.text("name"),
                "province": r.text("province"),
                "depot_code": (r.text("depot_code") or "").upper() or None,
            }
        )
    for r in read_rows(
        "items.json",
        [
            "sku",
            "brand_code",
            "name",
            "category",
            "unit",
            "unit_weight_kg",
            "unit_volume_m3",
            "requires_cold_chain",
            "special_handling_code",
        ],
        errors,
    ):
        code = r.text("special_handling_code", False)
        if code is not None and code not in SPECIAL_HANDLING_CODES:
            r.fail(f"'special_handling_code' must be one of {sorted(SPECIAL_HANDLING_CODES)}: {code!r}")
        d.items.append(
            {
                "sku": (r.text("sku") or "").upper() or None,
                "brand_code": (r.text("brand_code") or "").upper() or None,
                "name": r.text("name"),
                "category": r.text("category"),
                "unit": r.text("unit", False) or "Nos",
                "unit_weight_kg": r.number("unit_weight_kg", 0),
                "unit_volume_m3": r.number("unit_volume_m3", 0),
                "requires_cold_chain": r.flag("requires_cold_chain", code == "COL"),
                "special_handling_code": code,
            }
        )
    for r in read_rows("prices.json", ["sku", "cost_price", "unit_price", "currency", "price_change_reason"], errors):
        d.prices.append(
            {
                "sku": (r.text("sku") or "").upper() or None,
                "cost_price": r.number("cost_price", 0),
                "unit_price": r.number("unit_price", 0),
                "currency": r.text("currency", False) or "LKR",
                "price_change_reason": r.text("price_change_reason", False) or "standard_pricing",
            }
        )
    for r in read_rows(
        "outlets.json",
        [
            "outlet_id",
            "brand",
            "district",
            "depot",
            "dock_type",
            "parking_constraint",
            "mall_window",
            "window_open_time",
            "window_close_time",
        ],
        errors,
    ):
        opens, closes = r.clock("window_open_time"), r.clock("window_close_time")
        if opens and closes and opens >= closes:
            r.fail("window_open_time must be earlier than window_close_time")
        d.outlets.append(
            {
                "outlet_id": r.text("outlet_id"),
                "brand": (r.text("brand") or "").upper() or None,
                "district": r.text("district"),
                "depot": r.text("depot"),
                "dock_type": r.choice("dock_type", DockType),
                "parking_constraint": r.choice("parking_constraint", ParkingConstraint),
                "mall_window": r.text("mall_window", False),
                "window_open_time": opens,
                "window_close_time": closes,
            }
        )
    for r in read_rows(
        "calendar.json",
        [
            "date",
            "dow",
            "dow_name",
            "is_weekend",
            "iso_year",
            "iso_week",
            "is_payday",
            "festival",
            "festival_ramp",
            "is_holiday",
            "monsoon",
            "is_operating",
        ],
        errors,
    ):
        day = r.day("date")
        row = {
            "date": day,
            "dow": r.integer("dow", 0),
            "dow_name": r.text("dow_name"),
            "is_weekend": r.flag("is_weekend"),
            "iso_year": r.integer("iso_year"),
            "iso_week": r.integer("iso_week", 1),
            "is_payday": r.flag("is_payday"),
            "festival": r.text("festival", False),
            "festival_ramp": r.number("festival_ramp", 0, 1),
            "is_holiday": r.flag("is_holiday"),
            "monsoon": r.flag("monsoon"),
            "is_operating": r.flag("is_operating"),
        }
        if day and row["dow"] is not None and day.weekday() != row["dow"]:
            r.fail(f"dow {row['dow']} does not match date {day}")
        d.calendar.append(row)
    for r in read_rows(
        "vehicles.json",
        [
            "vehicle_id",
            "type",
            "temp",
            "weight_cap_kg",
            "volume_cap_m3",
            "fuel_type",
            "km_per_l",
            "weekly_fuel_quota_l",
            "depot",
        ],
        errors,
    ):
        d.vehicles.append(
            {
                "ID": r.text("vehicle_id"),
                "type": r.member("type", VEHICLE_TYPES),
                "temp_condition": r.member("temp", TEMP_CONDITIONS),
                "weight_cap_kg": r.number("weight_cap_kg", 0),
                "volume_cap_m3": r.number("volume_cap_m3", 0),
                "fuel_type": r.text("fuel_type"),
                "km_per_l": r.number("km_per_l", 0),
                "weekly_fuel_quota": r.number("weekly_fuel_quota_l", 0),
                "depot": r.text("depot"),
            }
        )
    if include_demo:
        for r in read_rows("users.json", ["email", "password", "name", "user_type"], errors):
            d.users.append(
                {
                    "email": (r.text("email") or "").lower() or None,
                    "password": r.text("password"),
                    "name": r.text("name"),
                    "user_type": r.choice("user_type", UserType),
                }
            )
        for r in read_rows("drivers.json", ["email", "license_no", "phone", "depot"], errors):
            d.drivers.append(
                {
                    "email": (r.text("email") or "").lower() or None,
                    "license_no": r.text("license_no"),
                    "phone": r.text("phone"),
                    "depot": r.text("depot"),
                }
            )

    load_operations(d, errors, include_demo)
    cross_check(d, errors)
    if errors:
        raise SeedValidationError(errors)
    return d


def load_operations(d: SeedData, errors: list[str], include_demo: bool) -> None:
    for r in read_rows(
        "routes.json",
        [
            "ID",
            "district",
            "depot",
            "road_class",
            "free_flow_kmh",
            "depot_to_district_km",
            "depot_to_district_freeflow_min",
            "inter_stop_km",
            "inter_stop_freeflow_min",
        ],
        errors,
    ):
        road_class = r.choice("road_class", RoadClass)
        d.routes.append(
            {
                "ID": r.text("ID"),
                "district": r.text("district"),
                "depot": r.text("depot"),
                "road_class": road_class.value if road_class else None,
                **{
                    k: r.number(k, 0.001)
                    for k in (
                        "free_flow_kmh",
                        "depot_to_district_km",
                        "depot_to_district_freeflow_min",
                        "inter_stop_km",
                        "inter_stop_freeflow_min",
                    )
                },
            }
        )
    for r in read_rows("service_allowances.json", ["ID", "brand", "dock_type", "service_allowance_min"], errors):
        dock = r.choice("dock_type", DockType)
        d.allowances.append(
            {
                "ID": r.text("ID"),
                "brand": r.text("brand"),
                "dock_type": dock.value if dock else None,
                "service_allowance_min": r.number("service_allowance_min", 0),
            }
        )
    if not include_demo:
        return
    for r in read_rows(
        "orders.json",
        [
            "ID",
            "outlet_id",
            "order_date",
            "order_time",
            "weight_kg",
            "volume_m3",
            "temp_condition",
            "status",
            "allocation_day",
        ],
        errors,
    ):
        temp, status = r.choice("temp_condition", TempCondition), r.choice("status", OrderStatus)
        d.orders.append(
            {
                "ID": r.text("ID"),
                "outlet_id": r.text("outlet_id"),
                "order_date": r.day("order_date"),
                "order_time": r.hhmm("order_time"),
                "weight_kg": r.number("weight_kg", 0),
                "volume_m3": r.number("volume_m3", 0),
                "temp_condition": temp.value if temp else None,
                "status": status.value if status else None,
                "allocation_day": r.integer("allocation_day", 1) if r.text("allocation_day", False) else None,
            }
        )
    trip_keys = [
        "ID",
        "trip_id",
        "vehicle_id",
        "driver_email",
        "depot",
        "district",
        "brand",
        "trip_date",
        "planned_dispatch",
        "planned_return",
        "live_status",
        "departed_at",
        "completed_at",
        "delay_minutes",
        "delay_reason",
        "stops",
        "allocated_from",
        "plan_id",
        "is_manual",
        "override_reason",
        "authorized_by_email",
        "odometer_start_km",
        "odometer_end_km",
    ]
    for r in read_rows("trips.json", trip_keys, errors):
        status = r.choice("live_status", TripLiveStatus)
        stops = r.data["stops"] if isinstance(r.data["stops"], list) else []
        for stop in stops:
            if stop.get("status") not in {e.value for e in StopStatus}:
                r.fail(f"stop status {stop.get('status')!r} is invalid")
        d.trips.append(
            {
                "ID": r.text("ID"),
                "trip_id": r.text("trip_id"),
                "vehicle_id": r.text("vehicle_id"),
                "driver_email": (r.text("driver_email", False) or "").lower() or None,
                "depot": r.text("depot"),
                "district": r.text("district"),
                "brand": r.text("brand"),
                "trip_date": r.day("trip_date").isoformat() if r.day("trip_date") else None,
                "planned_dispatch": r.hhmm("planned_dispatch"),
                "planned_return": r.hhmm("planned_return", False),
                "live_status": status.value if status else None,
                "departed_at": r.hhmm("departed_at", False),
                "completed_at": r.hhmm("completed_at", False),
                "delay_minutes": r.integer("delay_minutes", 0),
                "delay_reason": r.text("delay_reason", False),
                "stops": stops,
                "allocated_from": r.member("allocated_from", {"AUTO", "MANUAL"}),
                "plan_id": r.text("plan_id", False),
                "is_manual": r.flag("is_manual"),
                "override_reason": r.text("override_reason", False),
                "authorized_by_email": (r.text("authorized_by_email", False) or "").lower() or None,
                "odometer_start_km": r.number("odometer_start_km", 0, required=False),
                "odometer_end_km": r.number("odometer_end_km", 0, required=False),
            }
        )
    for r in read_rows(
        "audit_logs.json",
        ["ID", "timestamp", "actor_email", "action", "trip_id", "vehicle_id", "driver_email", "details", "is_valid"],
        errors,
    ):
        d.logs.append(
            {
                "ID": r.text("ID"),
                "timestamp": r.stamp("timestamp"),
                "actor_email": (r.text("actor_email") or "").lower() or None,
                "action": r.text("action"),
                "trip_id": r.text("trip_id", False),
                "vehicle_id": r.text("vehicle_id", False),
                "driver_email": (r.text("driver_email", False) or "").lower() or None,
                "details": r.text("details", False),
                "is_valid": r.flag("is_valid", True),
            }
        )


def cross_check(d: SeedData, errors: list[str]) -> None:
    for rows, key, name in [
        (d.depots, "code", "depots.json"),
        (d.brands, "code", "brands.json"),
        (d.districts, "name", "districts.json"),
        (d.items, "sku", "items.json"),
        (d.prices, "sku", "prices.json"),
        (d.outlets, "outlet_id", "outlets.json"),
        (d.calendar, "date", "calendar.json"),
        (d.vehicles, "ID", "vehicles.json"),
        (d.routes, "ID", "routes.json"),
        (d.allowances, "ID", "service_allowances.json"),
        (d.orders, "ID", "orders.json"),
        (d.trips, "ID", "trips.json"),
        (d.trips, "trip_id", "trips.json"),
        (d.logs, "ID", "audit_logs.json"),
        (d.users, "email", "users.json"),
        (d.drivers, "email", "drivers.json"),
        (d.drivers, "license_no", "drivers.json"),
    ]:
        check_unique(rows, key, name, errors)

    depot_codes = {r["code"] for r in d.depots}
    check_parent(d.districts, "depot_code", depot_codes, "districts.json", "depots.json", errors)
    check_parent(d.items, "brand_code", {r["code"] for r in d.brands}, "items.json", "brands.json", errors)
    check_parent(d.prices, "sku", {r["sku"] for r in d.items}, "prices.json", "items.json", errors)
    check_parent(d.outlets, "brand", {r["code"] for r in d.brands}, "outlets.json", "brands.json", errors)
    check_parent(d.outlets, "district", {r["name"] for r in d.districts}, "outlets.json", "districts.json", errors)

    depot_labels = {r["depot"] for r in d.outlets + d.vehicles + d.drivers if r["depot"]}
    for label in sorted(depot_labels):
        if resolve_depot(label, d.depots) is None:
            errors.append(f"depot {label!r} does not match exactly one row in depots.json")
    district_depot = {r["name"]: r["depot_code"] for r in d.districts}
    for r in d.outlets:
        resolved = resolve_depot(r["depot"], d.depots) if r["depot"] else None
        if resolved and r["district"] in district_depot and district_depot[r["district"]] != resolved:
            errors.append(
                f"outlets.json: {r['outlet_id']} depot {r['depot']!r} differs from the depot of district {r['district']!r}"
            )
    check_parent(d.drivers, "email", {r["email"] for r in d.users}, "drivers.json", "users.json", errors)
    for r in d.drivers:
        owner = next((u for u in d.users if u["email"] == r["email"]), None)
        if owner and owner["user_type"] != UserType.DRIVER:
            errors.append(f"drivers.json: {r['email']!r} is not a driver user in users.json")

    outlet_ids = {r["outlet_id"] for r in d.outlets}
    check_parent(d.orders, "outlet_id", outlet_ids, "orders.json", "outlets.json", errors)
    districts = {r["name"] for r in d.districts}
    check_parent(d.routes, "district", districts, "routes.json", "districts.json", errors)
    brand_names = {r["name"].removeprefix("Waypoint ").upper() for r in d.brands}
    for rows, name in ((d.allowances, "service_allowances.json"), (d.trips, "trips.json")):
        for r in rows:
            if r["brand"] and r["brand"].upper() not in brand_names:
                errors.append(f"{name}: orphan brand {r['brand']!r} has no row in brands.json")
    for r in d.routes + d.trips:
        if r["depot"] and resolve_depot(r["depot"], d.depots) is None:
            errors.append(f"depot {r['depot']!r} does not match exactly one row in depots.json")
    emails = {r["email"] for r in d.users}
    driver_emails = {r["email"] for r in d.drivers}
    vehicle_ids = {r["ID"] for r in d.vehicles}
    trip_ids = {r["trip_id"] for r in d.trips}
    check_parent(d.trips, "vehicle_id", vehicle_ids, "trips.json", "vehicles.json", errors)
    check_parent(d.trips, "driver_email", driver_emails, "trips.json", "drivers.json", errors)
    check_parent(d.trips, "authorized_by_email", emails, "trips.json", "users.json", errors)
    check_parent(d.logs, "actor_email", emails, "audit_logs.json", "users.json", errors)
    check_parent(d.logs, "driver_email", driver_emails, "audit_logs.json", "drivers.json", errors)
    check_parent(d.logs, "vehicle_id", vehicle_ids, "audit_logs.json", "vehicles.json", errors)
    check_parent(d.logs, "trip_id", trip_ids, "audit_logs.json", "trips.json", errors)
    for t in d.trips:
        for stop in t["stops"]:
            if stop.get("outlet_id") not in outlet_ids:
                errors.append(f"trips.json: orphan stop outlet {stop.get('outlet_id')!r} in trip {t['trip_id']}")
