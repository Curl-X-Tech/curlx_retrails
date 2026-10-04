"""Loads the staff seed file and validates the generated dispatch scenario against the master data."""

from typing import Any

from app.db.seed_json import SeedData, check_parent, check_unique, read_rows, resolve_depot

STAFF_ROLES = {"dispatcher", "loader", "store_manager"}


def load_dispatch(d: SeedData, errors: list[str]) -> None:
    for r in read_rows("staff.json", ["email", "employee_code", "role", "phone", "depot", "outlet_id"], errors):
        d.staff.append(
            {
                "email": (r.text("email") or "").lower(),
                "employee_code": r.text("employee_code"),
                "role": r.member("role", STAFF_ROLES),
                "phone": r.phone("phone"),
                "depot": r.text("depot"),
                "outlet_id": r.text("outlet_id", required=False),
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
