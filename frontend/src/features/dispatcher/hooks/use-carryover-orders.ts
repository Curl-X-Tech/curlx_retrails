import * as React from "react";
import { mockCarryoverOrders } from "@/data/mock-deferrals";
import type { CarryoverOrder, CarryoverGroupBy } from "../types";

export interface CarryoverGroup {
  key: string;
  title: string;
  description?: string;
  items: CarryoverOrder[];
  totalWeightKg: number;
  totalVolumeM3: number;
  totalValueLkr: number;
}

export function useCarryoverOrders(
  search: string,
  brand: string,
  groupBy: CarryoverGroupBy,
  page: number,
  pageSize: number = 5
) {
  const filtered = React.useMemo(() => {
    return mockCarryoverOrders.filter((ord) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        ord.orderRef.toLowerCase().includes(q) ||
        ord.outletName.toLowerCase().includes(q) ||
        ord.outletId.toLowerCase().includes(q) ||
        ord.district.toLowerCase().includes(q);
      const matchesBrand = brand === "all" || ord.brand === brand;
      return matchesSearch && matchesBrand;
    });
  }, [search, brand]);

  const grouped = React.useMemo(() => {
    if (groupBy === "none") return null;
    const groups: CarryoverGroup[] = [];

    if (groupBy === "action") {
      const mandatory = filtered.filter((o) => o.deferredYesterday === 1);
      const standard = filtered.filter((o) => o.deferredYesterday === 0);
      if (mandatory.length > 0) {
        groups.push({
          key: "action-mandatory",
          title: "Mandatory Wave 1 Priority Injection",
          description: "Consecutive skip protection SLA: must be dispatched in morning Wave 1",
          items: mandatory,
          totalWeightKg: mandatory.reduce((sum, o) => sum + o.totalWeightKg, 0),
          totalVolumeM3: Number(mandatory.reduce((sum, o) => sum + o.totalVolumeM3, 0).toFixed(1)),
          totalValueLkr: mandatory.reduce((sum, o) => sum + o.totalValueLkr, 0),
        });
      }
      if (standard.length > 0) {
        groups.push({
          key: "action-standard",
          title: "Standard Wave 1 Dispatch & Fleet Release",
          description: "Standard carryover allocation from previous evening shifts",
          items: standard,
          totalWeightKg: standard.reduce((sum, o) => sum + o.totalWeightKg, 0),
          totalVolumeM3: Number(standard.reduce((sum, o) => sum + o.totalVolumeM3, 0).toFixed(1)),
          totalValueLkr: standard.reduce((sum, o) => sum + o.totalValueLkr, 0),
        });
      }
    } else if (groupBy === "reason") {
      const reasonMeta: Record<string, { title: string; description: string }> = {
        van_access_shortage: { title: "Van Access Shortage (Street / Tight Dock)", description: "Outlet dock requires small van chassis; reefer vans were fully saturated" },
        insufficient_reefer_capacity: { title: "Insufficient Reefer Fleet Capacity", description: "Cold-chain requirement exceeded available refrigerated vehicle fleet" },
        time_budget_limit: { title: "Time Budget & Traffic Cutoff Limit", description: "Exceeded maximum delivery window or driver shift hours limit" },
        fuel_quota_exceeded: { title: "Weekly Fuel Quota Threshold", description: "Vehicle weekly fuel allocation limit reached" },
      };
      const map = new Map<string, CarryoverOrder[]>();
      filtered.forEach((ord) => {
        const list = map.get(ord.deferralReason) || [];
        list.push(ord);
        map.set(ord.deferralReason, list);
      });
      map.forEach((items, reasonKey) => {
        const meta = reasonMeta[reasonKey] || { title: reasonKey.replace(/_/g, " "), description: "Orders deferred due to this constraint" };
        groups.push({
          key: `reason-${reasonKey}`,
          title: meta.title,
          description: meta.description,
          items,
          totalWeightKg: items.reduce((sum, o) => sum + o.totalWeightKg, 0),
          totalVolumeM3: Number(items.reduce((sum, o) => sum + o.totalVolumeM3, 0).toFixed(1)),
          totalValueLkr: items.reduce((sum, o) => sum + o.totalValueLkr, 0),
        });
      });
    }
    return groups;
  }, [filtered, groupBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = React.useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  return { filtered, grouped, paginated, totalPages };
}
