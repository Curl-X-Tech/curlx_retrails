import * as React from "react";
import { useOrders, type CustomerOrder } from "@/api/orders";
import { getTodayColomboDate } from "@/lib/business-day";
import { useLogDiscrepancy } from "@/api/deliveries";
import type {
  InboundShipment,
  ReceivingCheckItem,
  ReceivingKPIs,
  StoreViewMode,
} from "../types";

export interface InboundFilterOptions {
  searchQuery?: string;
  statusFilter?: string;
  hubFilter?: string;
}

const INBOUND_STATUS: Record<string, InboundShipment["status"]> = {
  allocated: "loading",
  in_transit: "in_transit",
  delivered: "served",
};

function mapToShipment(order: CustomerOrder): InboundShipment {
  const waypointId = (order as CustomerOrder & { waypoint_id?: string }).waypoint_id;
  return {
    id: order.id,
    waypointId: waypointId ?? order.id,
    orderRef: order.order_ref,
    outletName: order.outlet_name || `Outlet ${order.outlet_id.slice(0, 6)}`,
    outletAddress: order.outlet_address || "",
    district: order.district || "",
    depot: order.depot || "",
    requiredDate: order.required_date ?? order.order_date,
    tempRequirement: order.temp_requirement,
    status: INBOUND_STATUS[order.status],
    isUrgent: order.is_urgent ?? false,
    totalPackages: order.total_packages ?? 0,
    totalWeightKg: order.total_weight_kg,
    totalVolumeM3: order.total_volume_m3,
    totalValueLkr: order.total_price_lkr,
  };
}

export function useStoreReceiving() {
  const { data: rawOrders = [], isLoading, refetch } = useOrders();
  const logDiscrepancy = useLogDiscrepancy();

  const [activeShipment, setActiveShipment] = React.useState<InboundShipment | null>(
    null
  );
  const [currentPage, setCurrentPage] = React.useState(1);
  const [viewMode, setViewMode] = React.useState<StoreViewMode>("table");
  const pageSize = 10;

  const shipments = React.useMemo(() => {
    const today = getTodayColomboDate();
    return rawOrders
      .filter((o) => o.status in INBOUND_STATUS)
      .map(mapToShipment)
      .filter((s) => s.requiredDate === today);
  }, [rawOrders]);

  const kpis: ReceivingKPIs = React.useMemo(
    () => ({
      totalInbound: shipments.length,
      loadingCount: shipments.filter((s) => s.status === "loading").length,
      inTransitCount: shipments.filter((s) => s.status === "in_transit").length,
      receivedCount: shipments.filter((s) => s.status === "served").length,
      coldChainCount: shipments.filter((s) => s.tempRequirement === "chilled").length,
      totalWeightKg: shipments.reduce((sum, s) => sum + s.totalWeightKg, 0),
    }),
    [shipments]
  );

  const getFilteredShipments = React.useCallback(
    ({
      searchQuery = "",
      statusFilter = "all",
      hubFilter = "all",
    }: InboundFilterOptions) =>
      shipments.filter((s) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const hit =
            s.orderRef.toLowerCase().includes(q) ||
            s.outletName.toLowerCase().includes(q) ||
            s.district.toLowerCase().includes(q);
          if (!hit) return false;
        }
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (hubFilter !== "all" && s.depot.toLowerCase() !== hubFilter.toLowerCase()) {
          return false;
        }
        return true;
      }),
    [shipments]
  );

  const reportDiscrepancies = React.useCallback(
    async (shipment: InboundShipment, lines: ReceivingCheckItem[]) => {
      const shortLines = lines.filter((l) => l.receivedQty < l.requestedQty);
      for (const line of shortLines) {
        await logDiscrepancy.mutateAsync({
          waypointId: shipment.waypointId,
          payload: {
            item_id: line.itemId,
            issue_type: line.issueType,
            reported_qty: line.requestedQty - line.receivedQty,
            notes: line.notes,
          },
        });
      }
      setActiveShipment(null);
    },
    [logDiscrepancy]
  );

  return {
    shipments,
    kpis,
    isLoading,
    activeShipment,
    setActiveShipment,
    currentPage,
    setCurrentPage,
    pageSize,
    viewMode,
    setViewMode,
    getFilteredShipments,
    reportDiscrepancies,
    isSubmitting: logDiscrepancy.isPending,
    submitError: logDiscrepancy.error,
    refresh: refetch,
  };
}
