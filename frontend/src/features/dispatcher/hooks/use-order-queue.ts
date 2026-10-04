import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { useOrder, useOrders } from "@/api/orders";
import type { QueuedOrder, QueueSortKey, QueueViewMode, StoreOrderGroup } from "../types";
import {
  computeOrderQueueKPIs,
  filterQueuedOrders,
  getStoreGroupedOrders,
  mapToQueuedOrder,
  sortQueuedOrders,
} from "./order-queue-filter-utils";

export function useOrderQueue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: rawOrders = [], isLoading, error, refetch } = useOrders();

  const orders: QueuedOrder[] = React.useMemo(
    () => rawOrders.map(mapToQueuedOrder),
    [rawOrders]
  );

  const orderParam = searchParams.get("order");
  const searchQuery = searchParams.get("search") || searchParams.get("q") || "";
  const viewMode = (searchParams.get("view") as QueueViewMode) || "table";
  const groupByStore = searchParams.get("group") !== "none";
  const brandFilter = searchParams.get("brand") || "all";
  const tempFilter = searchParams.get("temp") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const dockFilter = searchParams.get("dock") || "all";
  const sortKey = (searchParams.get("sort") as QueueSortKey) || null;
  const sortDirection = (searchParams.get("dir") as "asc" | "desc") || "asc";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data: detailOrder, isError: detailMissing } = useOrder(orderParam ?? "", {
    enabled: Boolean(orderParam),
    retry: false,
  });

  const updateQueryParams = React.useCallback(
    (updates: Record<string, string | number | boolean | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, val]) => {
            if (
              val === null ||
              val === undefined ||
              val === "" ||
              val === "all" ||
              (key === "view" && val === "table") ||
              (key === "group" && val === true) ||
              (key === "page" && Number(val) <= 1)
            ) {
              next.delete(key);
            } else if (key === "group") {
              if (val === false || val === "none") next.set("group", "none");
              else next.delete("group");
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

  React.useEffect(() => {
    if (detailMissing) updateQueryParams({ order: null });
  }, [detailMissing, updateQueryParams]);

  const selectedOrder: QueuedOrder | null = React.useMemo(() => {
    if (!orderParam) return null;
    const found = orders.find((o) => o.orderRef === orderParam || o.id === orderParam);
    if (found && detailOrder) {
      return {
        ...found,
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
    }
    return found || null;
  }, [orderParam, orders, detailOrder]);

  const filteredOrders = React.useMemo(
    () =>
      filterQueuedOrders(
        orders,
        searchQuery,
        brandFilter,
        tempFilter,
        statusFilter,
        dockFilter
      ),
    [orders, searchQuery, brandFilter, tempFilter, statusFilter, dockFilter]
  );

  const sortedOrders = React.useMemo(
    () => sortQueuedOrders(filteredOrders, sortKey, sortDirection),
    [filteredOrders, sortKey, sortDirection]
  );

  const storeGroups: StoreOrderGroup[] = React.useMemo(
    () => getStoreGroupedOrders(filteredOrders),
    [filteredOrders]
  );
  const kpis = React.useMemo(
    () => computeOrderQueueKPIs(filteredOrders),
    [filteredOrders]
  );

  const pageSize = viewMode === "grid" ? 8 : groupByStore ? 4 : 10;
  const totalCount =
    viewMode === "grid"
      ? sortedOrders.length
      : groupByStore
        ? storeGroups.length
        : sortedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const paginatedGridOrders = React.useMemo(
    () => sortedOrders.slice((currentPage - 1) * 8, currentPage * 8),
    [sortedOrders, currentPage]
  );
  const paginatedStoreGroups = React.useMemo(
    () => storeGroups.slice((currentPage - 1) * 4, currentPage * 4),
    [storeGroups, currentPage]
  );
  const paginatedOrders = React.useMemo(
    () => sortedOrders.slice((currentPage - 1) * 10, currentPage * 10),
    [sortedOrders, currentPage]
  );

  const handleExportOrders = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(filteredOrders, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `order_queue_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return {
    orderParam,
    searchQuery,
    viewMode,
    groupByStore,
    brandFilter,
    tempFilter,
    statusFilter,
    dockFilter,
    sortKey,
    sortDirection,
    currentPage,
    orders,
    selectedOrder,
    filteredOrders,
    sortedOrders,
    storeGroups,
    kpis,
    pageSize,
    totalPages,
    paginatedGridOrders,
    paginatedStoreGroups,
    paginatedOrders,
    isLoading,
    error,
    refetch,
    updateQueryParams,
    handleExportOrders,
  };
}
