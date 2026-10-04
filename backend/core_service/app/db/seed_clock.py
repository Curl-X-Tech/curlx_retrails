"""Time and route helpers for building date-relative demo data."""

from datetime import date, datetime, time, timedelta, timezone
from math import asin, cos, radians, sin, sqrt
from typing import Any

from app.core.timezone import SRI_LANKA_TZ

HANDLING_MIN = 20
AVERAGE_SPEED_KMH = 35
ROAD_FACTOR = 1.3


def local(today: date, day: int, clock: str) -> datetime:
    """Sri Lanka wall-clock time on today plus day offset."""
    hour, minute = (int(p) for p in clock.split(":"))
    return datetime.combine(today + timedelta(days=day), time(hour, minute), tzinfo=SRI_LANKA_TZ)


def utc(value: datetime) -> datetime:
    return value.astimezone(timezone.utc)


def hhmm(value: datetime) -> str:
    return value.astimezone(SRI_LANKA_TZ).strftime("%H:%M")


def haversine_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lon1, lat2, lon2 = map(radians, (*a, *b))
    h = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2
    return 2 * 6371 * asin(sqrt(h))


def plan_legs(depot: tuple[float, float], outlets: list[dict[str, Any]], depart: datetime) -> list[dict[str, Any]]:
    """Sequential legs from the depot; road distance is the straight line scaled by ROAD_FACTOR."""
    legs, here, clock, origin = [], depot, depart, "DEPOT"
    for seq, outlet in enumerate(outlets):
        point = (outlet["latitude"], outlet["longitude"])
        km = round(haversine_km(here, point) * ROAD_FACTOR, 1)
        travel = max(5, round(km / AVERAGE_SPEED_KMH * 60))
        arrive = clock + timedelta(minutes=travel)
        leave = arrive + timedelta(minutes=HANDLING_MIN)
        legs.append(
            {
                "seq": seq,
                "outlet": outlet,
                "from_point": origin,
                "km": km,
                "travel": travel,
                "depart": clock,
                "arrive": arrive,
                "leave": leave,
            }
        )
        here, clock, origin = point, leave, outlet["outlet_id"]
    return legs
