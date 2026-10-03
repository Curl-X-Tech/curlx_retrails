import { useNavigate } from "react-router-dom";
import { TruckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { useSimulatedLoading } from "@/lib/simulated-delay";
import {
  useAllocations,
  AllocationKpiBar,
  AllocationFilterToolbar,
  AllocationTableView,
  AllocationGridView,
  type VehicleAllocation,
} from "@/features/dispatcher";
import { AllocationSummaryHeader } from "@/features/dispatcher/components/allocation-summary-header";

interface AllocationSummaryPageProps {
  isLoading?: boolean;
  onSelectAllocation?: (allocation: VehicleAllocation) => void;
}

export function AllocationSummaryPage({
  isLoading = false,
  onSelectAllocation,
}: AllocationSummaryPageProps = {}) {
  const navigate = useNavigate();
  const a = useAllocations();

  const isSimulatedLoading = useSimulatedLoading([
    a.searchQuery,
    a.statusFilter,
    a.categoryFilter,
    a.viewMode,
    a.sortKey,
    a.sortDirection,
    a.currentPage,
  ]);
  const effectiveLoading = isLoading || isSimulatedLoading;

  const handleSelect = (alloc: VehicleAllocation) => {
    onSelectAllocation?.(alloc);
    navigate(`/dispatcher/allocations/${alloc.id}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <AllocationSummaryHeader />
      <AllocationKpiBar kpis={a.kpis} />
      <AllocationFilterToolbar
        searchQuery={a.searchQuery}
        statusFilter={a.statusFilter}
        categoryFilter={a.categoryFilter}
        viewMode={a.viewMode}
        onSearchChange={(search) => a.updateQueryParams({ search, page: 1 })}
        onStatusChange={(status) => a.updateQueryParams({ status, page: 1 })}
        onCategoryChange={(category) => a.updateQueryParams({ category, page: 1 })}
        onViewModeChange={(view) => a.updateQueryParams({ view })}
      />

      <div
        className={`flex-1 min-h-0 margin-responsive py-4 sm:py-5 ${a.viewMode === "grid" ? "overflow-y-auto" : "overflow-hidden flex flex-col"}`}
      >
        {effectiveLoading ? (
          a.viewMode === "grid" ? (
            <CardGridSkeleton count={10} />
          ) : (
            <TableSkeleton columns={8} rowCount={5} />
          )
        ) : a.filteredAllocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <TruckIcon className="size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">
              No allocations found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              No vehicle allocations match your current search and filter criteria.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-xs"
              onClick={() =>
                a.updateQueryParams({
                  search: null,
                  status: null,
                  category: null,
                  page: 1,
                })
              }
            >
              Reset Filters
            </Button>
          </div>
        ) : a.viewMode === "grid" ? (
          <AllocationGridView
            allocations={a.sortedAllocations}
            onSelectAllocation={handleSelect}
          />
        ) : (
          <AllocationTableView
            sortedAllocations={a.sortedAllocations}
            paginatedAllocations={a.paginatedAllocations}
            sortKey={a.sortKey}
            sortDirection={a.sortDirection}
            currentPage={a.currentPage}
            totalPages={a.totalPages}
            pageSize={a.pageSize}
            onSort={(key) =>
              a.updateQueryParams(
                a.sortKey === key
                  ? a.sortDirection === "asc"
                    ? { sort: key, dir: "desc" }
                    : { sort: null, dir: null }
                  : { sort: key, dir: "asc" }
              )
            }
            onPageChange={(page) => a.updateQueryParams({ page })}
            onSelectAllocation={handleSelect}
          />
        )}
      </div>
    </div>
  );
}

export default AllocationSummaryPage;
