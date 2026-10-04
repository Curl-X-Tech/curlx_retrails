"""Dispatch-side demo rows (trips, legs, loading checklist, proof of delivery, discrepancies, telemetry)."""

from datetime import timedelta
from math import atan2, degrees
from typing import Any

from app.db.seed_clock import HANDLING_MIN, utc
from app.db.seed_json import SeedData

SIGNATURE = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10 60 C 40 10, 80 70, 120 40 '
    'S 170 20, 190 50" fill="none" stroke="#111" stroke-width="2"/></svg>'
)
RECIPIENTS = [
    ("S. Perera", "+94 77 412 8830"),
    ("K. Fernando", "+94 71 903 5517"),
    ("M. Jayasuriya", "+94 76 220 4691"),
    ("R. Wijesinghe", "+94 70 587 1346"),
    ("N. Dissanayake", "+94 75 316 9072"),
]
TEMPERATURE = {"chilled": 4.2, "frozen": -18.4, "ambient": None}
TEMPERATURE_BREACH = {"ORD-S010": 8.4}
DISCREPANCIES = {
    "ORD-S001": ("shortage", 2, "Two crates short against the delivery note", "open"),
    "ORD-S010": ("temp_breach", 1, "Reefer reading was above 8 C on arrival", "under_investigation"),
}
SHORTFALL = {"ORD-S001": 2}


def _leg_rows(t: dict[str, Any], sealer: str) -> list[dict[str, Any]]:
    sealed = t["live_status"] != "scheduled" or t["status"] == "loading"
    rows = []
    for leg in t["legs"]:
        done = leg["status"] in ("completed", "skipped")
        stay = timedelta(minutes=HANDLING_MIN if leg["status"] == "completed" else 5)
        rows.append(
            {
                "seq": leg["seq"],
                "outlet_id": leg["outlet"]["outlet_id"],
                "order_ref": leg["ref"],
                "from_point": leg["from_point"],
                "distance_km": leg["km"],
                "planned_depart_time": leg["depart"].time(),
                "planned_travel_duration_min": float(leg["travel"]),
                "planned_arrival_time": leg["arrive"].time(),
                "status": leg["status"],
                "actual_depart_time": utc(leg["depart"] + timedelta(minutes=1))
                if done or leg["status"] == "in_transit"
                else None,
                "actual_travel_duration_min": float(leg["travel"] + 1) if done else None,
                "arrival_time": utc(leg["arrive"] + timedelta(minutes=2)) if done else None,
                "leave_outlet_time": utc(leg["arrive"] + timedelta(minutes=2) + stay) if done else None,
                "sealed_at": utc(t["depart"] - timedelta(minutes=40)) if sealed else None,
                "sealed_by_email": sealer if sealed else None,
            }
        )
    return rows


def _trip_row(t: dict[str, Any], legs: list[dict[str, Any]], sealer: str) -> dict[str, Any]:
    started = t["live_status"] in ("in_transit", "completed")
    handling = float(HANDLING_MIN * len(t["legs"]))
    inter_stop = float(sum(leg["travel"] for leg in t["legs"][1:]))
    outbound = float(t["legs"][0]["travel"])
    return {
        "trip_code": t["code"],
        "dispatch_date": t["depart"].date(),
        "trip_sequence": 1,
        "vehicle_id": t["vehicle"],
        "driver_email": t["driver_email"],
        "depot": t["depot"],
        "brand": t["brand"],
        "district": t["district"],
        "status": t["status"],
        "seal_number": f"SL-{t['code'][-3:]}-{t['depot_code']}" if t["status"] != "scheduled" else None,
        "planned_start_time": utc(t["depart"]),
        "actual_start_time": utc(t["depart"] + timedelta(minutes=2)) if started else None,
        "actual_end_time": utc(t["returns"]) if t["status"] == "completed" else None,
        "outbound_travel_min": outbound,
        "inter_stop_travel_min": inter_stop,
        "total_handling_min": handling,
        "total_trip_duration_min": outbound + inter_stop + handling + outbound,
        "total_distance_km": t["km"],
        "legs": legs,
    }


def _checklist(t: dict[str, Any], loader: str) -> list[dict[str, Any]]:
    rows = []
    for position, leg in enumerate(t["legs"]):
        if t["status"] == "scheduled":
            status = "pending"
        elif t["status"] == "loading":
            status = "verified" if position == 0 else "scanned"
        else:
            status = "flagged" if leg["ref"] in SHORTFALL else "verified"
        checked = status in ("verified", "flagged")
        rows.append(
            {
                "trip_code": t["code"],
                "package_code": f"{leg['ref']}-01",
                "status": status,
                "verified_by_email": loader if checked else None,
                "verified_at": utc(t["depart"] - timedelta(minutes=60 - 5 * position)) if checked else None,
                "shortfall_qty": SHORTFALL.get(leg["ref"], 0),
                "notes": "Short against the delivery note at loading" if leg["ref"] in SHORTFALL else None,
            }
        )
    return rows


def _proofs(t: dict[str, Any], index: int) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    pods, reports = [], []
    for leg in (x for x in t["legs"] if x["status"] == "completed"):
        name, phone = RECIPIENTS[(index + leg["seq"]) % len(RECIPIENTS)]
        arrived = utc(leg["arrive"] + timedelta(minutes=2))
        delivered = utc(leg["leave"] + timedelta(minutes=2))
        reading = TEMPERATURE_BREACH.get(leg["ref"], TEMPERATURE[leg["temp"]])
        pods.append(
            {
                "trip_code": t["code"],
                "seq": leg["seq"],
                "recipient_name": name,
                "recipient_phone": phone,
                "signature_svg": SIGNATURE,
                "arrived_at": arrived,
                "delivered_at": delivered,
                "delivery_lat": leg["outlet"]["latitude"],
                "delivery_lng": leg["outlet"]["longitude"],
                "temperature_reading": reading,
                "is_offline_synced": False,
            }
        )
        if leg["ref"] in DISCREPANCIES:
            kind, qty, text, resolution = DISCREPANCIES[leg["ref"]]
            reports.append(
                {
                    "trip_code": t["code"],
                    "seq": leg["seq"],
                    "package_code": f"{leg['ref']}-01",
                    "discrepancy_type": kind,
                    "reported_qty": qty,
                    "reported_by_email": t["driver_email"],
                    "reported_at": delivered,
                    "description": text,
                    "resolution_status": resolution,
                }
            )
    return pods, reports


def _telemetry(t: dict[str, Any], depot: tuple[float, float], reefer: bool) -> list[dict[str, Any]]:
    first, last = t["legs"][0], t["legs"][-1]
    point = lambda leg: (leg["outlet"]["latitude"], leg["outlet"]["longitude"])  # noqa: E731
    stops = [(t["depart"] + timedelta(minutes=2), depot, point(first), 28.0)]
    stops.append((first["arrive"] + timedelta(minutes=1), point(first), point(first), 0.0))
    if t["live_status"] == "completed":
        stops.append((last["leave"] + timedelta(minutes=3), point(last), depot, 31.0))
    rows = []
    for n, (stamp, here, ahead, speed) in enumerate(stops, start=1):
        rows.append(
            {
                "idempotency_key": f"seed:{t['code']}:{n}",
                "vehicle_id": t["vehicle"],
                "trip_code": t["code"],
                "recorded_at": utc(stamp),
                "latitude": round(here[0], 6),
                "longitude": round(here[1], 6),
                "speed_kmh": speed,
                "heading_deg": round(degrees(atan2(ahead[1] - here[1], ahead[0] - here[0])) % 360, 1),
                "reefer_temp_celsius": 3.8 if reefer else None,
                "ambient_temp_celsius": 29.0,
                "fuel_level_pct": round(88.0 - 4.5 * n, 1),
                "battery_pct": 96.0,
            }
        )
    return rows


def build_dispatch(
    d: SeedData, trips: list[dict[str, Any]], orders: list[tuple[Any, ...]], loaders: dict[str, str]
) -> None:
    depots = {x["code"]: (x["latitude"], x["longitude"]) for x in d.depots}
    vehicles = {v["ID"]: v for v in d.vehicles}
    d.dispatch_trips, d.checklist, d.pods, d.discrepancies, d.telemetry = [], [], [], [], []
    for index, t in enumerate(x for x in trips if x["driver_email"]):
        loader = loaders[t["depot_code"]]
        d.dispatch_trips.append(_trip_row(t, _leg_rows(t, loader), loader))
        d.checklist += _checklist(t, loader)
        pods, reports = _proofs(t, index)
        d.pods += pods
        d.discrepancies += reports
        if t["live_status"] in ("in_transit", "completed"):
            d.telemetry += _telemetry(t, depots[t["depot_code"]], vehicles[t["vehicle"]]["temp_condition"] == "reefer")
