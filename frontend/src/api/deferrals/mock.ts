import { mockDelay } from "@/api/_mock-delay";
import { getOrderMock, updateOrderStatusMock } from "@/api/orders/mock";
import { INITIAL_DEFERRAL_AUDIT_LOGS, INITIAL_DEFERRED_ORDERS } from "./mock-data";
import type {
  DeferOrderRequest,
  DeferralAuditLog,
  DeferralFilters,
  DeferralReason,
  DeferralSummary,
  DeferredOrder,
  RequeueRequest,
} from "./types";

let deferredOrdersState: DeferredOrder[] = [...INITIAL_DEFERRED_ORDERS];
let auditLogsState: DeferralAuditLog[] = [...INITIAL_DEFERRAL_AUDIT_LOGS];

export async function getDeferralsMock(
  filters: DeferralFilters = {}
): Promise<DeferredOrder[]> {
  await mockDelay();
  let list = [...deferredOrdersState];

  if (filters.outlet_id) {
    list = list.filter((o) => o.outlet_id === filters.outlet_id);
  }
  if (filters.brand_id) {
    list = list.filter(
      (o) => o.brand_id === filters.brand_id || o.brand === filters.brand_id
    );
  }
  if (filters.date || filters.dispatch_date) {
    const targetDate = filters.date || filters.dispatch_date;
    list = list.filter((o) => o.order_date === targetDate);
  }
  if (filters.reason && filters.reason !== "all") {
    list = list.filter(
      (o) => o.deferral_reason === filters.reason || o.latest_reason === filters.reason
    );
  }
  if (filters.limiting_resource && filters.limiting_resource !== "all") {
    list = list.filter((o) => o.limiting_resource === filters.limiting_resource);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (o) =>
        o.order_ref.toLowerCase().includes(q) ||
        o.outlet_name?.toLowerCase().includes(q) ||
        o.outlet_id.toLowerCase().includes(q) ||
        o.district?.toLowerCase().includes(q)
    );
  }

  // Fairness sorting: highest days_since_last_served first, then deferred_yesterday
  list.sort((a, b) => {
    if (b.days_since_last_served !== a.days_since_last_served) {
      return b.days_since_last_served - a.days_since_last_served;
    }
    if (b.deferred_yesterday !== a.deferred_yesterday) {
      return b.deferred_yesterday - a.deferred_yesterday;
    }
    return b.created_at.localeCompare(a.created_at);
  });

  if (filters.page && (filters.limit || filters.page_size)) {
    const pageSize = filters.limit || filters.page_size || 10;
    const start = (filters.page - 1) * pageSize;
    list = list.slice(start, start + pageSize);
  }

  return list;
}

export async function getDeferralSummaryMock(
  _filters: DeferralFilters = {}
): Promise<DeferralSummary> {
  await mockDelay();
  const total = deferredOrdersState.length;
  const critical = deferredOrdersState.filter((o) => o.deferred_yesterday === 1).length;
  const totalWeight = deferredOrdersState.reduce((sum, o) => sum + o.total_weight_kg, 0);
  const totalVolume = deferredOrdersState.reduce((sum, o) => sum + o.total_volume_m3, 0);
  const totalValue = deferredOrdersState.reduce((sum, o) => sum + o.total_price_lkr, 0);
  const chilled = deferredOrdersState.filter(
    (o) => o.temp_requirement === "chilled"
  ).length;
  const ambient = deferredOrdersState.filter(
    (o) => o.temp_requirement === "ambient"
  ).length;
  const vanRestricted = deferredOrdersState.filter(
    (o) => o.parking_constraint === "van_only" || o.dock_type === "street"
  ).length;

  const breakdown: Record<DeferralReason, number> = {
    insufficient_reefer_capacity: 0,
    van_access_shortage: 0,
    time_budget_limit: 0,
    fuel_quota_exceeded: 0,
    manual_dispatcher_override: 0,
  };

  for (const o of deferredOrdersState) {
    const r = (o.deferral_reason || o.latest_reason) as DeferralReason;
    if (r && breakdown[r] !== undefined) {
      breakdown[r]++;
    }
  }

  return {
    total_deferred_orders: total,
    critical_escalations_count: critical,
    total_weight_kg: Number(totalWeight.toFixed(2)),
    total_volume_m3: Number(totalVolume.toFixed(2)),
    total_value_lkr: totalValue,
    chilled_orders_count: chilled,
    ambient_orders_count: ambient,
    van_restricted_count: vanRestricted,
    reasons_breakdown: breakdown,
  };
}

export async function deferOrderMock(
  id: string,
  payload: DeferOrderRequest
): Promise<DeferralAuditLog> {
  await mockDelay();
  if (!payload.reason || !payload.limiting_resource) {
    throw new Error("Deferral reason and limiting resource are required.");
  }

  const now = new Date().toISOString();
  let baseOrder: DeferredOrder | null = null;

  try {
    const order = await getOrderMock(id);
    await updateOrderStatusMock(id, {
      status: "deferred",
      notes: payload.notes || `Deferred: ${payload.reason}`,
    });

    const daysSince = (order.days_since_last_served ?? 0) + 1;
    baseOrder = {
      id: order.id,
      order_ref: order.order_ref,
      outlet_id: order.outlet_id,
      brand_id: order.brand_id,
      brand: order.brand_id.includes("style")
        ? "Style"
        : order.brand_id.includes("tech")
          ? "Tech"
          : "Fresh",
      order_date: payload.dispatch_date || order.order_date,
      temp_requirement: order.temp_requirement,
      status: "deferred",
      total_weight_kg: order.total_weight_kg,
      total_volume_m3: order.total_volume_m3,
      total_price_lkr: order.total_price_lkr,
      created_at: order.created_at,
      days_since_last_served: daysSince,
      deferred_yesterday: 1,
      deferral_reason: payload.reason,
      latest_reason: payload.reason,
      limiting_resource: payload.limiting_resource,
      outlet_name: order.outlet_name || `Outlet ${order.outlet_id}`,
      district: order.district || "Colombo",
      dock_type: order.dock_type || "rear_dock",
      parking_constraint: order.parking_constraint || "normal",
      notes: payload.notes,
    };
  } catch {
    const existing = deferredOrdersState.find((o) => o.id === id || o.order_ref === id);
    if (!existing) {
      throw new Error(`Order ${id} not found to defer.`);
    }
    existing.deferral_reason = payload.reason;
    existing.limiting_resource = payload.limiting_resource;
    existing.notes = payload.notes;
    baseOrder = existing;
  }

  const auditLog: DeferralAuditLog = {
    id: `def-${Date.now()}`,
    order_id: baseOrder.id,
    order_ref: baseOrder.order_ref,
    outlet_id: baseOrder.outlet_id,
    outlet_name: baseOrder.outlet_name,
    brand: baseOrder.brand,
    brand_id: baseOrder.brand_id,
    district: baseOrder.district,
    dispatch_date: payload.dispatch_date || new Date().toISOString().slice(0, 10),
    deferral_reason: payload.reason,
    limiting_resource: payload.limiting_resource,
    decision_maker_staff_id: payload.decision_maker_staff_id || "EMP-001",
    decision_maker_name: "Dispatcher Lead",
    decision_maker_role: "Lead Dispatcher",
    total_weight_kg: baseOrder.total_weight_kg,
    total_volume_m3: baseOrder.total_volume_m3,
    total_value_lkr: baseOrder.total_price_lkr,
    temp_requirement: baseOrder.temp_requirement,
    dock_type: baseOrder.dock_type,
    notes: payload.notes,
    created_at: now,
  };

  auditLogsState = [auditLog, ...auditLogsState];

  const existingIdx = deferredOrdersState.findIndex(
    (o) => o.id === baseOrder?.id || o.order_ref === baseOrder?.order_ref
  );
  if (existingIdx >= 0) {
    deferredOrdersState[existingIdx] = baseOrder;
  } else {
    deferredOrdersState = [baseOrder, ...deferredOrdersState];
  }

  return auditLog;
}

export async function requeueDeferralMock(
  id: string,
  _payload?: RequeueRequest
): Promise<{ success: boolean; id: string }> {
  await mockDelay();
  try {
    await updateOrderStatusMock(id, {
      status: "pending",
      notes: "Re-queued for next planning cycle",
    });
  } catch {
    // Non-fatal if not found in orders store
  }

  deferredOrdersState = deferredOrdersState.filter(
    (o) => o.id !== id && o.order_ref !== id
  );

  return { success: true, id };
}

export async function getDeferralAuditLogsMock(
  filters: DeferralFilters = {}
): Promise<DeferralAuditLog[]> {
  let list = [...auditLogsState];

  if (filters.outlet_id) {
    list = list.filter((l) => l.outlet_id === filters.outlet_id);
  }
  if (filters.reason && filters.reason !== "all") {
    list = list.filter((l) => l.deferral_reason === filters.reason);
  }
  if (filters.limiting_resource && filters.limiting_resource !== "all") {
    list = list.filter((l) => l.limiting_resource === filters.limiting_resource);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (l) =>
        (l.order_ref && l.order_ref.toLowerCase().includes(q)) ||
        (l.outlet_name && l.outlet_name.toLowerCase().includes(q)) ||
        (l.decision_maker_name && l.decision_maker_name.toLowerCase().includes(q)) ||
        (l.notes && l.notes.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => b.created_at.localeCompare(a.created_at));

  if (filters.page && (filters.limit || filters.page_size)) {
    const pageSize = filters.limit || filters.page_size || 10;
    const start = (filters.page - 1) * pageSize;
    list = list.slice(start, start + pageSize);
  }

  return list;
}
