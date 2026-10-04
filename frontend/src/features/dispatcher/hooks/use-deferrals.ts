import * as React from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useOrder } from "@/api/orders";
import {
  useDeferrals as useApiDeferrals,
  useDeferralSummary as useApiDeferralSummary,
  useDeferralAuditLogs as useApiDeferralAuditLogs,
} from "@/api/deferrals";
import { useCarryoverOrders } from "./use-carryover-orders";
import { useDeferralAuditLogs } from "./use-deferral-audit-logs";
import type {
  CarryoverGroupBy,
  AuditGroupBy,
  QueuedOrder,
  CarryoverOrder,
  DeferralAuditRecord,
  CarryoverSummaryKPIs,
} from "../types";

export function useDeferrals(
  viewMode: "carryover" | "deferral-log" | "audit-log" = "carryover"
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const isAuditLog =
    viewMode === "deferral-log" ||
    viewMode === "audit-log" ||
    location.pathname.includes("audit-log") ||
    location.pathname.includes("deferral-log");

  const orderParam = searchParams.get("order");

  // Query server/adapter state
  const { data: deferredOrders = [] } = useApiDeferrals();
  const { data: deferralSummary } = useApiDeferralSummary();
  const { data: auditLogs = [] } = useApiDeferralAuditLogs();

  // Carryover Tab State
  const carryoverSearch = searchParams.get("search") || searchParams.get("q") || "";
  const carryoverBrandFilter = searchParams.get("brand") || "all";
  const carryoverGroupBy = (searchParams.get("group") as CarryoverGroupBy) || "none";
  const carryoverPage = parseInt(searchParams.get("page") || "1", 10);
  const carryoverPageSize = 5;

  // Audit Log Tab State
  const auditSearch = searchParams.get("search") || searchParams.get("q") || "";
  const auditReasonFilter = searchParams.get("reason") || "all";
  const auditResourceFilter = searchParams.get("resource") || "all";
  const auditGroupBy = (searchParams.get("group") as AuditGroupBy) || "none";
  const auditSortKey = searchParams.get("sort") || null;
  const auditSortDirection = (searchParams.get("dir") as "asc" | "desc") || "asc";
  const auditPage = parseInt(searchParams.get("page") || "1", 10);
  const auditPageSize = 5;

  const updateQueryParams = React.useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, val]) => {
            if (
              val === null ||
              val === undefined ||
              val === "" ||
              val === "all" ||
              val === "none" ||
              (key === "page" && Number(val) <= 1)
            ) {
              next.delete(key);
            } else {
              next.set(key, String(val));
            }
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const mappedAuditLogs: DeferralAuditRecord[] = React.useMemo(
    () =>
      auditLogs.map((l) => ({
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
      })),
    [auditLogs]
  );

  const selectedAuditLog: DeferralAuditRecord | null = React.useMemo(() => {
    if (!orderParam) return null;
    return (
      mappedAuditLogs.find(
        (l) =>
          l.id === orderParam || l.orderId === orderParam || l.orderRef === orderParam
      ) || null
    );
  }, [orderParam, mappedAuditLogs]);

  const lookupId = selectedAuditLog?.orderId || orderParam || "";
  const { data: detailOrder, isError: detailMissing } = useOrder(lookupId, {
    enabled: Boolean(lookupId),
    retry: false,
  });

  React.useEffect(() => {
    if (detailMissing && !selectedAuditLog) {
      updateQueryParams({ order: null });
    }
  }, [detailMissing, selectedAuditLog, updateQueryParams]);

  const selectedOrder: QueuedOrder | null = React.useMemo(() => {
    if (!orderParam || !detailOrder) return null;
    return {
      id: detailOrder.id,
      orderRef: detailOrder.order_ref,
      outletId: detailOrder.outlet_id,
      outletName: detailOrder.outlet_name || `Outlet ${detailOrder.outlet_id}`,
      outletAddress: detailOrder.outlet_address || "",
      brand: detailOrder.brand_id.includes("style")
        ? "Style"
        : detailOrder.brand_id.includes("tech")
          ? "Tech"
          : "Fresh",
      district: detailOrder.district || "Colombo",
      depot: detailOrder.depot || "Peliyagoda",
      dockType: "rear_dock",
      parkingConstraint: "normal",
      deliveryWindow: detailOrder.delivery_window || "05:00 - 08:00 AM",
      orderDate: detailOrder.order_date,
      requiredDate: detailOrder.required_date ?? detailOrder.order_date,
      tempRequirement: detailOrder.temp_requirement,
      status:
        detailOrder.status === "delivered"
          ? "served"
          : detailOrder.status === "deferred"
            ? "deferred"
            : "pending",
      isUrgent: detailOrder.is_urgent ?? false,
      deferredYesterday: (detailOrder.deferred_yesterday ?? 0) as 0 | 1,
      daysSinceLastServed: detailOrder.days_since_last_served ?? 0,
      totalItems: detailOrder.items.length,
      totalWeightKg: detailOrder.total_weight_kg,
      totalVolumeM3: detailOrder.total_volume_m3,
      totalOrderValueLkr: detailOrder.total_price_lkr,
      items: detailOrder.items.map((i) => ({
        id: i.id || i.item_id,
        orderId: detailOrder.id,
        itemId: i.item_id,
        packageCode: i.package_code || "PKG-000",
        itemName: i.item_name || "Item",
        category: i.category || "General",
        requestedQty: i.requested_qty,
        unitWeightKg: i.unit_weight_kg,
        unitVolumeM3: i.unit_volume_m3,
        unitPrice: i.unit_price,
        totalWeightKg: Number((i.unit_weight_kg * i.requested_qty).toFixed(2)),
        totalVolumeM3: Number((i.unit_volume_m3 * i.requested_qty).toFixed(4)),
        totalPriceLkr: Number((i.unit_price * i.requested_qty).toFixed(2)),
        specialHandlingCode:
          (i.special_handling_code as QueuedOrder["items"][0]["specialHandlingCode"]) ||
          "GEN",
      })),
    };
  }, [orderParam, detailOrder]);

  const carryoverOrders: CarryoverOrder[] = React.useMemo(
    () =>
      deferredOrders.map((o) => ({
        id: o.id,
        orderRef: o.order_ref,
        outletId: o.outlet_id,
        outletName: o.outlet_name || `Outlet ${o.outlet_id}`,
        brand: (o.brand ||
          (o.brand_id.includes("style")
            ? "Style"
            : o.brand_id.includes("tech")
              ? "Tech"
              : "Fresh")) as "Fresh" | "Style" | "Tech",
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
      })),
    [deferredOrders]
  );

  const carryoverKPIs: CarryoverSummaryKPIs = React.useMemo(() => {
    if (deferralSummary) {
      return {
        totalCarryoverOrders: deferralSummary.total_deferred_orders,
        criticalEscalationCount: deferralSummary.critical_escalations_count,
        totalWeightKg: deferralSummary.total_weight_kg,
        totalVolumeM3: deferralSummary.total_volume_m3,
        totalValueLkr: deferralSummary.total_value_lkr,
        chilledOrdersCount: deferralSummary.chilled_orders_count,
        ambientOrdersCount: deferralSummary.ambient_orders_count,
        vanRestrictedCount: deferralSummary.van_restricted_count,
      };
    }
    return {
      totalCarryoverOrders: carryoverOrders.length,
      criticalEscalationCount: carryoverOrders.filter((o) => o.deferredYesterday === 1)
        .length,
      totalWeightKg: carryoverOrders.reduce((sum, o) => sum + o.totalWeightKg, 0),
      totalVolumeM3: carryoverOrders.reduce((sum, o) => sum + o.totalVolumeM3, 0),
      totalValueLkr: carryoverOrders.reduce((sum, o) => sum + o.totalValueLkr, 0),
      chilledOrdersCount: carryoverOrders.filter((o) => o.tempRequirement === "chilled")
        .length,
      ambientOrdersCount: carryoverOrders.filter((o) => o.tempRequirement === "ambient")
        .length,
      vanRestrictedCount: carryoverOrders.filter(
        (o) => o.parkingConstraint === "van_only"
      ).length,
    };
  }, [deferralSummary, carryoverOrders]);

  const carryover = useCarryoverOrders(
    carryoverOrders,
    carryoverSearch,
    carryoverBrandFilter,
    carryoverGroupBy,
    carryoverPage,
    carryoverPageSize
  );

  const audit = useDeferralAuditLogs(
    mappedAuditLogs,
    auditSearch,
    auditReasonFilter,
    auditResourceFilter,
    auditGroupBy,
    auditSortKey,
    auditSortDirection,
    auditPage,
    auditPageSize
  );

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(mappedAuditLogs, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "deferral_audit_log_export.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return {
    isAuditLog,
    orderParam,
    selectedOrder,
    selectedAuditLog,
    carryoverKPIs,
    carryoverOrders,
    auditLogsCount: mappedAuditLogs.length,
    carryoverSearch,
    carryoverBrandFilter,
    carryoverGroupBy,
    carryoverPage,
    carryoverPageSize,
    totalCarryoverPages: carryover.totalPages,
    filteredCarryover: carryover.filtered,
    groupedCarryover: carryover.grouped,
    paginatedCarryover: carryover.paginated,
    auditSearch,
    auditReasonFilter,
    auditResourceFilter,
    auditGroupBy,
    auditSortKey,
    auditSortDirection,
    auditPage,
    auditPageSize,
    totalAuditPages: audit.totalPages,
    filteredAuditLogs: audit.filtered,
    groupedAuditLogs: audit.grouped,
    paginatedAuditLogs: audit.paginated,
    updateQueryParams,
    handleExportJson,
  };
}
