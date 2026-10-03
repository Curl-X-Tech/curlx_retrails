import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import utc_now
from app.entities.customer_order import CustomerOrder, OrderItem
from app.entities.staff_profile import StaffProfile
from app.entities.trip import DiscrepancyReport, RouteLeg, Trip
from app.entities.user import User
from app.entities.vehicle import Vehicle

ISSUE_TO_TYPE = {
    "damaged_in_transit": "damaged",
    "missing_crate": "shortage",
    "rejected_by_store": "rejected",
    "temp_spoilage": "temp_breach",
}


def as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


async def staff_for(session: AsyncSession, user: User) -> StaffProfile | None:
    return (await session.execute(select(StaffProfile).where(StaffProfile.user_id == user.id))).scalar_one_or_none()


async def get_leg(
    session: AsyncSession, waypoint_id: uuid.UUID, user: User, enforce_driver: bool
) -> tuple[RouteLeg, Trip]:
    leg = await session.get(RouteLeg, waypoint_id)
    trip = await session.get(Trip, leg.trip_id) if leg else None
    if leg is None or trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="WAYPOINT_NOT_FOUND")
    if (
        enforce_driver
        and str(user.user_type.value if hasattr(user.user_type, "value") else user.user_type) != "system_admin"
    ):
        staff = await staff_for(session, user)
        if staff is None or staff.id != trip.driver_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="NOT_TRIP_DRIVER")
    return leg, trip


def record_discrepancy(
    session: AsyncSession,
    trip: Trip,
    order_id: uuid.UUID,
    item: OrderItem,
    issue_type: str,
    qty: int,
    notes: str | None,
    staff_id: uuid.UUID,
    pod_id: uuid.UUID | None,
) -> DiscrepancyReport:
    report = DiscrepancyReport(
        name=issue_type,
        trip_id=trip.id,
        order_id=order_id,
        order_item_id=item.id,
        pod_id=pod_id,
        discrepancy_type=ISSUE_TO_TYPE[issue_type],
        reported_qty=qty,
        reported_by_staff_id=staff_id,
        reported_at=utc_now(),
        description=notes or "",
    )
    session.add(report)
    return report


async def finish_trip_if_done(session: AsyncSession, trip: Trip) -> None:
    legs = (await session.execute(select(RouteLeg.status).where(RouteLeg.trip_id == trip.id))).scalars().all()
    if legs and all(s in ("completed", "skipped") for s in legs):
        trip.status = "completed"
        trip.actual_end_time = utc_now()
        vehicle = await session.get(Vehicle, trip.vehicle_id)
        if vehicle:
            vehicle.status = "available"


async def mark_order_delivered(session: AsyncSession, order_id: uuid.UUID, flagged: set[uuid.UUID]) -> None:
    order = await session.get(CustomerOrder, order_id)
    if order:
        order.status = "delivered"
        order.updated_at = utc_now()
    items = (await session.execute(select(OrderItem).where(OrderItem.order_id == order_id))).scalars().all()
    for item in items:
        if item.id not in flagged:
            item.delivered_qty = item.requested_qty
