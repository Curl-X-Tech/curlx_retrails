import * as React from "react";
import { useSearchParams } from "react-router-dom";
import {
  useStoreOrders,
  OrderListFilterBar,
  OrderListTable,
  OrderListCards,
  OrderListPagination,
  OrderDetailSheet,
  type StoreOrderRecord,
} from "@/features/store";

export function StoreOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";
  const hubFilter = searchParams.get("hub") || "all";
  const dateFilter = searchParams.get("date") || "today";

  const {
    selectedIds,
    activeDetailOrder,
    setActiveDetailOrder,
    refreshOrders,
    getFilteredOrders,
    toggleSelectRow,
    toggleSelectAll,
  } = useStoreOrders();

  const filteredOrders = React.useMemo(() => {
    return getFilteredOrders({ searchQuery, statusFilter, hubFilter, dateFilter });
  }, [getFilteredOrders, searchQuery, statusFilter, hubFilter, dateFilter]);

  const allSelected =
    filteredOrders.length > 0 && filteredOrders.every((o) => selectedIds.includes(o.id));

  const handleSearchChange = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set("q", val);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const handleStatusSelect = (status: string) => {
    const next = new URLSearchParams(searchParams);
    if (status === "all") next.delete("status");
    else next.set("status", status);
    setSearchParams(next, { replace: true });
  };

  const handleHubSelect = (hub: string) => {
    const next = new URLSearchParams(searchParams);
    if (hub === "all") next.delete("hub");
    else next.set("hub", hub);
    setSearchParams(next, { replace: true });
  };

  const handleDateSelect = (date: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("date", date);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background font-sans">
      <OrderListFilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        dateFilter={dateFilter}
        onDateSelect={handleDateSelect}
        statusFilter={statusFilter}
        onStatusSelect={handleStatusSelect}
        hubFilter={hubFilter}
        onHubSelect={handleHubSelect}
        onRefresh={refreshOrders}
      />

      <div className="flex-1 overflow-auto p-4">
        <OrderListTable
          orders={filteredOrders}
          selectedIds={selectedIds}
          allSelected={allSelected}
          onToggleSelectAll={() => toggleSelectAll(filteredOrders)}
          onToggleSelectRow={toggleSelectRow}
          onSelectOrder={(order: StoreOrderRecord) => setActiveDetailOrder(order)}
        />

        <OrderListCards
          orders={filteredOrders}
          onSelectOrder={(order: StoreOrderRecord) => setActiveDetailOrder(order)}
        />
      </div>

      <OrderListPagination totalCount={filteredOrders.length} />

      <OrderDetailSheet
        order={activeDetailOrder}
        onClose={() => setActiveDetailOrder(null)}
      />
    </div>
  );
}
