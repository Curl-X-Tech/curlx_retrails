"""Time budget and travel duration utilities for the Allocation Engine.

Implements the Challenge Booklet travel and service allowance formulas:
trip_minutes = depot_to_district_freeflow_min + (inter_stop_freeflow_min * (num_orders - 1)) + sum(service_allowances)
"""

from __future__ import annotations

import math
from typing import Final

# Operating time budgets per vehicle per day
FRESH_DAILY_BUDGET_MIN: Final[float] = 270.0  # 3:30 AM to 8:00 AM window
GENERAL_DAILY_BUDGET_MIN: Final[float] = 480.0  # Style & Tech trading day window
MAX_TRIPS_PER_VEHICLE: Final[int] = 2

# Standard reference lookup: (depot_code/name, district_name) -> (depot_to_district_min, inter_stop_min)
DISTRICT_TRAVEL_REFERENCE: dict[tuple[str, str], tuple[float, float]] = {
    ("peliyagoda", "colombo"): (24.0, 5.0),
    ("peliyagoda", "gampaha"): (37.5, 6.0),
    ("peliyagoda", "kalutara"): (54.0, 7.2),
    ("peliyagoda", "galle"): (93.8, 5.2),
    ("peliyagoda", "matara"): (120.0, 5.2),
    ("peliyagoda", "kurunegala"): (114.0, 7.2),
    ("peliyagoda", "puttalam"): (156.0, 7.2),
    ("kandy", "kandy"): (16.0, 5.0),
    ("kandy", "matale"): (33.6, 7.2),
    ("kandy", "nuwara eliya"): (156.0, 10.0),
    ("kandy", "badulla"): (250.0, 10.0),
    ("kandy", "kegalle"): (54.0, 7.2),
}

# Standard reference lookup: (brand_code/name, dock_type) -> handling_allowance_min
SERVICE_ALLOWANCE_REFERENCE: dict[tuple[str, str], float] = {
    ("fresh", "rear_dock"): 20.0,
    ("fresh", "street"): 25.0,
    ("fresh", "mall_bay"): 35.0,
    ("style", "rear_dock"): 25.0,
    ("style", "street"): 30.0,
    ("style", "mall_bay"): 40.0,
    ("tech", "rear_dock"): 30.0,
    ("tech", "street"): 35.0,
    ("tech", "mall_bay"): 45.0,
}


def get_travel_allowances(depot_name: str, district_name: str) -> tuple[float, float]:
    """Return (depot_to_district_min, inter_stop_min) for given depot and district."""
    key = (depot_name.strip().lower(), district_name.strip().lower())
    if key in DISTRICT_TRAVEL_REFERENCE:
        return DISTRICT_TRAVEL_REFERENCE[key]
    return (30.0, 6.0)


def get_service_allowance_min(brand_name: str, dock_type: str) -> float:
    """Return standard handling time allowance in minutes."""
    key = (brand_name.strip().lower(), dock_type.strip().lower())
    if key in SERVICE_ALLOWANCE_REFERENCE:
        return SERVICE_ALLOWANCE_REFERENCE[key]
    return 20.0


def calculate_trip_minutes(
    depot_name: str,
    district_name: str,
    brand_name: str,
    dock_types: list[str],
) -> float:
    """Calculate total trip duration according to booklet formula."""
    if not dock_types:
        return 0.0
    outbound_min, inter_stop_min = get_travel_allowances(depot_name, district_name)
    inter_travel_total = inter_stop_min * max(0, len(dock_types) - 1)
    handling_total = sum(get_service_allowance_min(brand_name, dt) for dt in dock_types)
    return round(outbound_min + inter_travel_total + handling_total, 2)


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two GPS points in km."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return round(2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)


async def add_trip_route_legs(
    session,
    trip,
    depot,
    stops: list[tuple],
    operating_date,
) -> float:
    from datetime import datetime, time, timedelta
    from app.core.timezone import SRI_LANKA_TZ
    from app.entities.trip import RouteLeg

    base = datetime.combine(operating_date, time(5, 0))
    elapsed = 0.0
    outbound = inter = handling = distance = 0.0

    for seq, (order, outlet) in enumerate(stops):
        outbound_min, inter_stop_min = get_travel_allowances(
            depot.name if depot else "Peliyagoda",
            outlet.name if hasattr(outlet, "district") else "Colombo",
        )
        travel = outbound_min if seq == 0 else inter_stop_min
        depart_at = elapsed
        elapsed += travel
        arrive_at = elapsed
        hand_min = get_service_allowance_min(
            getattr(outlet, "brand_code", "Fresh"), getattr(outlet, "dock_type", "rear_dock")
        )
        elapsed += hand_min
        if seq == 0:
            outbound += travel
        else:
            inter += travel
        handling += hand_min
        distance += 15.0

        dep_dt = base + timedelta(minutes=depart_at)
        arr_dt = base + timedelta(minutes=arrive_at)

        session.add(
            RouteLeg(
                name=f"Leg {seq}",
                leg_id=f"{trip.trip_code}-{seq}",
                trip_id=trip.id,
                seq=seq,
                from_point="DEPOT" if seq == 0 else str(stops[seq - 1][1].id),
                to_outlet_id=outlet.id,
                order_id=order.id,
                distance_km=15.0,
                planned_depart_time=dep_dt.time().replace(microsecond=0),
                planned_travel_duration_min=travel,
                planned_arrival_time=arr_dt.time().replace(microsecond=0),
                status="pending",
            )
        )

    trip.outbound_travel_min = round(outbound, 1)
    trip.inter_stop_travel_min = round(inter, 1)
    trip.total_handling_min = round(handling, 1)
    trip.total_distance_km = round(distance, 2)
    trip.total_trip_duration_min = round(elapsed, 1)
    trip.planned_start_time = base.replace(tzinfo=SRI_LANKA_TZ)
    return elapsed
