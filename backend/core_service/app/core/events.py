"""
Core Service — Event emission handler.
"""

from __future__ import annotations

import datetime
import json
import logging
from typing import Any

logger = logging.getLogger("core.events")


async def emit_event(
    routing_key: str,
    payload: dict[str, Any],
    exchange_name: str = "trip.events",
) -> None:
    """Log event emission within core_service."""
    event_envelope = {
        "event": routing_key,
        "exchange": exchange_name,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "payload": payload,
    }
    logger.info(f"[core-service:EVENT] {routing_key}: {json.dumps(event_envelope)}")
