"""Loads and validates the dispatch-side seed files: staff, trips, legs, checklist, proof of delivery, discrepancies, telemetry."""

from datetime import datetime
from typing import Any

from app.db.seed_json import Row, SeedData, check_parent, check_unique, read_rows, resolve_depot

TRIP_STATUSES = {"scheduled", "loading", "dispatched", "in_transit", "completed", "cancelled"}
LEG_STATUSES = {"pending", "in_transit", "arrived", "completed", "skipped", "newly_added"}
CHECKLIST_STATUSES = {"pending", "scanned", "verified", "flagged"}
DISCREPANCY_TYPES = {"damaged", "shortage", "rejected", "temp_breach", "delayed_window"}
RESOLUTIONS = {"open", "under_investigation", "resolved", "waived"}
STAFF_ROLES = {"dispatcher", "loader", "store_manager"}


def _stamp(r: Row, col: str) -> datetime | None:
    return r.stamp(col) if r.data.get(col) else None


def _num(r: Row, col: str) -> float | None:
    return r.number(col, required=False) if r.data.get(col) is not None else None


def _load_trips(d: SeedData, errors: list[str]) -> None:
    columns = [
        "trip_code",
        "dispatch_date",
        "trip_sequence",
        "vehicle_id",
        "driver_email",
        "depot",
        "brand",
        "district",
        "status",
        "seal_number",
        "planned_start_time",
        "actual_start_time",
        "actual_end_time",
        "outbound_travel_min",
        "inter_stop_travel_min",
        "total_handling_min",
        "total_trip_duration_min",
        "total_distance_km",
        "legs",
    ]
    leg_columns = [
        "seq",
        "outlet_id",
        "order_ref",
        "from_point",
        "distance_km",
        "planned_depart_time",
        "planned_travel_duration_min",
        "planned_arrival_time",
        "status",
        "actual_depart_time",
        "actual_travel_duration_min",
        "arrival_time",
        "leave_outlet_time",
        "sealed_at",
        "sealed_by_email",
    ]
    for r in read_rows("dispatch_trips.json", columns, errors):
        legs = []
        for index, raw in enumerate(r.data["legs"], start=1):
            missing = [c for c in leg_columns if c not in raw]
            if missing:
                r.fail(f"leg {index} missing keys {missing}")
                continue
            lr = Row(f"dispatch_trips.json:{r.data['trip_code']}", index, raw, errors)
            legs.append(
                {
                    "seq": lr.integer("seq", 0),
                    "outlet_id": lr.text("outlet_id"),
                    "order_ref": lr.text("order_ref", required=False),
                    "from_point": lr.text("from_point"),
                    "distance_km": lr.number("distance_km", 0),
                    "planned_depart_time": lr.clock("planned_depart_time"),
                    "planned_travel_duration_min": lr.number("planned_travel_duration_min", 0),
                    "planned_arrival_time": lr.clock("planned_arrival_time"),
                    "status": lr.member("status", LEG_STATUSES),
                    "actual_depart_time": _stamp(lr, "actual_depart_time"),
                    "actual_travel_duration_min": _num(lr, "actual_travel_duration_min"),
                    "arrival_time": _stamp(lr, "arrival_time"),
                    "leave_outlet_time": _stamp(lr, "leave_outlet_time"),
                    "sealed_at": _stamp(lr, "sealed_at"),
                    "sealed_by_email": (lr.text("sealed_by_email", required=False) or "").lower() or None,
                }
            )
        d.dispatch_trips.append(
            {
                "trip_code": r.text("trip_code"),
                "dispatch_date": r.day("dispatch_date"),
                "trip_sequence": r.integer("trip_sequence", 1),
                "vehicle_id": r.text("vehicle_id"),
                "driver_email": (r.text("driver_email") or "").lower(),
                "depot": r.text("depot"),
                "brand": r.text("brand"),
                "district": r.text("district"),
                "status": r.member("status", TRIP_STATUSES),
                "seal_number": r.text("seal_number", required=False),
                "planned_start_time": _stamp(r, "planned_start_time"),
                "actual_start_time": _stamp(r, "actual_start_time"),
                "actual_end_time": _stamp(r, "actual_end_time"),
                "outbound_travel_min": r.number("outbound_travel_min", 0),
                "inter_stop_travel_min": r.number("inter_stop_travel_min", 0),
                "total_handling_min": r.number("total_handling_min", 0),
                "total_trip_duration_min": r.number("total_trip_duration_min", 0),
                "total_distance_km": r.number("total_distance_km", 0),
                "legs": legs,
            }
        )


def load_dispatch(d: SeedData, errors: list[str]) -> None:
    for r in read_rows("staff.json", ["email", "employee_code", "role", "phone", "depot", "outlet_id"], errors):
        d.staff.append(
            {
                "email": (r.text("email") or "").lower(),
                "employee_code": r.text("employee_code"),
                "role": r.member("role", STAFF_ROLES),
                "phone": r.text("phone"),
                "depot": r.text("depot"),
                "outlet_id": r.text("outlet_id", required=False),
            }
        )
    _load_trips(d, errors)
    for r in read_rows(
        "checklist_items.json",
        ["trip_code", "package_code", "status", "verified_by_email", "verified_at", "shortfall_qty", "notes"],
        errors,
    ):
        d.checklist.append(
            {
                "trip_code": r.text("trip_code"),
                "package_code": r.text("package_code"),
                "status": r.member("status", CHECKLIST_STATUSES),
                "verified_by_email": (r.text("verified_by_email", required=False) or "").lower() or None,
                "verified_at": _stamp(r, "verified_at"),
                "shortfall_qty": r.integer("shortfall_qty", 0),
                "notes": r.text("notes", required=False),
            }
        )
    for r in read_rows(
        "proofs_of_delivery.json",
        [
            "trip_code",
            "seq",
            "recipient_name",
            "recipient_phone",
            "signature_svg",
            "arrived_at",
            "delivered_at",
            "delivery_lat",
            "delivery_lng",
            "temperature_reading",
            "is_offline_synced",
        ],
        errors,
    ):
        d.pods.append(
            {
                "trip_code": r.text("trip_code"),
                "seq": r.integer("seq", 0),
                "recipient_name": r.text("recipient_name"),
                "recipient_phone": r.text("recipient_phone", required=False),
                "signature_svg": r.text("signature_svg"),
                "arrived_at": r.stamp("arrived_at"),
                "delivered_at": r.stamp("delivered_at"),
                "delivery_lat": _num(r, "delivery_lat"),
                "delivery_lng": _num(r, "delivery_lng"),
                "temperature_reading": _num(r, "temperature_reading"),
                "is_offline_synced": r.flag("is_offline_synced", False),
            }
        )
    for r in read_rows(
        "discrepancy_reports.json",
        [
            "trip_code",
            "seq",
            "package_code",
            "discrepancy_type",
            "reported_qty",
            "reported_by_email",
            "reported_at",
            "description",
            "resolution_status",
        ],
        errors,
    ):
        d.discrepancies.append(
            {
                "trip_code": r.text("trip_code"),
                "seq": r.integer("seq", 0),
                "package_code": r.text("package_code"),
                "discrepancy_type": r.member("discrepancy_type", DISCREPANCY_TYPES),
                "reported_qty": r.integer("reported_qty", 0) if r.data.get("reported_qty") is not None else None,
                "reported_by_email": (r.text("reported_by_email") or "").lower(),
                "reported_at": r.stamp("reported_at"),
                "description": r.text("description"),
                "resolution_status": r.member("resolution_status", RESOLUTIONS),
            }
        )
    for r in read_rows(
        "vehicle_telemetry.json",
        [
            "key",
            "vehicle_id",
            "trip_code",
            "recorded_at",
            "latitude",
            "longitude",
            "speed_kmh",
            "heading_deg",
            "reefer_temp_celsius",
            "ambient_temp_celsius",
            "fuel_level_pct",
            "battery_pct",
        ],
        errors,
    ):
        d.telemetry.append(
            {
                "idempotency_key": r.text("key"),
                "vehicle_id": r.text("vehicle_id"),
                "trip_code": r.text("trip_code", required=False),
                "recorded_at": r.stamp("recorded_at"),
                "latitude": r.number("latitude", -90, 90),
                "longitude": r.number("longitude", -180, 180),
                "speed_kmh": r.number("speed_kmh", 0),
                "heading_deg": r.number("heading_deg", 0, 360),
                "reefer_temp_celsius": _num(r, "reefer_temp_celsius"),
                "ambient_temp_celsius": _num(r, "ambient_temp_celsius"),
                "fuel_level_pct": _num(r, "fuel_level_pct"),
                "battery_pct": _num(r, "battery_pct"),
            }
        )
    cross_check_dispatch(d, errors)


def cross_check_dispatch(d: SeedData, errors: list[str]) -> None:
    check_unique(d.staff, "email", "staff.json", errors)
    check_unique(d.staff, "employee_code", "staff.json", errors)
    check_unique(d.dispatch_trips, "trip_code", "dispatch_trips.json", errors)
    check_unique(d.telemetry, "idempotency_key", "vehicle_telemetry.json", errors)

    emails = {u["email"]: u["user_type"].value for u in d.users}
    outlets = {o["outlet_id"] for o in d.outlets}
    vehicles = {v["ID"] for v in d.vehicles}
    brand_codes = {b["code"] for b in d.brands}
    districts = {x["name"] for x in d.districts}
    order_refs = {o["ID"] for o in d.orders}
    driver_emails = {x["email"] for x in d.drivers}
    trip_codes = {t["trip_code"] for t in d.dispatch_trips}

    for s in d.staff:
        if emails.get(s["email"]) != s["role"]:
            errors.append(f"staff.json: {s['email']!r} is not a {s['role']} user in users.json")
        if resolve_depot(s["depot"], d.depots) is None:
            errors.append(f"staff.json: depot {s['depot']!r} does not match exactly one row in depots.json")
        if (s["role"] == "store_manager") != (s["outlet_id"] is not None):
            errors.append(f"staff.json: {s['email']!r} outlet_id is required for store managers only")
    check_parent(d.staff, "outlet_id", outlets, "staff.json", "outlets.json", errors)

    check_parent(d.dispatch_trips, "vehicle_id", vehicles, "dispatch_trips.json", "vehicles.json", errors)
    check_parent(d.dispatch_trips, "driver_email", driver_emails, "dispatch_trips.json", "drivers.json", errors)
    check_parent(d.dispatch_trips, "brand", brand_codes, "dispatch_trips.json", "brands.json", errors)
    check_parent(d.dispatch_trips, "district", districts, "dispatch_trips.json", "districts.json", errors)
    seen_slots: set[tuple[Any, ...]] = set()
    used_orders: set[str] = set()
    for t in d.dispatch_trips:
        if resolve_depot(t["depot"], d.depots) is None:
            errors.append(f"dispatch_trips.json: depot {t['depot']!r} does not match exactly one row in depots.json")
        slot = (t["dispatch_date"], t["vehicle_id"], t["trip_sequence"])
        if slot in seen_slots:
            errors.append(f"dispatch_trips.json: duplicate vehicle slot {slot} in {t['trip_code']}")
        seen_slots.add(slot)
        if t["trip_sequence"] not in (1, 2):
            errors.append(f"dispatch_trips.json: {t['trip_code']} trip_sequence must be 1 or 2")
        check_unique(t["legs"], "seq", f"dispatch_trips.json:{t['trip_code']} legs", errors)
        check_parent(t["legs"], "outlet_id", outlets, f"dispatch_trips.json:{t['trip_code']}", "outlets.json", errors)
        check_parent(t["legs"], "order_ref", order_refs, f"dispatch_trips.json:{t['trip_code']}", "orders.json", errors)
        check_parent(
            t["legs"], "sealed_by_email", set(emails), f"dispatch_trips.json:{t['trip_code']}", "users.json", errors
        )
        for leg in t["legs"]:
            if leg["order_ref"]:
                if leg["order_ref"] in used_orders:
                    errors.append(f"dispatch_trips.json: order {leg['order_ref']!r} is on more than one leg")
                used_orders.add(leg["order_ref"])

    legs = {(t["trip_code"], leg["seq"]): leg for t in d.dispatch_trips for leg in t["legs"]}
    packages = {
        (t["trip_code"], f"{leg['order_ref']}-01") for t in d.dispatch_trips for leg in t["legs"] if leg["order_ref"]
    }
    for rows, name in (
        (d.checklist, "checklist_items.json"),
        (d.pods, "proofs_of_delivery.json"),
        (d.discrepancies, "discrepancy_reports.json"),
    ):
        check_parent(rows, "trip_code", trip_codes, name, "dispatch_trips.json", errors)
    for c in d.checklist:
        if (c["trip_code"], c["package_code"]) not in packages:
            errors.append(f"checklist_items.json: {c['package_code']!r} is not on trip {c['trip_code']!r}")
    check_parent(d.checklist, "verified_by_email", set(emails), "checklist_items.json", "users.json", errors)
    for rows, name in ((d.pods, "proofs_of_delivery.json"), (d.discrepancies, "discrepancy_reports.json")):
        for r in rows:
            if (r["trip_code"], r["seq"]) not in legs:
                errors.append(f"{name}: trip {r['trip_code']!r} has no leg {r['seq']}")
    check_unique([{"k": (p["trip_code"], p["seq"])} for p in d.pods], "k", "proofs_of_delivery.json", errors)
    check_parent(d.discrepancies, "reported_by_email", set(emails), "discrepancy_reports.json", "users.json", errors)
    check_parent(d.telemetry, "vehicle_id", vehicles, "vehicle_telemetry.json", "vehicles.json", errors)
    check_parent(d.telemetry, "trip_code", trip_codes, "vehicle_telemetry.json", "dispatch_trips.json", errors)
