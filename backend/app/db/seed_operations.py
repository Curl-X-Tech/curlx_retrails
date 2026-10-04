"""Procedural operational data seeding using core domain services and allocation engine."""

from __future__ import annotations

import logging
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import utc_now, utc_today
from app.entities.customer_order import CustomerOrder
from app.entities.depot import Depot
from app.entities.item import Item
from app.entities.outlet import Outlet
from app.entities.staff_profile import StaffProfile
from app.entities.trip import ProofOfDelivery, RouteLeg, Trip
from app.entities.user import User
from app.schemas.store_order import OrderCreate, OrderItemCreate
from app.services.allocation.engine import run_allocation_engine
from app.services.checklist import ensure_checklist

logger = logging.getLogger(__name__)


async def seed_operational_pipeline(
    session: AsyncSession,
    users: dict[str, User],
    depots: dict[str, Depot],
    outlets: dict[str, Outlet],
    items: dict[str, Item],
    target_date: date | None = None,
) -> dict[str, int]:
    """Generates authentic business operations through real domain services."""
    op_date = target_date or utc_today()
    counts = {"orders": 0, "trips": 0, "legs": 0, "pods": 0}

    # 1. Place Realistic Store Orders across Outlets using create_order service
    from app.services.orders import create_order

    store_user = users.get("store.fresh@example.com") or users.get("store@example.com")
    store_uid = store_user.id if store_user else None

    # Group items by brand for authentic order creation
    items_by_brand: dict[str, list[Item]] = {}
    for item in items.values():
        brand_code = item.sku.split("-")[0] if "-" in item.sku else "FRESH"
        items_by_brand.setdefault(brand_code, []).append(item)

    outlet_list = list(outlets.values())
    for index, outlet in enumerate(outlet_list[:35]):
        # Match brand items
        brand_key = "FRESH" if index < 20 else ("STYLE" if index < 28 else "TECH")
        avail_items = items_by_brand.get(brand_key) or list(items.values())[:5]

        order_lines = [
            OrderItemCreate(
                item_id=avail_items[0].id,
                requested_qty=10 + (index % 5) * 5,
                special_handling_code=avail_items[0].special_handling_code,
            )
        ]
        if len(avail_items) > 1:
            order_lines.append(
                OrderItemCreate(
                    item_id=avail_items[1].id,
                    requested_qty=5 + (index % 3) * 2,
                    special_handling_code=avail_items[1].special_handling_code,
                )
            )

        payload = OrderCreate(
            outlet_id=outlet.id,
            order_date=op_date,
            required_date=op_date,
            is_urgent=(index % 7 == 0),
            temp_requirement="chilled" if brand_key == "FRESH" and index % 2 == 0 else "ambient",
            items=order_lines,
        )
        try:
            await create_order(session, payload, store_uid)
            counts["orders"] += 1
        except Exception as exc:
            logger.debug("Skipping duplicate order during seed: %s", exc)

    await session.flush()

    # 2. Execute Hybrid Fleet Allocation Engine for both Peliyagoda and Kandy Hubs
    dispatcher_user = users.get("dispatcher.peliyagoda@example.com") or users.get("dispatcher@example.com")
    dispatcher_uid = dispatcher_user.id if dispatcher_user else None

    for depot_code, depot in depots.items():
        try:
            solver_res = await run_allocation_engine(
                session=session,
                depot_id=depot.id,
                operating_date=op_date,
                solver_type="ortools",
                simulation=False,
                user_id=dispatcher_uid,
            )
            counts["trips"] += len(solver_res.trips)
        except Exception as exc:
            logger.warning("Allocation run for depot %s generated warning: %s", depot_code, exc)

    await session.flush()

    # 3. Warehouse Bay Staging: Generate checklists and LIFO container allocations
    trips_result = await session.execute(select(Trip).where(Trip.trip_date == op_date))
    trips = list(trips_result.scalars().all())

    for trip in trips:
        try:
            await ensure_checklist(session, trip.id)
        except Exception as exc:
            logger.debug("Checklist init note: %s", exc)

    await session.flush()

    # 4. Simulate active/completed legs and Proof of Delivery for Trip 1
    if trips:
        active_trip = trips[0]
        legs_res = await session.execute(
            select(RouteLeg).where(RouteLeg.trip_id == active_trip.id).order_by(RouteLeg.sequence_index.asc())
        )
        legs = list(legs_res.scalars().all())

        if legs:
            first_leg = legs[0]
            first_leg.status = "completed"
            first_leg.arrived_at = datetime.now(timezone.utc) - timedelta(minutes=45)
            first_leg.completed_at = datetime.now(timezone.utc) - timedelta(minutes=20)

            # Insert authentic POD record
            driver_profile = await session.execute(
                select(StaffProfile).where(StaffProfile.user_id == active_trip.driver_id)
            )
            profile_row = driver_profile.scalar_one_or_none()

            pod = ProofOfDelivery(
                trip_id=active_trip.id,
                route_leg_id=first_leg.id,
                order_id=first_leg.order_id,
                outlet_id=first_leg.outlet_id,
                recipient_name="Sunil Perera (Store Mgr)",
                recipient_phone="+94 77 123 4567",
                signature_svg="<svg xmlns='http://www.w3.org/2000/svg' width='120' height='60'><path d='M10 30 Q40 5 70 35 T110 25' stroke='#1e293b' stroke-width='2' fill='none'/></svg>",
                arrived_at=first_leg.arrived_at or datetime.now(timezone.utc),
                delivered_at=first_leg.completed_at or datetime.now(timezone.utc),
                delivery_lat=6.9344,
                delivery_lng=79.8428,
                temperature_reading=4.2 if first_leg.order_id else None,
                photo_evidence_url="http://localhost:9000/retrails-media/pod/pod_sample_001.webp",
                is_offline_synced=True,
            )
            session.add(pod)
            counts["pods"] += 1
            counts["legs"] = len(legs)

    await session.flush()
    return counts
