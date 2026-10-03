import * as React from "react";
import { useDeferrals, useDeferralAuditLogs } from "@/api/deferrals";
import type { CarryoverOrder, DeferralAuditRecord } from "@/features/dispatcher/types";

export function useStoreDeferrals(searchQuery: string = "", outletId?: string) {
  const { data: deferredOrders = [] } = useDeferrals(
    outletId ? { outlet_id: outletId } : {}
  );
  const { data: auditLogs = [] } = useDeferralAuditLogs(
    outletId ? { outlet_id: outletId } : {}
  );

  const q = searchQuery.toLowerCase().trim();

  const carryoverOrders: CarryoverOrder[] = React.useMemo(() => {
    return deferredOrders
      .map((o) => ({
        id: o.id,
        orderRef: o.order_ref,
        outletId: o.outlet_id,
        outletName: o.outlet_name || `Outlet ${o.outlet_id}`,
        brand: (o.brand || "Fresh") as "Fresh" | "Style" | "Tech",
        district: o.district || "Colombo",
        dockType: (o.dock_type as CarryoverOrder["dockType"]) || "rear_dock",
        parkingConstraint:
          (o.parking_constraint as CarryoverOrder["parkingConstraint"]) || "normal",
        tempRequirement: o.temp_requirement,
        totalItems: o.total_items || 1,
        totalWeightKg: o.total_weight_kg,
        totalVolumeM3: o.total_volume_m3,
        totalValueLkr: o.total_price_lkr,
        deferredYesterday: (o.deferred_yesterday ?? 0) as 0 | 1,
        daysSinceLastServed: o.days_since_last_served ?? 0,
        deferralReason: (o.deferral_reason ||
          o.latest_reason ||
          "manual_dispatcher_override") as string,
        limitingResource: (o.limiting_resource || "time_budget") as string,
        suggestedVehicleCategory: o.suggested_vehicle_category || "Dry Lorry / Van",
        notes: o.notes,
      }))
      .filter(
        (order) =>
          !q ||
          order.orderRef.toLowerCase().includes(q) ||
          order.outletName.toLowerCase().includes(q) ||
          order.deferralReason.toLowerCase().includes(q)
      );
  }, [deferredOrders, q]);

  const mappedLogs: DeferralAuditRecord[] = React.useMemo(() => {
    return auditLogs
      .map((l) => ({
        id: l.id,
        orderId: l.order_id,
        orderRef: l.order_ref || `ORD-${l.order_id.slice(0, 6)}`,
        outletId: l.outlet_id,
        outletName: l.outlet_name || `Outlet ${l.outlet_id}`,
        brand: (l.brand || "Fresh") as "Fresh" | "Style" | "Tech",
        district: l.district || "Colombo",
        dispatchDate: l.dispatch_date,
        deferralReason: l.deferral_reason,
        limitingResource: l.limiting_resource,
        decisionMakerStaffId: l.decision_maker_staff_id,
        decisionMakerName: l.decision_maker_name || "Dispatcher Staff",
        decisionMakerRole: l.decision_maker_role || "Dispatcher",
        totalWeightKg: l.total_weight_kg || 0,
        totalVolumeM3: l.total_volume_m3 || 0,
        totalValueLkr: l.total_value_lkr || 0,
        tempRequirement: l.temp_requirement || "ambient",
        dockType: (l.dock_type as DeferralAuditRecord["dockType"]) || "rear_dock",
        notes: l.notes || undefined,
        createdAt: l.created_at,
      }))
      .filter(
        (log) =>
          !q ||
          log.orderRef.toLowerCase().includes(q) ||
          log.outletName.toLowerCase().includes(q) ||
          log.deferralReason.toLowerCase().includes(q)
      );
  }, [auditLogs, q]);

  return {
    carryoverOrders,
    auditLogs: mappedLogs,
    totalCarryovers: carryoverOrders.length,
  };
}
