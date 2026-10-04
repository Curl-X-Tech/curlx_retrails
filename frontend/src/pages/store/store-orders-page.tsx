import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import {
  useStoreOrders,
  StoreOrderHeader,
  StoreOrderKpiBar,
  StoreOrderFilterToolbar,
  OrderListTable,
  OrderListCards,
  OrderDetailSheet,
  type StoreOrderRecord,
  type StoreViewMode,
} from "@/features/store";

export function StoreOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";
  const hubFilter = searchParams.get("hub") || "all";
  const dateFilter = searchParams.get("date") || "today";
  const viewMode = (searchParams.get("view") as StoreViewMode) || "table";
  const orderRefParam = searchParams.get("order");

  const {
    orders,
    kpis,
    selectedIds,
    activeDetailOrder,
    setActiveDetailOrder,
    currentPage,
    setCurrentPage,
    pageSize,
    getFilteredOrders,
    cancelOrder,
    reorderOrder,
    exportOrders,
    toggleSelectRow,
    toggleSelectAll,
    isLoading,
  } = useStoreOrders();

  const filteredOrders = React.useMemo(() => {
    return getFilteredOrders({ searchQuery, statusFilter, hubFilter, dateFilter });
  }, [getFilteredOrders, searchQuery, statusFilter, hubFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const allSelected =
    paginatedOrders.length > 0 &&
    paginatedOrders.every((o) => selectedIds.includes(o.id));

  // Sync active order with URL query param if present
  React.useEffect(() => {
    if (orderRefParam && !activeDetailOrder) {
      const match = orders.find(
        (o) => o.orderRef === orderRefParam || o.id === orderRefParam
      );
      if (match) setActiveDetailOrder(match);
    }
  }, [orderRefParam, orders, activeDetailOrder, setActiveDetailOrder]);

  const updateParam = (key: string, val: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (val && val !== "all") next.set(key, val);
    else next.delete(key);
    setSearchParams(next, { replace: true });
    setCurrentPage(1);
  };

  const handleSelectOrder = (order: StoreOrderRecord) => {
    setActiveDetailOrder(order);
    const next = new URLSearchParams(searchParams);
    next.set("order", order.orderRef);
    setSearchParams(next, { replace: true });
  };

  const handleCloseDetail = () => {
    setActiveDetailOrder(null);
    const next = new URLSearchParams(searchParams);
    next.delete("order");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background font-sans">
      <StoreOrderHeader
        onExportOrders={() => exportOrders(filteredOrders)}
        onPrintManifests={() => window.print()}
      />

      <StoreOrderKpiBar kpis={kpis} />

      <StoreOrderFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={(val) => updateParam("q", val || null)}
        dateFilter={dateFilter}
        onDateSelect={(val) => updateParam("date", val)}
        statusFilter={statusFilter}
        onStatusSelect={(val) => updateParam("status", val)}
        hubFilter={hubFilter}
        onHubSelect={(val) => updateParam("hub", val)}
        viewMode={viewMode}
        onViewModeChange={(val) => updateParam("view", val === "table" ? null : val)}
      />

      <div
        className={`flex-1 min-h-0 margin-responsive py-4 sm:py-5 ${
          viewMode === "grid" ? "overflow-y-auto" : "overflow-hidden flex flex-col"
        }`}
      >
        {isLoading ? (
          viewMode === "grid" ? (
            <CardGridSkeleton count={8} />
          ) : (
            <TableSkeleton columns={9} rowCount={6} />
          )
        ) : viewMode === "grid" ? (
          <OrderListCards
            orders={paginatedOrders}
            totalCount={filteredOrders.length}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onSelectOrder={handleSelectOrder}
            onReorder={reorderOrder}
            onCancelOrder={cancelOrder}
          />
        ) : (
          <OrderListTable
            orders={paginatedOrders}
            selectedIds={selectedIds}
            allSelected={allSelected}
            totalCount={filteredOrders.length}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onToggleSelectAll={() => toggleSelectAll(paginatedOrders)}
            onToggleSelectRow={toggleSelectRow}
            onSelectOrder={handleSelectOrder}
            onReorder={reorderOrder}
            onCancelOrder={cancelOrder}
          />
        )}
      </div>

      <OrderDetailSheet
        order={activeDetailOrder}
        onClose={handleCloseDetail}
        onReorder={reorderOrder}
        onCancelOrder={cancelOrder}
      />
    </div>
  );
}
