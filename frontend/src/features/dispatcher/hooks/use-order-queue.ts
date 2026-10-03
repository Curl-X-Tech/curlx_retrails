import * as React from "react";
import { useSearchParams } from "react-router-dom";
import {
  mockQueuedOrders,
  getStoreGroupedOrders,
  computeOrderQueueKPIs,
} from "@/data/mock-orders";
import type {
  QueuedOrder,
  StoreOrderGroup,
  QueueSortKey,
  QueueViewMode,
} from "../types";

export function useOrderQueue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders] = React.useState<QueuedOrder[]>(mockQueuedOrders);

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

  const updateQueryParams = React.useCallback(
    (updates: Record<string, string | number | boolean | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, val]) => {
            if (
              val === null || val === undefined || val === "" || val === "all" ||
              (key === "view" && val === "table") || (key === "group" && val === true) ||
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

  const selectedOrder = React.useMemo(
    () => (orderParam ? orders.find((o) => o.orderRef === orderParam || o.id === orderParam) || null : null),
    [orderParam, orders]
  );

  const filteredOrders = React.useMemo(() => {
    return orders.filter((ord) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || ord.orderRef.toLowerCase().includes(q) ||
        ord.outletName.toLowerCase().includes(q) || ord.outletId.toLowerCase().includes(q) ||
        ord.items.some((i) => i.itemName.toLowerCase().includes(q) || i.packageCode.toLowerCase().includes(q));
      const matchesBrand = brandFilter === "all" || ord.brand === brandFilter;
      const matchesTemp = tempFilter === "all" || ord.tempRequirement === tempFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "urgent" ? ord.isUrgent : ord.deferredYesterday === 1);
      const matchesDock = dockFilter === "all" || ord.dockType === dockFilter;
      return matchesSearch && matchesBrand && matchesTemp && matchesStatus && matchesDock;
    });
  }, [orders, searchQuery, brandFilter, tempFilter, statusFilter, dockFilter]);

  const sortedOrders = React.useMemo(() => {
    if (!sortKey) return filteredOrders;
    return [...filteredOrders].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "orderRef") cmp = a.orderRef.localeCompare(b.orderRef);
      else if (sortKey === "outlet") cmp = a.outletName.localeCompare(b.outletName);
      else if (sortKey === "weight") cmp = a.totalWeightKg - b.totalWeightKg;
      else if (sortKey === "volume") cmp = a.totalVolumeM3 - b.totalVolumeM3;
      else if (sortKey === "value") cmp = a.totalOrderValueLkr - b.totalOrderValueLkr;
      else if (sortKey === "window") cmp = a.deliveryWindow.localeCompare(b.deliveryWindow);
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filteredOrders, sortKey, sortDirection]);

  const storeGroups: StoreOrderGroup[] = React.useMemo(() => getStoreGroupedOrders(filteredOrders), [filteredOrders]);
  const kpis = React.useMemo(() => computeOrderQueueKPIs(filteredOrders), [filteredOrders]);

  const pageSize = viewMode === "grid" ? 8 : groupByStore ? 4 : 10;
  const totalCount = viewMode === "grid" ? sortedOrders.length : groupByStore ? storeGroups.length : sortedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const paginatedGridOrders = React.useMemo(() => sortedOrders.slice((currentPage - 1) * 8, currentPage * 8), [sortedOrders, currentPage]);
  const paginatedStoreGroups = React.useMemo(() => storeGroups.slice((currentPage - 1) * 4, currentPage * 4), [storeGroups, currentPage]);
  const paginatedOrders = React.useMemo(() => sortedOrders.slice((currentPage - 1) * 10, currentPage * 10), [sortedOrders, currentPage]);

  const handleExportOrders = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredOrders, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `order_queue_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return {
    orderParam, searchQuery, viewMode, groupByStore, brandFilter, tempFilter, statusFilter, dockFilter,
    sortKey, sortDirection, currentPage, orders, selectedOrder, filteredOrders, sortedOrders, storeGroups,
    kpis, pageSize, totalPages, paginatedGridOrders, paginatedStoreGroups, paginatedOrders,
    updateQueryParams, handleExportOrders,
  };
}
