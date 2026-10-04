import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_async_session
from app.core.timezone import utc_now
from app.entities.staff_profile import StaffProfile
from app.entities.trip import LoadingChecklistItem, RouteLeg, Trip
from app.entities.user import User
from app.guards import RoleGuard, require_loader
from app.enums.roles import RoleType
from app.services.checklist import ensure_checklist
from app.services.trip_views import TripContext, iso, load_context, load_contexts, pct

router = APIRouter(prefix="/loader", tags=["loader"])

SessionDep = Annotated[AsyncSession, Depends(get_async_session)]
LoaderDep = Annotated[User, Depends(require_loader)]
ViewerDep = Annotated[User, Depends(RoleGuard(RoleType.DISPATCHER, RoleType.LOADER))]

API_TO_DB = {"pending": "pending", "verified": "verified", "flagged_shortfall": "flagged"}
DB_TO_API = {"pending": "pending", "scanned": "pending", "verified": "verified", "flagged": "flagged_shortfall"}


class VerifyItemRequest(BaseModel):
    status: str
    shortfall_qty: int | None = None
    note: str | None = None


class ConfirmDepartureRequest(BaseModel):
    seal_number: str | None = None


async def _checklist_rows(session: AsyncSession, trip_id: uuid.UUID) -> list[LoadingChecklistItem]:
    await ensure_checklist(session, trip_id)
    await session.flush()
    return list(
        (await session.execute(select(LoadingChecklistItem).where(LoadingChecklistItem.trip_id == trip_id)))
        .scalars()
        .all()
    )


def _dock_status(trip: Trip, rows: list[LoadingChecklistItem], legs: list[RouteLeg]) -> str:
    if trip.status in ("dispatched", "in_transit", "completed"):
        return "departed"
    if rows and all(r.status in ("verified", "flagged") for r in rows) and all(leg.sealed_at for leg in legs):
        return "verified_sealed"
    return "docked_loading" if trip.status == "loading" else "empty"


def _item_read(ctx: TripContext, row: LoadingChecklistItem, item: Any, leg: RouteLeg) -> dict[str, Any]:
    cat = ctx.catalog[item.item_id]
    return {
        "id": str(row.id),
        "trip_id": str(row.trip_id),
        "order_item_id": str(row.order_item_id),
        "package_code": item.package_code,
        "sku": cat.sku,
        "item_title": cat.name,
        "category": cat.category,
        "staging_bay": f"S{leg.seq + 1}",
        "crate_count": item.requested_qty,
        "gross_weight_kg": round(item.requested_qty * item.unit_weight_kg, 2),
        "gross_volume_m3": round(item.requested_qty * item.unit_volume_m3, 3),
        "is_reefer": cat.requires_cold_chain,
        "temperature_req": "2-8C" if cat.requires_cold_chain else None,
        "special_handling_code": item.special_handling_code,
        "verification_status": DB_TO_API[row.status],
        "verified_by_user_id": str(row.verified_by_staff_id) if row.verified_by_staff_id else None,
        "verified_at": iso(row.verified_at),
        "shortfall_qty": row.shortfall_qty,
        "note": row.notes,
    }


def _parse_uuid(value: str | None) -> uuid.UUID | None:
    try:
        return uuid.UUID(value) if value else None
    except ValueError:
        return None


async def _staff_id(session: AsyncSession, user: User) -> uuid.UUID | None:
    return (await session.execute(select(StaffProfile.id).where(StaffProfile.user_id == user.id))).scalar_one_or_none()


@router.get("/bays")
async def list_bays(session: SessionDep, _: ViewerDep, depot_id: str | None = None):
    query = (
        select(Trip)
        .where(Trip.status.in_(("scheduled", "loading", "dispatched")))
        .order_by(Trip.dispatch_date, Trip.trip_code)
    )
    depot = _parse_uuid(depot_id)
    if depot:
        query = query.where(Trip.depot_id == depot)
    trips = list((await session.execute(query)).scalars().all())
    result = []
    for number, ctx in enumerate(await load_contexts(session, trips), start=1):
        rows = await _checklist_rows(session, ctx.trip.id) if ctx.trip.status in ("loading", "dispatched") else []
        verified = [r for r in rows if r.status in ("verified", "flagged")]
        done = [i for i in ctx.all_items if i.id in {r.order_item_id for r in verified}]
        weight = round(sum(i.requested_qty * i.unit_weight_kg for i in done), 2)
        volume = round(sum(i.requested_qty * i.unit_volume_m3 for i in done), 3)
        vehicle, first_leg = ctx.vehicle, (ctx.legs[0] if ctx.legs else None)
        result.append(
            {
                "bay": {
                    "id": str(ctx.trip.id),
                    "bay_number": f"BAY-{number:02d}",
                    "depot_id": str(ctx.trip.depot_id),
                    "vehicle_id": str(vehicle.id),
                    "trip_id": str(ctx.trip.id),
                    "dock_status": _dock_status(ctx.trip, rows, ctx.legs),
                    "started_at": iso(ctx.trip.updated_at) if ctx.trip.status != "scheduled" else None,
                    "completed_at": None,
                },
                "vehicle": {
                    "id": str(vehicle.id),
                    "vehicle_id": vehicle.vehicle_id,
                    "reg_number": vehicle.reg_number,
                    "model_name": vehicle.model_name,
                    "type": vehicle.type,
                    "temp": vehicle.temp,
                    "weight_cap_kg": vehicle.weight_cap_kg,
                    "volume_cap_m3": vehicle.volume_cap_m3,
                },
                "driver": {
                    "name": ctx.driver.name if ctx.driver else "",
                    "phone": ctx.driver.phone if ctx.driver else "",
                    "license_number": ctx.driver.license_number if ctx.driver else None,
                },
                "trip": {
                    "id": str(ctx.trip.id),
                    "trip_code": ctx.trip.trip_code,
                    "dispatch_date": ctx.trip.dispatch_date.isoformat(),
                    "planned_departure_time": first_leg.planned_depart_time.strftime("%H:%M:%S") if first_leg else "",
                    "stops_count": len(ctx.legs),
                    "next_stop_name": ctx.outlets[first_leg.to_outlet_id].name if first_leg else "",
                    "status": ctx.trip.status,
                },
                "progress": {
                    "verified_items_count": len(verified),
                    "total_items_count": len(ctx.all_items),
                    "verified_crates_count": sum(i.requested_qty for i in done),
                    "total_crates_count": ctx.packages,
                    "payload_kg": weight,
                    "max_payload_kg": vehicle.weight_cap_kg,
                    "payload_percentage": pct(weight, vehicle.weight_cap_kg),
                    "volume_m3": volume,
                    "max_volume_m3": vehicle.volume_cap_m3,
                    "volume_percentage": pct(volume, vehicle.volume_cap_m3),
                },
            }
        )
    return result


@router.get("/trips/{trip_id}/checklist")
async def get_checklist(trip_id: uuid.UUID, session: SessionDep, _: ViewerDep):
    ctx = await load_context(session, trip_id)
    rows = await _checklist_rows(session, trip_id)
    await session.commit()
    by_item = {r.order_item_id: r for r in rows}
    waypoints = []
    for idx, leg in enumerate(ctx.legs, start=1):
        outlet = ctx.outlets[leg.to_outlet_id]
        items = [
            _item_read(ctx, by_item[i.id], i, leg)
            for i in ctx.items.get(leg.order_id, [])
            if leg.order_id and i.id in by_item
        ]
        waypoints.append(
            {
                "seq": idx,
                "outlet_id": str(outlet.id),
                "outlet_code": outlet.outlet_id,
                "outlet_name": outlet.name,
                "dock_type": getattr(outlet.dock_type, "value", outlet.dock_type),
                "parking_constraint": getattr(outlet.parking_constraint, "value", outlet.parking_constraint),
                "delivery_window": f"{outlet.window_open_time:%H:%M}-{outlet.window_close_time:%H:%M}",
                "is_sealed": leg.sealed_at is not None,
                "sealed_at": iso(leg.sealed_at),
                "sealed_by_user_id": str(leg.sealed_by_staff_id) if leg.sealed_by_staff_id else None,
                "items": items,
            }
        )
    verified = sum(r.status in ("verified", "flagged") for r in rows)
    sealed = sum(w["is_sealed"] for w in waypoints)
    return {
        "trip": {
            "id": str(ctx.trip.id),
            "trip_code": ctx.trip.trip_code,
            "dispatch_date": ctx.trip.dispatch_date.isoformat(),
            "status": ctx.trip.status,
            "vehicle_id": str(ctx.vehicle.id),
            "vehicle_reg": ctx.vehicle.reg_number,
            "driver_name": ctx.driver.name if ctx.driver else "",
            "depot_id": str(ctx.trip.depot_id),
            "dock_bay": f"BAY-{ctx.trip.trip_sequence:02d}",
            "seal_number": ctx.trip.seal_number,
        },
        "waypoints": waypoints,
        "summary": {
            "total_waypoints": len(waypoints),
            "sealed_waypoints": sealed,
            "total_items": len(rows),
            "verified_items": verified,
            "is_ready_for_departure": bool(waypoints) and sealed == len(waypoints) and verified == len(rows),
        },
    }


@router.post("/items/{item_id}/verify")
async def verify_item(item_id: uuid.UUID, payload: VerifyItemRequest, session: SessionDep, user: LoaderDep):
    row = await session.get(LoadingChecklistItem, item_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CHECKLIST_ITEM_NOT_FOUND")
    if payload.status not in API_TO_DB:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="INVALID_STATUS")
    trip = await session.get(Trip, row.trip_id)
    if trip is None or trip.status != "loading":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="TRIP_NOT_LOADING")
    now = utc_now()
    row.status = API_TO_DB[payload.status]
    row.shortfall_qty = payload.shortfall_qty or 0
    row.notes = payload.note
    row.verified_by_staff_id = await _staff_id(session, user)
    row.verified_at = now if row.status != "pending" else None
    row.updated_at = now
    await session.commit()
    return {"success": True, "item_id": str(row.id), "status": payload.status, "verified_at": now.isoformat()}


@router.post("/trips/{trip_id}/waypoints/{seq}/seal")
async def seal_waypoint(trip_id: uuid.UUID, seq: int, session: SessionDep, user: LoaderDep):
    legs = (
        (await session.execute(select(RouteLeg).where(RouteLeg.trip_id == trip_id).order_by(RouteLeg.seq)))
        .scalars()
        .all()
    )
    leg = legs[seq - 1] if 0 < seq <= len(legs) else (legs[seq] if 0 <= seq < len(legs) else None)
    if leg is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="WAYPOINT_NOT_FOUND")
    rows = await _checklist_rows(session, trip_id)
    leg_items = {i.id for i in (await load_context(session, trip_id)).items.get(leg.order_id, [])}
    if any(r.status == "pending" for r in rows if r.order_item_id in leg_items):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="UNVERIFIED_ITEMS")
    now = utc_now()
    leg.sealed_at = now
    leg.sealed_by_staff_id = await _staff_id(session, user)
    leg.updated_at = now
    await session.commit()
    return {"success": True, "trip_id": str(trip_id), "seq": seq, "is_sealed": True, "sealed_at": now.isoformat()}


@router.post("/trips/{trip_id}/confirm-departure")
async def confirm_departure(
    trip_id: uuid.UUID, session: SessionDep, user: LoaderDep, payload: ConfirmDepartureRequest | None = None
):
    ctx = await load_context(session, trip_id)
    trip = ctx.trip
    if trip.status not in ("scheduled", "loading"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="TRIP_NOT_LOADING")
    rows = await _checklist_rows(session, trip_id)
    now, staff_id = utc_now(), await _staff_id(session, user)

    for r in rows:
        if r.status == "pending":
            r.status = "verified"
            r.verified_by_staff_id = staff_id
            r.verified_at = now
            r.updated_at = now

    for leg in ctx.legs:
        if leg.sealed_at is None:
            leg.sealed_at = now
            leg.sealed_by_staff_id = staff_id
            leg.updated_at = now

    seal_num = (payload and payload.seal_number) or trip.seal_number or f"SL-{trip.trip_code}"
    trip.status = "dispatched"
    trip.seal_number = seal_num
    trip.actual_start_time = now
    trip.updated_at, trip.updated_by = now, user.id
    for order in ctx.orders.values():
        order.status = "in_transit"
        order.updated_at = now
    ctx.vehicle.status = "in_transit"
    await session.commit()
    return {
        "success": True,
        "trip_id": str(trip_id),
        "status": trip.status,
        "seal_number": seal_num,
        "departed_at": now.isoformat(),
    }


@router.post("/trips/{trip_id}/start-loading")
async def start_loading(trip_id: uuid.UUID, session: SessionDep, user: LoaderDep):
    ctx = await load_context(session, trip_id)
    trip = ctx.trip
    if trip.status not in ("scheduled", "loading"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CANNOT_START_LOADING")
    now = utc_now()
    trip.status = "loading"
    trip.updated_at, trip.updated_by = now, user.id
    await ensure_checklist(session, trip_id)
    await session.commit()
    return {"success": True, "trip_id": str(trip_id), "status": trip.status, "started_at": now.isoformat()}
