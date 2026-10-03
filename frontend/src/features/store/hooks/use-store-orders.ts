import * as React from "react";
import { useOrders, type CustomerOrder } from "@/api/orders";
import type { StoreOrderRecord } from "../types";

export interface StoreOrderFilterOptions {
  searchQuery?: string;
  statusFilter?: string;
  hubFilter?: string;
  dateFilter?: string;
}

function mapToStoreOrderRecord(order: CustomerOrder): StoreOrderRecord {
  return {
    id: order.id,
    orderRef: order.order_ref,
    outletId: order.outlet_id,
    outletName: `Waypoint Fresh - ${order.outlet_id}`,
    outletAddress: "Colombo, Sri Lanka",
    district: "Colombo",
    depot: "Peliyagoda",
    orderDate: order.order_date,
    requiredDate: order.required_date ?? order.order_date,
    tempRequirement: order.temp_requirement,
    status: (order.status === "delivered"
      ? "served"
      : order.status) as StoreOrderRecord["status"],
    isUrgent: order.is_urgent ?? false,
    totalItems: 3,
    totalUnits: 25,
    totalWeightKg: order.total_weight_kg,
    totalVolumeM3: order.total_volume_m3,
    totalOrderValueLkr: order.total_price_lkr,
    createdAt: order.created_at,
    items: [],
  };
}

export function useStoreOrders() {
  const { data: rawOrders = [], isLoading, error, refetch } = useOrders();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [activeDetailOrder, setActiveDetailOrder] =
    React.useState<StoreOrderRecord | null>(null);

  const orders: StoreOrderRecord[] = React.useMemo(
    () => rawOrders.map(mapToStoreOrderRecord),
    [rawOrders]
  );

  const refreshOrders = React.useCallback(() => {
    refetch();
  }, [refetch]);

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
        if (
          hubFilter !== "all" &&
          order.depot.toLowerCase() !== hubFilter.toLowerCase()
        ) {
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
    isLoading,
    error,
  };
}
