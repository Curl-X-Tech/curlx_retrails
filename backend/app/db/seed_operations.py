"""Procedural operational data seeding using core domain services and allocation engine."""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import sl_today, utc_now
from app.entities.customer_order import CustomerOrder
from app.entities.depot import Depot
from app.entities.item import Item
from app.entities.outlet import Outlet
from app.entities.trip import ProofOfDelivery, RouteLeg, Trip, VehicleTelemetry
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
    reset: bool = False,
) -> dict[str, int]:
    """Generates authentic business operations through real domain services."""
    existing_order_count = (await session.execute(select(func.count()).select_from(CustomerOrder))).scalar_one()
    if existing_order_count > 0 and not reset:
        return {"customer_order": 0, "trip": 0, "route_leg": 0, "proof_of_delivery": 0}

    op_date = target_date or (sl_today() + timedelta(days=1))
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
    for index, outlet in enumerate(outlet_list[:45]):
        # Match brand items
        brand_key = "FRESH" if index < 20 else ("STYLE" if index < 32 else "TECH")
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

        order_target_date = op_date if index < 35 else (op_date + timedelta(days=2))
        payload = OrderCreate(
            outlet_id=outlet.id,
            order_date=order_target_date,
            required_date=order_target_date,
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
            trips_list = (
                solver_res.get("proposed_trips", [])
                if isinstance(solver_res, dict)
                else getattr(solver_res, "proposed_trips", [])
            )
            counts["trips"] += len(trips_list)
        except Exception as exc:
            logger.warning("Allocation run for depot %s generated warning: %s", depot_code, exc)

    await session.flush()

    # 3. Warehouse Bay Staging: Generate checklists and LIFO container allocations
    trips_result = await session.execute(select(Trip).where(Trip.dispatch_date == op_date))
    trips = list(trips_result.scalars().all())

    for idx, trip in enumerate(trips):
        if idx == 0:
            trip.status = "loading"
        elif idx == 1:
            trip.status = "dispatched"
        try:
            await ensure_checklist(session, trip.id)
        except Exception as exc:
            logger.debug("Checklist init note: %s", exc)

    if len(trips) > 1:
        session.add(
            VehicleTelemetry(
                vehicle_id=trips[1].vehicle_id,
                trip_id=trips[1].id,
                recorded_at=utc_now(),
                latitude=6.9271,
                longitude=79.8612,
                speed_kmh=42.5,
                heading_deg=180.0,
                reefer_temp_celsius=3.8,
                ambient_temp_celsius=29.5,
                fuel_level_pct=85.0,
                battery_pct=98.0,
            )
        )

    await session.flush()

    # 4. Simulate active/completed legs and Proof of Delivery for Trip 2 (leaving Trip 1 pending for driver flow)
    if trips:
        active_trip = trips[1] if len(trips) > 1 else trips[0]
        legs_res = await session.execute(
            select(RouteLeg).where(RouteLeg.trip_id == active_trip.id).order_by(RouteLeg.seq.asc())
        )
        legs = list(legs_res.scalars().all())

        if legs and (len(trips) > 1 or active_trip.status != "loading"):
            first_leg = legs[0]
            first_leg.status = "completed"
            first_leg.arrival_time = datetime.now(timezone.utc) - timedelta(minutes=45)
            first_leg.leave_outlet_time = datetime.now(timezone.utc) - timedelta(minutes=20)

            # Insert authentic POD record
            pod = ProofOfDelivery(
                trip_id=active_trip.id,
                route_leg_id=first_leg.id,
                order_id=first_leg.order_id,
                outlet_id=first_leg.to_outlet_id,
                recipient_name="Sunil Perera (Store Mgr)",
                recipient_phone="+94 77 123 4567",
                signature_svg="<svg xmlns='http://www.w3.org/2000/svg' width='120' height='60'><path d='M10 30 Q40 5 70 35 T110 25' stroke='#1e293b' stroke-width='2' fill='none'/></svg>",
                arrived_at=first_leg.arrival_time or datetime.now(timezone.utc),
                delivered_at=first_leg.leave_outlet_time or datetime.now(timezone.utc),
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
    return {
        "customer_order": counts["orders"],
        "trip": counts["trips"],
        "route_leg": counts["legs"],
        "proof_of_delivery": counts["pods"],
    }
