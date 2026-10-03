import uuid
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.core.timezone import utc_now
from app.entities.customer_order import OrderItem
from app.entities.trip import ProofOfDelivery
from app.entities.user import User
from app.guards import RoleGuard, require_driver
from app.enums.roles import RoleType
from app.services.deliveries import (
    ISSUE_TO_TYPE,
    as_utc,
    finish_trip_if_done,
    get_leg,
    mark_order_delivered,
    record_discrepancy,
    staff_for,
)

router = APIRouter(prefix="/deliveries", tags=["deliveries"])

SessionDep = Annotated[AsyncSession, Depends(get_async_session)]
DriverDep = Annotated[User, Depends(require_driver)]
ReporterDep = Annotated[User, Depends(RoleGuard(RoleType.DRIVER, RoleType.STORE_MANAGER))]


class Coordinates(BaseModel):
    latitude: float
    longitude: float


class ArriveRequest(BaseModel):
    arrived_at: datetime
    coordinates: Coordinates | None = None


class DiscrepancyRequest(BaseModel):
    item_id: uuid.UUID
    issue_type: str
    reported_qty: int
    notes: str | None = None


class PodRequest(BaseModel):
    recipient_name: str
    signature_data_url: str
    photo_proof_url: str | None = None
    arrived_at: datetime
    completed_at: datetime
    discrepancies: list[DiscrepancyRequest] = []


def _check_issue(issue_type: str) -> None:
    if issue_type not in ISSUE_TO_TYPE:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="INVALID_ISSUE_TYPE")


async def _item(session: AsyncSession, item_id: uuid.UUID, order_id: uuid.UUID | None) -> OrderItem:
    item = await session.get(OrderItem, item_id)
    if item is None or (order_id is not None and item.order_id != order_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ITEM_NOT_FOUND")
    return item


@router.post("/{waypoint_id}/arrive")
async def arrive(waypoint_id: uuid.UUID, payload: ArriveRequest, session: SessionDep, user: DriverDep):
    leg, trip = await get_leg(session, waypoint_id, user, True)
    if leg.status in ("completed", "skipped"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="WAYPOINT_CLOSED")
    leg.status = "arrived"
    leg.arrival_time = as_utc(payload.arrived_at)
    leg.updated_at = utc_now()
    if trip.status == "dispatched":
        trip.status = "in_transit"
    await session.commit()
    return {"success": True, "waypoint_id": str(leg.id), "status": leg.status}


@router.post("/{waypoint_id}/pod")
async def submit_pod(waypoint_id: uuid.UUID, payload: PodRequest, session: SessionDep, user: DriverDep):
    leg, trip = await get_leg(session, waypoint_id, user, True)
    if leg.order_id is None or leg.status in ("completed", "skipped"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="WAYPOINT_CLOSED")
    for entry in payload.discrepancies:
        _check_issue(entry.issue_type)
    staff = await staff_for(session, user)
    if staff is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="DRIVER_PROFILE_NOT_FOUND")
    arrived, completed = as_utc(payload.arrived_at), as_utc(payload.completed_at)
    pod = ProofOfDelivery(
        name=payload.recipient_name,
        trip_id=trip.id,
        route_leg_id=leg.id,
        order_id=leg.order_id,
        outlet_id=leg.to_outlet_id,
        recipient_name=payload.recipient_name,
        signature_svg=payload.signature_data_url,
        arrived_at=arrived,
        delivered_at=completed,
        photo_evidence_url=payload.photo_proof_url,
    )
    session.add(pod)
    flagged = set()
    for entry in payload.discrepancies:
        item = await _item(session, entry.item_id, leg.order_id)
        record_discrepancy(
            session, trip, leg.order_id, item, entry.issue_type, entry.reported_qty, entry.notes, staff.id, pod.id
        )
        flagged.add(item.id)
    leg.status = "completed"
    leg.arrival_time = leg.arrival_time or arrived
    leg.leave_outlet_time = completed
    leg.updated_at = utc_now()
    await mark_order_delivered(session, leg.order_id, flagged)
    await session.flush()
    await finish_trip_if_done(session, trip)
    await session.commit()
    return {
        "id": str(pod.id),
        "route_leg_id": str(leg.id),
        "order_id": str(leg.order_id),
        "recipient_name": pod.recipient_name,
        "signature_data_url": pod.signature_svg,
        "photo_proof_url": pod.photo_evidence_url,
        "arrived_at": arrived.isoformat(),
        "completed_at": completed.isoformat(),
    }


@router.post("/{waypoint_id}/discrepancy")
async def log_discrepancy(waypoint_id: uuid.UUID, payload: DiscrepancyRequest, session: SessionDep, user: ReporterDep):
    leg, trip = await get_leg(
        session, waypoint_id, user, str(getattr(user.user_type, "value", user.user_type)) == "driver"
    )
    _check_issue(payload.issue_type)
    if leg.order_id is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="WAYPOINT_HAS_NO_ORDER")
    item = await _item(session, payload.item_id, leg.order_id)
    staff = await staff_for(session, user)
    report = record_discrepancy(
        session,
        trip,
        leg.order_id,
        item,
        payload.issue_type,
        payload.reported_qty,
        payload.notes,
        staff.id if staff else user.id,
        None,
    )
    await session.commit()
    result: dict[str, Any] = {
        "id": str(report.id),
        "pod_id": str(report.pod_id or ""),
        "item_id": str(item.id),
        "issue_type": payload.issue_type,
        "reported_qty": payload.reported_qty,
        "notes": payload.notes,
    }
    return result
