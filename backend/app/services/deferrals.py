import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.entities.brand import Brand
from app.entities.customer_order import CustomerOrder, DeferralAuditLog, OrderItem
from app.entities.district import District
from app.entities.outlet import Outlet
from app.entities.staff_profile import StaffProfile
from app.schemas.store_order import DeferredOrderRead
from app.services.orders import order_reads


async def fetch_deferred_orders(
    session: AsyncSession,
    outlet_id: uuid.UUID | None = None,
    brand_id: uuid.UUID | None = None,
    on: date | None = None,
    reason: str | None = None,
) -> list[DeferredOrderRead]:
    query = select(CustomerOrder).where(CustomerOrder.status == "deferred")
    if brand_id:
        query = query.join(Outlet, Outlet.id == CustomerOrder.outlet_id).where(Outlet.brand_id == brand_id)
    if outlet_id:
        query = query.where(CustomerOrder.outlet_id == outlet_id)
    orders = list((await session.execute(query.order_by(CustomerOrder.order_date.desc()))).scalars().all())
    if not orders:
        return []

    ids = [o.id for o in orders]
    latest: dict[uuid.UUID, DeferralAuditLog] = {}
    logs = await session.execute(
        select(DeferralAuditLog).where(DeferralAuditLog.order_id.in_(ids)).order_by(DeferralAuditLog.created_at.asc())
    )
    for log in logs.scalars():
        latest[log.order_id] = log
    outlets = {o.id: o for o in (await session.execute(select(Outlet))).scalars()}
    districts = {d.id: d.name for d in (await session.execute(select(District))).scalars()}
    item_counts = dict(
        (
            await session.execute(
                select(OrderItem.order_id, func.count(OrderItem.id))
                .where(OrderItem.order_id.in_(ids))
                .group_by(OrderItem.order_id)
            )
        )
        .tuples()
        .all()
    )

    results = []
    for read in await order_reads(session, orders):
        log = latest.get(read.id)
        if (on and (log is None or log.dispatch_date != on)) or (
            reason and (log is None or log.deferral_reason != reason)
        ):
            continue
        outlet = outlets.get(read.outlet_id)
        data = read.model_dump()
        data.update(
            {
                "deferral_reason": log.deferral_reason if log else None,
                "latest_reason": log.deferral_reason if log else None,
                "limiting_resource": log.limiting_resource if log else None,
                "outlet_name": outlet.name if outlet else read.outlet_name,
                "district": districts.get(outlet.district_id) if outlet else read.district,
                "dock_type": outlet.dock_type.value if outlet else read.dock_type,
                "parking_constraint": outlet.parking_constraint.value if outlet else read.parking_constraint,
                "total_items": item_counts.get(read.id, read.total_items or 0),
                "notes": log.notes if log else None,
            }
        )
        results.append(DeferredOrderRead(**data))
    return results


async def fetch_deferral_audit_logs(
    session: AsyncSession,
    outlet_id: uuid.UUID | None = None,
    brand_id: uuid.UUID | None = None,
    date_filter: date | None = None,
    reason: str | None = None,
    limiting_resource: str | None = None,
    search: str | None = None,
) -> list[dict[str, object]]:
    query = select(DeferralAuditLog).order_by(DeferralAuditLog.created_at.desc())
    if outlet_id:
        query = query.where(DeferralAuditLog.outlet_id == outlet_id)
    if date_filter:
        query = query.where(DeferralAuditLog.dispatch_date == date_filter)
    if reason and reason != "all":
        query = query.where(DeferralAuditLog.deferral_reason == reason)
    if limiting_resource and limiting_resource != "all":
        query = query.where(DeferralAuditLog.limiting_resource == limiting_resource)
    logs = list((await session.execute(query)).scalars().all())
    if not logs:
        return []
    orders = {
        o.id: o
        for o in (
            await session.execute(select(CustomerOrder).where(CustomerOrder.id.in_([lg.order_id for lg in logs])))
        ).scalars()
    }
    ord_reads = {r.id: r for r in await order_reads(session, list(orders.values()))}
    outlets = {o.id: o for o in (await session.execute(select(Outlet))).scalars()}
    brands = {b.id: b.name for b in (await session.execute(select(Brand))).scalars()}
    districts = {d.id: d.name for d in (await session.execute(select(District))).scalars()}
    staff_profiles = {sp.user_id: sp for sp in (await session.execute(select(StaffProfile))).scalars() if sp.user_id}
    results = []
    for log in logs:
        ord_rec, ord_r, out_rec = orders.get(log.order_id), ord_reads.get(log.order_id), outlets.get(log.outlet_id)
        staff = staff_profiles.get(log.decision_maker_staff_id)
        if brand_id and out_rec and out_rec.brand_id != brand_id:
            continue
        oref, oname = (
            ord_rec.order_ref if ord_rec else f"ORD-{str(log.order_id)[:6]}",
            out_rec.name if out_rec else f"Outlet {log.outlet_id}",
        )
        if search and not (
            search.lower() in oref.lower()
            or search.lower() in oname.lower()
            or (log.notes and search.lower() in log.notes.lower())
        ):
            continue
        brand_label = brands.get(out_rec.brand_id, "Fresh") if out_rec else "Fresh"
        s_name = f"{staff.first_name} {staff.last_name}".strip() if staff else "K. Jayawardena"
        s_role = staff.role if staff else "dispatcher"
        results.append(
            {
                "id": str(log.id),
                "order_id": str(log.order_id),
                "order_ref": oref,
                "outlet_id": str(log.outlet_id),
                "outlet_name": oname,
                "brand": brand_label,
                "brand_id": str(out_rec.brand_id) if out_rec else None,
                "district": districts.get(out_rec.district_id) if out_rec else "Colombo",
                "dispatch_date": log.dispatch_date.isoformat(),
                "deferral_reason": log.deferral_reason,
                "limiting_resource": log.limiting_resource,
                "decision_maker_staff_id": str(log.decision_maker_staff_id),
                "decision_maker_name": s_name,
                "decision_maker_role": s_role,
                "total_weight_kg": ord_r.total_weight_kg if ord_r else 0.0,
                "total_volume_m3": ord_r.total_volume_m3 if ord_r else 0.0,
                "total_value_lkr": ord_r.total_price_lkr if ord_r else 0.0,
                "temp_requirement": ord_rec.temp_requirement if ord_rec else "ambient",
                "dock_type": out_rec.dock_type.value if out_rec else "rear_dock",
                "notes": log.notes,
                "created_at": log.created_at.isoformat(),
            }
        )
    return results
