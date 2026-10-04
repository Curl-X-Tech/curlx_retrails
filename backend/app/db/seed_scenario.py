"""Builds demo orders, trips and audit logs for the next five days, relative to the Sri Lanka business date."""

from datetime import date, timedelta
from typing import Any

from app.db.seed_clock import hhmm, local, plan_legs, utc
from app.db.seed_json import SeedData, resolve_depot
from app.db.seed_scenario_dispatch import build_dispatch

# ref, outlet, day offset, order time, weight kg, temp, status, planned on trip
ORDERS = [
    ("ORD-S001", "OUT005", -1, "15:40", 420, "chilled", "delivered", "TRP-S01"),
    ("ORD-S002", "OUT008", -1, "16:05", 360, "frozen", "delivered", "TRP-S01"),
    ("ORD-S015", "OUT010", -1, "14:50", 300, "chilled", "deferred", "TRP-S01"),
    ("ORD-S003", "OUT019", 0, "10:15", 640, "ambient", "delivered", "TRP-S02"),
    ("ORD-S004", "OUT020", 0, "11:30", 520, "ambient", "dispatched", "TRP-S02"),
    ("ORD-S010", "OUT084", 0, "13:20", 880, "chilled", "delivered", "TRP-S06"),
    ("ORD-S005", "OUT025", 1, "14:10", 380, "chilled", "dispatched", "TRP-S03"),
    ("ORD-S006", "OUT026", 1, "14:45", 420, "frozen", "dispatched", "TRP-S03"),
    ("ORD-S009", "OUT088", 1, "09:30", 210, "ambient", "dispatched", "TRP-S05"),
    ("ORD-S011", "OUT052", 1, "17:25", 540, "chilled", "pending", None),
    ("ORD-S007", "OUT086", 2, "12:00", 950, "chilled", "dispatched", "TRP-S04"),
    ("ORD-S008", "OUT087", 2, "12:40", 780, "frozen", "dispatched", "TRP-S04"),
    ("ORD-S014", "OUT020", 2, "09:10", 220, "ambient", "cancelled", None),
    ("ORD-S012", "OUT058", 3, "16:15", 260, "ambient", "pending", None),
    ("ORD-S013", "OUT091", 4, "11:50", 310, "ambient", "pending", None),
]

# code, day offset, vehicle, depart, brand, district, status, delay minutes, driver assigned
TRIPS = [
    ("TRP-S01", -1, "VEH001", "04:30", "FRESH", "Colombo", "completed", 0, True),
    ("TRP-S02", 0, "VEH008", "08:30", "STYLE", "Colombo", "in_transit", 15, True),
    ("TRP-S06", 0, "VEH040", "05:20", "FRESH", "Kandy", "completed", 0, True),
    ("TRP-S03", 1, "VEH035", "05:00", "FRESH", "Gampaha", "loading", 0, True),
    ("TRP-S05", 1, "VEH059", "09:15", "STYLE", "Kandy", "scheduled", 0, False),
    ("TRP-S04", 2, "VEH039", "04:30", "FRESH", "Kandy", "scheduled", 0, True),
]
DEPOT_LABEL = {"PEL": "Peliyagoda", "KDY": "Kandy"}
LOADERS = {"PEL": "loader@curlx.tech", "KDY": "loader02@curlx.tech"}
DISPATCHERS = {"PEL": "dispatcher@curlx.tech", "KDY": "dispatcher02@curlx.tech"}


def _order_rows(today: date) -> list[dict[str, Any]]:
    return [
        {
            "ID": ref,
            "outlet_id": outlet,
            "order_date": today + timedelta(days=day),
            "order_time": time,
            "weight_kg": float(weight),
            "volume_m3": round(weight * 0.0065, 2),
            "temp_condition": temp,
            "status": status,
            "allocation_day": day + 1 if trip else None,
        }
        for ref, outlet, day, time, weight, temp, status, trip in ORDERS
    ]


def _stop_status(order_status: str) -> str:
    return {"delivered": "completed", "deferred": "skipped"}.get(order_status, "pending")


def _scenario_trips(d: SeedData, today: date) -> list[dict[str, Any]]:
    outlets = {o["outlet_id"]: o for o in d.outlets}
    depots = {x["code"]: x for x in d.depots}
    order_by_ref = {r[0]: r for r in ORDERS}
    vehicle_index = {v["ID"]: i for i, v in enumerate(d.vehicles)}
    result = []
    for code, day, vehicle, depart, brand, district, status, delay, assigned in TRIPS:
        vehicle_row = d.vehicles[vehicle_index[vehicle]]
        depot_code = resolve_depot(vehicle_row["depot"], d.depots)
        refs = [r[0] for r in ORDERS if r[7] == code]
        legs = plan_legs(
            (depots[depot_code]["latitude"], depots[depot_code]["longitude"]),
            [outlets[order_by_ref[ref][1]] for ref in refs],
            local(today, day, depart),
        )
        stops = []
        active = status == "in_transit"
        for leg, ref in zip(legs, refs):
            order = order_by_ref[ref]
            stop_status = _stop_status(order[6])
            leg.update(ref=ref, weight=float(order[4]), temp=order[5], status=stop_status, delay=delay)
            if stop_status == "pending" and active:
                leg["status"], active = "in_transit", False
            if stop_status != "pending":
                leg["delay"] = 0
            done = leg["status"] in ("completed", "skipped")
            stops.append(
                {
                    "outlet_id": leg["outlet"]["outlet_id"],
                    "planned_arrival": hhmm(leg["arrive"]),
                    "planned_departure": hhmm(leg["leave"]),
                    "actual_arrival": hhmm(leg["arrive"] + timedelta(minutes=2)) if done else None,
                    "actual_departure": hhmm(leg["leave"] + timedelta(minutes=2)) if done else None,
                    "status": "completed" if leg["status"] == "completed" else "skipped" if done else "pending",
                    "delivered_weight_kg": leg["weight"] if leg["status"] == "completed" else 0.0,
                    "delivery_note": "Store closed on arrival, order deferred" if leg["status"] == "skipped" else None,
                }
            )
        back = legs[0]["travel"]
        returns = legs[-1]["leave"] + timedelta(minutes=back + delay)
        km = round(sum(leg["km"] for leg in legs) + legs[0]["km"], 1)
        index = vehicle_index[vehicle]
        odo = 41200 + index * 310
        live = {"scheduled": "scheduled", "loading": "scheduled"}.get(status, status)
        result.append(
            {
                "code": code,
                "day": day,
                "vehicle": vehicle,
                "driver_email": d.drivers[index]["email"] if assigned else None,
                "depot_code": depot_code,
                "depot": DEPOT_LABEL[depot_code],
                "brand": brand,
                "district": district,
                "status": status,
                "live_status": live,
                "depart": local(today, day, depart),
                "returns": returns,
                "delay": delay,
                "legs": legs,
                "stops": stops,
                "km": km,
                "odometer_start": float(odo),
                "odometer_end": float(odo) + km if status == "completed" else None,
                "manual": not assigned,
            }
        )
    return result


def _live_trip_rows(trips: list[dict[str, Any]], today: date) -> list[dict[str, Any]]:
    rows = []
    for t in trips:
        started = t["live_status"] in ("in_transit", "completed")
        rows.append(
            {
                "ID": t["code"],
                "trip_id": t["code"],
                "vehicle_id": t["vehicle"],
                "driver_email": t["driver_email"],
                "depot": t["depot"],
                "district": t["district"],
                "brand": t["brand"].title(),
                "trip_date": (today + timedelta(days=t["day"])).isoformat(),
                "planned_dispatch": hhmm(t["depart"]),
                "planned_return": hhmm(t["returns"] - timedelta(minutes=t["delay"])),
                "live_status": t["live_status"],
                "departed_at": hhmm(t["depart"] + timedelta(minutes=2)) if started else None,
                "completed_at": hhmm(t["returns"]) if t["live_status"] == "completed" else None,
                "delay_minutes": t["delay"],
                "delay_reason": "Heavy traffic near Kotte junction" if t["delay"] else None,
                "stops": t["stops"],
                "allocated_from": "MANUAL" if t["manual"] else "AUTO",
                "plan_id": None
                if t["manual"]
                else f"PLAN-{(today + timedelta(days=t['day'])):%Y%m%d}-{t['depot_code']}",
                "is_manual": t["manual"],
                "override_reason": "Same-day replenishment requested by the outlet" if t["manual"] else None,
                "authorized_by_email": DISPATCHERS[t["depot_code"]] if t["manual"] else None,
                "odometer_start_km": t["odometer_start"] if started else None,
                "odometer_end_km": t["odometer_end"],
            }
        )
    return rows


def _log_rows(trips: list[dict[str, Any]]) -> list[dict[str, Any]]:
    logs: list[tuple[Any, str, str | None, str, str | None]] = []
    for t in trips:
        dispatcher, code = DISPATCHERS[t["depot_code"]], t["code"]
        planned = t["depart"] - timedelta(hours=12)
        if t["manual"]:
            logs.append((planned, "MANUAL_TRIP_CREATED", code, dispatcher, "Manual trip created without a driver"))
            continue
        logs.append((planned, "DRIVER_ASSIGNED", code, dispatcher, f"{t['driver_email']} assigned to {t['vehicle']}"))
        if t["live_status"] in ("in_transit", "completed"):
            logs.append((t["depart"], "TRIP_DEPARTED", code, t["driver_email"], f"Departed {t['depot']} depot"))
            for leg in (x for x in t["legs"] if x["status"] == "completed"):
                logs.append((leg["leave"], "STOP_COMPLETED", code, t["driver_email"], f"Delivered {leg['ref']}"))
        if t["delay"]:
            logs.append((t["depart"], "DELAY_REPORTED", code, t["driver_email"], f"Delayed {t['delay']} minutes"))
        if t["live_status"] == "completed":
            logs.append((t["returns"], "TRIP_COMPLETED", code, t["driver_email"], "Trip completed"))
    logs.sort(key=lambda x: x[0])
    by_code = {t["code"]: t for t in trips}
    return [
        {
            "ID": f"LOG-S{index:03d}",
            "timestamp": utc(stamp),
            "actor_email": actor,
            "action": action,
            "trip_id": code,
            "vehicle_id": by_code[code]["vehicle"],
            "driver_email": by_code[code]["driver_email"],
            "details": details,
            "is_valid": True,
        }
        for index, (stamp, action, code, actor, details) in enumerate(logs, start=1)
    ]


def build_scenario(d: SeedData, today: date) -> None:
    trips = _scenario_trips(d, today)
    d.orders = _order_rows(today)
    d.trips = _live_trip_rows(trips, today)
    d.logs = _log_rows(trips)
    build_dispatch(d, trips, ORDERS, LOADERS)
