import * as React from "react";
import { useNavigate } from "react-router-dom";
import { TruckIcon, WrenchIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import {
  useAllocations,
  AllocationKpiBar,
  AllocationFilterToolbar,
  AllocationTableView,
  AllocationGridView,
  type VehicleAllocation,
} from "@/features/dispatcher";
import { AllocationSummaryHeader } from "@/features/dispatcher/components/allocation-summary-header";
import { BreakdownRescueModal } from "@/features/dispatcher/components/breakdown-rescue-modal";
import { useVehicles } from "@/api/fleet";

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
  const { data: vehicles = [] } = useVehicles();
  const effectiveLoading = isLoading;

  const [isRescueModalOpen, setIsRescueModalOpen] = React.useState(false);

  // Check if any vehicle has reported breakdown
  const breakdownVehicle = React.useMemo(() => {
    const liveBreakdown = vehicles.find((v) => v.status === "breakdown");
    if (liveBreakdown) {
      return {
        id: liveBreakdown.id,
        regNumber: liveBreakdown.reg_number,
        modelName: liveBreakdown.model_name,
        driverName: "Saman Perera",
        reason: "Overheating & Engine Stalling",
        temp: liveBreakdown.temp as "reefer" | "ambient",
        remainingWeightKg: 850,
        remainingVolumeM3: 7.2,
        remainingStops: 4,
      };
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("retrails_driver_breakdown_status");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return {
            id: parsed.vehicleId || "veh-001",
            regNumber: parsed.regNumber || "WP-CAD-4022",
            modelName: "Isuzu NPR Reefer",
            driverName: parsed.driverName || "Saman Perera",
            reason: parsed.reason || "Engine Malfunction",
            temp: (parsed.temp as "reefer" | "ambient") || "reefer",
            remainingWeightKg: parsed.remainingWeightKg || 850,
            remainingVolumeM3: parsed.remainingVolumeM3 || 7.2,
            remainingStops: parsed.remainingStops || 4,
          };
        } catch {
          // Ignored
        }
      }
    }
    return null;
  }, [vehicles]);

  const handleSelect = (alloc: VehicleAllocation) => {
    onSelectAllocation?.(alloc);
    navigate(`/dispatcher/allocations/${alloc.id}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Active Incident Notification Strip */}
      {breakdownVehicle && (
        <div className="bg-muted/40 border-b border-border px-4 py-2 flex items-center justify-between gap-3 shrink-0 text-xs transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <span className="size-2 rounded-full bg-amber-500 shrink-0" />
            <span className="font-semibold text-foreground">
              Vehicle #{breakdownVehicle.regNumber}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground truncate">
              {breakdownVehicle.reason || "Incident reported"} (
              {breakdownVehicle.remainingStops} stops remaining)
            </span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsRescueModalOpen(true)}
            className="h-7 text-xs font-semibold px-2.5 gap-1.5 cursor-pointer shrink-0 border border-border/80 hover:bg-background"
          >
            <WrenchIcon className="size-3.5 text-primary" weight="bold" />
            <span>Resolve Allocation</span>
          </Button>
        </div>
      )}

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

      {breakdownVehicle && (
        <BreakdownRescueModal
          isOpen={isRescueModalOpen}
          onOpenChange={setIsRescueModalOpen}
          breakdownVehicle={breakdownVehicle}
          onRescueComplete={() => {
            setIsRescueModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default AllocationSummaryPage;
