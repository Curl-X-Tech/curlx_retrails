import * as React from "react";
import { mockDeferralAuditLogs } from "@/data/mock-deferrals";
import type { DeferralAuditRecord, AuditGroupBy } from "../types";

export interface AuditGroup {
  key: string;
  title: string;
  description?: string;
  items: DeferralAuditRecord[];
  totalWeightKg: number;
  totalVolumeM3: number;
  totalValueLkr: number;
}

export function useDeferralAuditLogs(
  search: string,
  reason: string,
  resource: string,
  groupBy: AuditGroupBy,
  sortKey: string | null,
  sortDirection: "asc" | "desc",
  page: number,
  pageSize: number = 5
) {
  const filtered = React.useMemo(() => {
    let list = mockDeferralAuditLogs.filter((log) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        log.orderRef.toLowerCase().includes(q) ||
        log.outletName.toLowerCase().includes(q) ||
        log.decisionMakerName.toLowerCase().includes(q) ||
        log.notes?.toLowerCase().includes(q);
      const matchesReason = reason === "all" || log.deferralReason === reason;
      const matchesResource = resource === "all" || log.limitingResource === resource;
      return matchesSearch && matchesReason && matchesResource;
    });

    if (sortKey) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortKey === "date") cmp = a.createdAt.localeCompare(b.createdAt);
        else if (sortKey === "orderRef") cmp = a.orderRef.localeCompare(b.orderRef);
        else if (sortKey === "weight") cmp = a.totalWeightKg - b.totalWeightKg;
        else if (sortKey === "value") cmp = a.totalValueLkr - b.totalValueLkr;
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [search, reason, resource, sortKey, sortDirection]);

  const grouped = React.useMemo(() => {
    if (groupBy === "none") return null;
    const groups: AuditGroup[] = [];

    if (groupBy === "action") {
      const priority = filtered.filter((l) => l.deferralReason === "van_access_shortage" || l.deferralReason === "insufficient_reefer_capacity");
      const standard = filtered.filter((l) => l.deferralReason !== "van_access_shortage" && l.deferralReason !== "insufficient_reefer_capacity");
      if (priority.length > 0) {
        groups.push({
          key: "audit-action-priority",
          title: "Action: Priority Solver Injection (Wave 1)",
          description: "Pre-allocated to Wave 1 solver runs with high priority penalty weight",
          items: priority,
          totalWeightKg: priority.reduce((sum, l) => sum + l.totalWeightKg, 0),
          totalVolumeM3: Number(priority.reduce((sum, l) => sum + l.totalVolumeM3, 0).toFixed(1)),
          totalValueLkr: priority.reduce((sum, l) => sum + l.totalValueLkr, 0),
        });
      }
      if (standard.length > 0) {
        groups.push({
          key: "audit-action-standard",
          title: "Action: Next-Day Route Re-Sequencing",
          description: "Re-allocated into standard next-day route dispatch windows",
          items: standard,
          totalWeightKg: standard.reduce((sum, l) => sum + l.totalWeightKg, 0),
          totalVolumeM3: Number(standard.reduce((sum, l) => sum + l.totalVolumeM3, 0).toFixed(1)),
          totalValueLkr: standard.reduce((sum, l) => sum + l.totalValueLkr, 0),
        });
      }
    } else if (groupBy === "reason") {
      const reasonTitleMap: Record<string, string> = {
        insufficient_reefer_capacity: "Insufficient Reefer Fleet Capacity",
        van_access_shortage: "Van Access Shortage (Dock Constraint)",
        time_budget_limit: "Driver Time Budget & Shift Limit",
        fuel_quota_exceeded: "Fleet Fuel Quota Limit",
      };
      const map = new Map<string, DeferralAuditRecord[]>();
      filtered.forEach((log) => {
        const list = map.get(log.deferralReason) || [];
        list.push(log);
        map.set(log.deferralReason, list);
      });
      map.forEach((items, reasonKey) => {
        groups.push({
          key: `audit-reason-${reasonKey}`,
          title: reasonTitleMap[reasonKey] || reasonKey.replace(/_/g, " "),
          items,
          totalWeightKg: items.reduce((sum, l) => sum + l.totalWeightKg, 0),
          totalVolumeM3: Number(items.reduce((sum, l) => sum + l.totalVolumeM3, 0).toFixed(1)),
          totalValueLkr: items.reduce((sum, l) => sum + l.totalValueLkr, 0),
        });
      });
    }
    return groups;
  }, [filtered, groupBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = React.useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  return { filtered, grouped, paginated, totalPages };
}
