import * as React from "react";
import { getStoreOrders } from "@/data/mock-store-orders";
import type { StoreOrderRecord } from "../types";

export interface StoreOrderFilterOptions {
  searchQuery?: string;
  statusFilter?: string;
  hubFilter?: string;
  dateFilter?: string;
}

export function useStoreOrders(initialFilters?: StoreOrderFilterOptions) {
  const [orders, setOrders] = React.useState<StoreOrderRecord[]>(() => getStoreOrders());
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [activeDetailOrder, setActiveDetailOrder] = React.useState<StoreOrderRecord | null>(null);

  const refreshOrders = React.useCallback(() => {
    setOrders([...getStoreOrders()]);
  }, []);

  const getFilteredOrders = React.useCallback(
    (filters: StoreOrderFilterOptions) => {
      const { searchQuery = "", statusFilter = "all", hubFilter = "all" } = filters;
      return orders.filter((order) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchRef = order.orderRef.toLowerCase().includes(q);
          const matchTrip = order.tripId?.toLowerCase().includes(q) || false;
          const matchOutlet = order.outletName.toLowerCase().includes(q);
          const matchDistrict = order.district.toLowerCase().includes(q);
          if (!matchRef && !matchTrip && !matchOutlet && !matchDistrict) return false;
        }
        if (statusFilter !== "all" && order.status !== statusFilter) {
          return false;
        }
        if (hubFilter !== "all" && order.depot.toLowerCase() !== hubFilter.toLowerCase()) {
          return false;
        }
        return true;
      });
    },
    [orders]
  );

  const toggleSelectRow = React.useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = React.useCallback((filtered: StoreOrderRecord[]) => {
    setSelectedIds((prev) =>
      filtered.length > 0 && filtered.every((o) => prev.includes(o.id))
        ? []
        : filtered.map((o) => o.id)
    );
  }, []);

  return {
    orders,
    selectedIds,
    setSelectedIds,
    activeDetailOrder,
    setActiveDetailOrder,
    refreshOrders,
    getFilteredOrders,
    toggleSelectRow,
    toggleSelectAll,
  };
}
