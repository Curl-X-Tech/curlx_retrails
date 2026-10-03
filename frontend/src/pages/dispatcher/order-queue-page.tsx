import { useNavigate } from "react-router-dom";
import { FileTextIcon, TruckIcon, PackageIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { OrderDetailSheet } from "@/components/dispatcher/order-detail-sheet";
import { useSimulatedLoading } from "@/lib/simulated-delay";
import {
  useOrderQueue,
  QueueKpiBar,
  QueueFilterToolbar,
  QueueTableView,
  QueueGridView,
} from "@/features/dispatcher";

interface OrderQueuePageProps {
  isLoading?: boolean;
  onNavigateToAllocation?: () => void;
}

export function OrderQueuePage({
  isLoading = false,
  onNavigateToAllocation,
}: OrderQueuePageProps = {}) {
  const navigate = useNavigate();
  const queue = useOrderQueue();

  const isSimulatedLoading = useSimulatedLoading([
    queue.searchQuery, queue.brandFilter, queue.tempFilter, queue.statusFilter,
    queue.dockFilter, queue.groupByStore, queue.viewMode, queue.sortKey,
    queue.sortDirection, queue.currentPage,
  ]);
  const effectiveLoading = isLoading || isSimulatedLoading;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">Order Queue</h1>
          <p className="text-[11px] text-muted-foreground">Peliyagoda Depot • Western Province Delivery Planning (4:00 PM Order Cutoff)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="xs" className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg" onClick={queue.handleExportOrders}>
            <FileTextIcon className="size-3 text-muted-foreground" />
            <span>Export Orders</span>
          </Button>
          <Button variant="default" size="xs" className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg" onClick={() => (onNavigateToAllocation ? onNavigateToAllocation() : navigate("/dispatcher/allocations"))}>
            <TruckIcon className="size-3" />
            <span>Proceed to Allocation</span>
          </Button>
        </div>
      </div>

      <QueueKpiBar kpis={queue.kpis} />
      <QueueFilterToolbar
        searchQuery={queue.searchQuery}
        brandFilter={queue.brandFilter}
        tempFilter={queue.tempFilter}
        statusFilter={queue.statusFilter}
        groupByStore={queue.groupByStore}
        viewMode={queue.viewMode}
        onSearchChange={(search) => queue.updateQueryParams({ search, page: 1 })}
        onBrandChange={(brand) => queue.updateQueryParams({ brand, page: 1 })}
        onTempChange={(temp) => queue.updateQueryParams({ temp, page: 1 })}
        onStatusChange={(status) => queue.updateQueryParams({ status, page: 1 })}
        onToggleGroupByStore={() => queue.updateQueryParams({ group: !queue.groupByStore })}
        onViewModeChange={(view) => queue.updateQueryParams({ view })}
      />

      <div className={`flex-1 min-h-0 margin-responsive py-4 sm:py-5 ${queue.viewMode === "grid" ? "overflow-y-auto" : "overflow-hidden flex flex-col"}`}>
        {effectiveLoading ? (
          queue.viewMode === "grid" ? <CardGridSkeleton count={8} columnsClassName="grid-cols-1 phone:grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4" /> : <TableSkeleton columns={9} rowCount={6} />
        ) : queue.filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PackageIcon className="size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">No queued orders found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">No customer store orders match your current filter and search parameters.</p>
            <Button variant="outline" size="sm" className="mt-4 text-xs" onClick={() => queue.updateQueryParams({ search: null, brand: null, temp: null, status: null, dock: null, page: 1 })}>
              Reset Filters
            </Button>
          </div>
        ) : queue.viewMode === "grid" ? (
          <QueueGridView
            orders={queue.paginatedGridOrders}
            totalCount={queue.sortedOrders.length}
            currentPage={queue.currentPage}
            totalPages={queue.totalPages}
            pageSize={queue.pageSize}
            onPageChange={(page) => queue.updateQueryParams({ page })}
            onSelectOrder={(order) => queue.updateQueryParams({ order: order.orderRef })}
          />
        ) : (
          <QueueTableView
            groupByStore={queue.groupByStore}
            sortedOrders={queue.sortedOrders}
            storeGroups={queue.storeGroups}
            paginatedOrders={queue.paginatedOrders}
            paginatedStoreGroups={queue.paginatedStoreGroups}
            filteredCount={queue.filteredOrders.length}
            sortKey={queue.sortKey}
            sortDirection={queue.sortDirection}
            currentPage={queue.currentPage}
            totalPages={queue.totalPages}
            pageSize={queue.pageSize}
            onSort={(key) => queue.updateQueryParams(queue.sortKey === key ? (queue.sortDirection === "asc" ? { sort: key, dir: "desc" } : { sort: null, dir: null }) : { sort: key, dir: "asc" })}
            onPageChange={(page) => queue.updateQueryParams({ page })}
            onSelectOrder={(order) => queue.updateQueryParams({ order: order.orderRef })}
          />
        )}
      </div>

      <OrderDetailSheet open={Boolean(queue.orderParam)} order={queue.selectedOrder} onOpenChange={(open) => !open && queue.updateQueryParams({ order: null })} />
    </div>
  );
}

export default OrderQueuePage;
