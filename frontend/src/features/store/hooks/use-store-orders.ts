import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  getOrder,
  useOrders,
  useUpdateOrderStatus,
  type CustomerOrder,
} from "@/api/orders";
import { saveDraftRows } from "./order-builder-utils";
import type { StoreOrderItemRow, StoreOrderKPIs, StoreOrderRecord } from "../types";

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
    outletName: order.outlet_name || `Waypoint Fresh - ${order.outlet_id.slice(0, 6)}`,
    outletAddress: order.outlet_address || "Colombo, Sri Lanka",
    district: order.district || "Colombo",
    depot: order.depot || "Peliyagoda",
    orderDate: order.order_date,
    requiredDate: order.required_date ?? order.order_date,
    tempRequirement: order.temp_requirement,
    status: (order.status === "delivered"
      ? "served"
      : order.status) as StoreOrderRecord["status"],
    isUrgent: order.is_urgent ?? false,
    totalItems: order.total_items || 3,
    totalUnits: order.total_packages || 25,
    totalWeightKg: order.total_weight_kg,
    totalVolumeM3: order.total_volume_m3,
    totalOrderValueLkr: order.total_price_lkr,
    createdAt: order.created_at,
    items: [],
  };
}

export function useStoreOrders() {
  const navigate = useNavigate();
  const { data: rawOrders = [], isLoading, error, refetch } = useOrders();
  const updateStatusMutation = useUpdateOrderStatus();

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [activeDetailOrder, setActiveDetailOrder] =
    React.useState<StoreOrderRecord | null>(null);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const pageSize = 10;

  const orders: StoreOrderRecord[] = React.useMemo(
    () => rawOrders.map(mapToStoreOrderRecord),
    [rawOrders]
  );

  const kpis: StoreOrderKPIs = React.useMemo(() => {
    return {
      totalOrders: orders.length,
      totalWeightKg: orders.reduce((sum, o) => sum + o.totalWeightKg, 0),
      totalVolumeM3: orders.reduce((sum, o) => sum + o.totalVolumeM3, 0),
      totalValueLkr: orders.reduce((sum, o) => sum + o.totalOrderValueLkr, 0),
      pendingCount: orders.filter((o) => o.status === "pending").length,
      inTransitCount: orders.filter((o) => o.status === "in_transit").length,
      urgentCount: orders.filter((o) => o.isUrgent).length,
      deferredCount: orders.filter((o) => o.status === "deferred").length,
    };
  }, [orders]);

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

  const cancelOrder = React.useCallback(
    async (order: StoreOrderRecord) => {
      try {
        await updateStatusMutation.mutateAsync({
          id: order.id,
          payload: { status: "cancelled", notes: "Cancelled by store manager" },
        });
        refetch();
      } catch (err) {
        console.error("Failed to cancel order:", err);
      }
    },
    [updateStatusMutation, refetch]
  );

  const reorderOrder = React.useCallback(
    async (order: StoreOrderRecord, customItems?: StoreOrderItemRow[]) => {
      if (customItems && customItems.length > 0) {
        saveDraftRows(customItems);
        navigate("/store/orders/new");
        return;
      }
      try {
        const detail = await getOrder(order.id);
        if (detail && detail.items && detail.items.length > 0) {
          const rows: StoreOrderItemRow[] = detail.items.map((i, idx) => ({
            id: i.id || `reorder-${i.item_id}-${idx}`,
            productId: i.item_id,
            sku: i.package_code || i.item_id.slice(0, 8),
            name: i.item_name || "Item",
            category: i.category || "",
            unit: "units",
            quantity: i.requested_qty || 1,
            unitWeightKg: i.unit_weight_kg || 2.5,
            unitVolumeM3: i.unit_volume_m3 || 0.01,
            unitPriceLkr: i.unit_price || 1500,
            totalWeightKg: (i.unit_weight_kg || 2.5) * (i.requested_qty || 1),
            totalVolumeM3: (i.unit_volume_m3 || 0.01) * (i.requested_qty || 1),
            totalPriceLkr: (i.unit_price || 1500) * (i.requested_qty || 1),
            specialHandlingCode:
              (i.special_handling_code as StoreOrderItemRow["specialHandlingCode"]) ??
              undefined,
          }));
          saveDraftRows(rows);
        }
      } catch {
        if (order.items && order.items.length > 0) {
          saveDraftRows(order.items);
        }
      }
      navigate("/store/orders/new");
    },
    [navigate]
  );

  const exportOrders = React.useCallback((filtered: StoreOrderRecord[]) => {
    const header =
      "Order Ref,Outlet,District,Depot,Order Date,Required Date,Temp,Weight (kg),Volume (m3),Value (LKR),Status\n";
    const rows = filtered
      .map(
        (o) =>
          `"${o.orderRef}","${o.outletName}","${o.district}","${o.depot}","${o.orderDate}","${o.requiredDate}","${o.tempRequirement}",${o.totalWeightKg},${o.totalVolumeM3},${o.totalOrderValueLkr},"${o.status}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `store_orders_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

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
    kpis,
    selectedIds,
    setSelectedIds,
    activeDetailOrder,
    setActiveDetailOrder,
    currentPage,
    setCurrentPage,
    pageSize,
    refreshOrders,
    getFilteredOrders,
    cancelOrder,
    reorderOrder,
    exportOrders,
    toggleSelectRow,
    toggleSelectAll,
    isLoading: isLoading || updateStatusMutation.isPending,
    error,
  };
}
