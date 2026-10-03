import * as React from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { mockCarryoverKPIs, mockDeferralAuditLogs } from "@/data/mock-deferrals";
import { mockQueuedOrders } from "@/data/mock-orders";
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

  const selectedOrder: QueuedOrder | null = React.useMemo(() => {
    if (!orderParam) return null;
    return mockQueuedOrders.find((o) => o.orderRef === orderParam) || null;
  }, [orderParam]);

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
