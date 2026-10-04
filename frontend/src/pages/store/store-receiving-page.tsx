import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import {
  useStoreReceiving,
  StoreReceivingHeader,
  StoreReceivingKpis,
  StoreReceivingFilterToolbar,
  StoreReceivingTable,
  StoreReceivingCards,
  StoreReceivingSheet,
} from "@/features/store";

export function StoreReceivingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";
  const hubFilter = searchParams.get("hub") || "all";

  const {
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
    isSubmitting,
    submitError,
    refresh,
  } = useStoreReceiving();

  const filtered = React.useMemo(
    () => getFilteredShipments({ searchQuery, statusFilter, hubFilter }),
    [getFilteredShipments, searchQuery, statusFilter, hubFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const updateParam = (key: string, val: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (val && val !== "all") next.set(key, val);
    else next.delete(key);
    setSearchParams(next, { replace: true });
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background font-sans">
      <StoreReceivingHeader onRefresh={() => void refresh()} />
      <StoreReceivingKpis kpis={kpis} />
      <StoreReceivingFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={(val) => updateParam("q", val || null)}
        statusFilter={statusFilter}
        onStatusSelect={(val) => updateParam("status", val)}
        hubFilter={hubFilter}
        onHubSelect={(val) => updateParam("hub", val)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
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
            <TableSkeleton columns={8} rowCount={6} />
          )
        ) : viewMode === "grid" ? (
          <StoreReceivingCards
            shipments={paginated}
            totalCount={filtered.length}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onInspect={setActiveShipment}
          />
        ) : (
          <StoreReceivingTable
            shipments={paginated}
            totalCount={filtered.length}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onInspect={setActiveShipment}
          />
        )}
      </div>

      <StoreReceivingSheet
        shipment={activeShipment}
        onClose={() => setActiveShipment(null)}
        onSubmit={reportDiscrepancies}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  );
}
