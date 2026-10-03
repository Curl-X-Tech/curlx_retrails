import * as React from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useOrder } from "@/api/orders";
import { mockCarryoverKPIs, mockDeferralAuditLogs } from "@/data/mock-deferrals";
import { useCarryoverOrders } from "./use-carryover-orders";
import { useDeferralAuditLogs } from "./use-deferral-audit-logs";
import type { CarryoverGroupBy, AuditGroupBy, QueuedOrder } from "../types";

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

  const { data: detailOrder } = useOrder(orderParam ?? "", {
    enabled: Boolean(orderParam),
  });

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

  const carryover = useCarryoverOrders(
    carryoverSearch,
    carryoverBrandFilter,
    carryoverGroupBy,
    carryoverPage,
    carryoverPageSize
  );

  const audit = useDeferralAuditLogs(
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
      encodeURIComponent(JSON.stringify(mockDeferralAuditLogs, null, 2));
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
    carryoverKPIs: mockCarryoverKPIs,
    auditLogsCount: mockDeferralAuditLogs.length,
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
