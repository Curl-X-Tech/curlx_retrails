"""JSON seed loader and integrity validator for master entities and operational configurations."""

from __future__ import annotations

import json
import re
from collections import Counter
from collections.abc import Iterator
from dataclasses import dataclass, field
from datetime import date, datetime, time
from enum import Enum
from pathlib import Path
from typing import Any

from app.enums.master import DeliveryWindowType, DockType, ParkingConstraint
from app.enums.roles import UserType
from app.schemas.route_schemas import RoadClass

SEED_DIR = Path(__file__).resolve().parent / "seed_data"
VEHICLE_TYPES = {"truck", "van"}
TEMP_CONDITIONS = {"reefer", "ambient"}
SPECIAL_HANDLING_CODES = {"COL", "FRG", "MAL", "HAZ"}
SL_LAT, SL_LNG = (5.9, 9.9), (79.5, 81.9)
SL_PHONE = re.compile(r"^\+94 \d{2} \d{3} \d{4}$")


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

    def member(self, col: str, allowed: set[str], required: bool = True) -> str | None:
        raw = self.text(col, required=required)
        if raw is not None and raw not in allowed:
            self.fail(f"'{col}' must be one of {sorted(allowed)}: {raw!r}")
            return None
        return raw

    def phone(self, col: str, required: bool = True) -> str | None:
        raw = self.text(col, required=required)
        if raw is not None and not SL_PHONE.match(raw):
            self.fail(f"'{col}' must look like '+94 11 234 5678': {raw!r}")
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
    staff: list[dict[str, Any]] = field(default_factory=list)
    routes: list[dict[str, Any]] = field(default_factory=list)
    allowances: list[dict[str, Any]] = field(default_factory=list)


def resolve_depot(label: str, depots: list[dict[str, Any]]) -> str | None:
    """Maps a depot label such as 'Peliyagoda' to a depot code by code, name, or name prefix."""
    needle = label.lower()
    matches = [
        d["code"]
        for d in depots
        if needle in (d["code"].lower(), d["name"].lower()) or d["name"].lower().startswith(needle + " ")
    ]
    return matches[0] if len(matches) == 1 else None


def load_seed_data(include_demo: bool = True) -> SeedData:
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
        ],
        errors,
    ):
        d.items.append(
            {
                "sku": (r.text("sku") or "").upper() or None,
                "brand_code": (r.text("brand_code") or "").upper() or None,
                "name": r.text("name"),
                "category": r.text("category"),
                "unit": r.text("unit"),
                "unit_weight_kg": r.number("unit_weight_kg", 0),
                "unit_volume_m3": r.number("unit_volume_m3", 0),
                "requires_cold_chain": r.flag("requires_cold_chain"),
                "special_handling_code": r.member("special_handling_code", SPECIAL_HANDLING_CODES, required=False),
            }
        )

    for r in read_rows("prices.json", ["sku", "cost_price", "unit_price"], errors):
        d.prices.append(
            {
                "sku": (r.text("sku") or "").upper() or None,
                "cost_price": r.number("cost_price", 0),
                "unit_price": r.number("unit_price", 0),
                "currency": r.text("currency", required=False) or "LKR",
                "price_change_reason": r.text("price_change_reason", required=False) or "standard_pricing",
            }
        )

    for r in read_rows(
        "outlets.json",
        [
            "outlet_id",
            "brand",
            "district",
            "depot",
            "latitude",
            "longitude",
            "dock_type",
            "parking_constraint",
            "window_open_time",
            "window_close_time",
            "area",
            "address",
            "city",
        ],
        errors,
    ):
        d.outlets.append(
            {
                "outlet_id": (r.text("outlet_id") or "").upper() or None,
                "brand": (r.text("brand") or "").upper() or None,
                "district": r.text("district"),
                "depot": r.text("depot"),
                "latitude": r.number("latitude", SL_LAT[0], SL_LAT[1]),
                "longitude": r.number("longitude", SL_LNG[0], SL_LNG[1]),
                "dock_type": r.choice("dock_type", DockType),
                "parking_constraint": r.choice("parking_constraint", ParkingConstraint),
                "mall_window": r.text("mall_window", required=False),
                "window_open_time": r.clock("window_open_time"),
                "window_close_time": r.clock("window_close_time"),
                "area": r.text("area"),
                "address": r.text("address"),
                "city": r.text("city"),
                "contact_phone": r.phone("contact_phone", required=False),
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
                "vehicle_id": r.text("vehicle_id"),
                "type": r.member("type", VEHICLE_TYPES),
                "temp": r.member("temp", TEMP_CONDITIONS),
                "temp_condition": r.member("temp", TEMP_CONDITIONS),
                "weight_cap_kg": r.number("weight_cap_kg", 0),
                "volume_cap_m3": r.number("volume_cap_m3", 0),
                "fuel_type": r.text("fuel_type"),
                "km_per_l": r.number("km_per_l", 0),
                "weekly_fuel_quota_l": r.number("weekly_fuel_quota_l", 0),
                "weekly_fuel_quota": r.number("weekly_fuel_quota_l", 0),
                "depot": r.text("depot"),
            }
        )

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
        for r in read_rows("staff.json", ["email", "employee_code", "role", "phone", "depot"], errors):
            d.staff.append(
                {
                    "email": (r.text("email") or "").lower() or None,
                    "employee_code": r.text("employee_code"),
                    "role": r.choice("role", UserType),
                    "phone": r.phone("phone"),
                    "depot": r.text("depot"),
                    "outlet_id": r.text("outlet_id", False),
                }
            )

    cross_check(d, errors)
    if errors:
        raise SeedValidationError(errors)
    return d


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
        (d.users, "email", "users.json"),
        (d.staff, "email", "staff.json"),
        (d.staff, "employee_code", "staff.json"),
    ]:
        check_unique(rows, key, name, errors)

    depot_codes = {r["code"] for r in d.depots}
    check_parent(d.districts, "depot_code", depot_codes, "districts.json", "depots.json", errors)
    check_parent(d.items, "brand_code", {r["code"] for r in d.brands}, "items.json", "brands.json", errors)
    check_parent(d.prices, "sku", {r["sku"] for r in d.items}, "prices.json", "items.json", errors)
    check_parent(d.outlets, "brand", {r["code"] for r in d.brands}, "outlets.json", "brands.json", errors)
    check_parent(d.outlets, "district", {r["name"] for r in d.districts}, "outlets.json", "districts.json", errors)

    depot_labels = {r["depot"] for r in d.outlets + d.vehicles + d.staff if r["depot"]}
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

    user_emails = {r["email"] for r in d.users}
    check_parent(d.staff, "email", user_emails, "staff.json", "users.json", errors)
