"""
Dispatcher Service — Event Publishing and Outbound Notifications.

Emits to RabbitMQ 'trip.events' exchange:
  - trip.departed:        vehicle leaves depot
  - trip.stop_completed:  stop delivery confirmed
  - trip.completed:       vehicle returns to depot
  - trip.delayed:         delay reported by driver
"""

from __future__ import annotations

import datetime
import json
import logging
from typing import Any

import httpx
import aio_pika

from app.core.config import get_settings

logger = logging.getLogger("dispatch.events")
settings = get_settings()


async def emit_event(routing_key: str, payload: dict[str, Any], exchange_name: str = "trip.events") -> None:
    """
    Publish an event to RabbitMQ 'trip.events' exchange.
    Falls back gracefully if RabbitMQ is not connected.
    """
    event_envelope = {
        "event": routing_key,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "payload": payload,
    }

    published = False
    try:
        connection = await aio_pika.connect_robust(settings.RABBITMQ_URL, timeout=1.0)
        async with connection:
            channel = await connection.channel()
            exchange = await channel.declare_exchange(exchange_name, aio_pika.ExchangeType.TOPIC, durable=True)
            message = aio_pika.Message(
                body=json.dumps(event_envelope).encode(),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            )
            await exchange.publish(message, routing_key=routing_key)
            published = True
    except Exception as exc:
        # Non-blocking graceful degradation when message broker is offline in local dev
        logger.debug(f"[dispatch-service] Event '{routing_key}' broker emit deferred: {exc}")

    # Log event
    status_str = "BROKER" if published else "LOCAL_DISPATCH"
    print(f"[dispatch-service:{status_str}] Event '{routing_key}': {json.dumps(payload)}")

    # If trip completed, optionally notify Order Service for completed orders
    if routing_key == "trip.completed" and "order_ids" in payload:
        await _notify_order_service(payload["order_ids"])


async def _notify_order_service(order_ids: list[str]) -> None:
    """Best-effort notification to order service to update order statuses to delivered."""
    if not order_ids or not settings.ORDER_SERVICE_URL:
        return
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            for oid in order_ids:
                try:
                    await client.patch(
                        f"{settings.ORDER_SERVICE_URL}/orders/v1/orders/{oid}/status",
                        json={"status": "delivered", "notes": "Delivered via Dispatch Service trip completion"},
                    )
                except Exception:
                    pass
    except Exception as e:
        logger.debug(f"[dispatch-service] Could not notify order service: {e}")
