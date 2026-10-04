"""Timezone and DateTime utilities for ReTrails (Team CurlX).

Ensures strict separation between:
1. Universal UTC storage for event/audit timestamps (TIMESTAMPTZ)
2. Sri Lanka Standard Time (Asia/Colombo, UTC+05:30) for business day rollovers,
   demand surge evaluation, operating calendar queries, and local wall-clock schedules.
"""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

SRI_LANKA_TZ = ZoneInfo("Asia/Colombo")


def utc_now() -> datetime:
    """Current timestamp in universal UTC."""
    return datetime.now(timezone.utc)


def utc_today() -> date:
    """Current UTC date."""
    return datetime.now(timezone.utc).date()


def sl_now() -> datetime:
    """Current datetime in Sri Lanka Standard Time (UTC+05:30)."""
    return datetime.now(SRI_LANKA_TZ)


def sl_today() -> date:
    """Current business/operating date in Sri Lanka Standard Time."""
    return sl_now().date()
