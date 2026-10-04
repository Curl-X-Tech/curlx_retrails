import {
  MagnifyingGlassIcon,
  ListBulletsIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ManifestStatusTabs } from "./manifest-status-tabs";
import { cn } from "@/lib/utils";
import type {
  ManifestStatusFilter,
  VehicleTypeFilter,
  TempFilter,
  ManifestViewMode,
} from "../types";

interface ManifestToolbarProps {
  statusFilter: ManifestStatusFilter;
  onStatusFilterChange: (status: ManifestStatusFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  vehicleTypeFilter: VehicleTypeFilter;
  onVehicleTypeFilterChange: (type: VehicleTypeFilter) => void;
  tempFilter: TempFilter;
  onTempFilterChange: (temp: TempFilter) => void;
  viewMode: ManifestViewMode;
  onViewModeChange: (mode: ManifestViewMode) => void;
  counts: {
    total: number;
    loading: number;
    ready: number;
    dispatched: number;
    flagged: number;
  };
}

export function ManifestToolbar({
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  vehicleTypeFilter,
  onVehicleTypeFilterChange,
  tempFilter,
  onTempFilterChange,
  viewMode,
  onViewModeChange,
  counts,
}: ManifestToolbarProps) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 shrink-0 bg-card p-2 sm:p-2.5 rounded-2xl border border-border/80 shadow-xs max-w-full overflow-hidden">
      <ManifestStatusTabs
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        counts={counts}
      />

      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap shrink-0">
        <div className="relative flex-1 sm:w-52 min-w-[140px]">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search reg, trip, driver..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="h-8.5 pl-8 rounded-xl text-xs bg-background border-border/80 shadow-2xs"
          />
        </div>

        <select
          value={vehicleTypeFilter}
          onChange={(e) => onVehicleTypeFilterChange(e.target.value as VehicleTypeFilter)}
          className="h-8.5 px-2 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
          aria-label="Filter by vehicle type"
        >
          <option value="all">All Vehicles</option>
          <option value="truck">Trucks</option>
          <option value="van">Vans</option>
        </select>

        <select
          value={tempFilter}
          onChange={(e) => onTempFilterChange(e.target.value as TempFilter)}
          className="h-8.5 px-2 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
          aria-label="Filter by temperature"
        >
          <option value="all">All Cargo</option>
          <option value="reefer">Cold Chain</option>
          <option value="ambient">Ambient</option>
        </select>

        <div className="flex items-center border border-border/80 rounded-xl p-0.5 bg-muted/30 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("table")}
            className={cn(
              "size-7.5 p-0 rounded-lg cursor-pointer",
              viewMode === "table"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Table View"
            aria-label="Table View"
          >
            <ListBulletsIcon className="size-3.5" weight="bold" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className={cn(
              "size-7.5 p-0 rounded-lg cursor-pointer",
              viewMode === "grid"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Card Grid View"
            aria-label="Card Grid View"
          >
            <SquaresFourIcon className="size-3.5" weight="bold" />
          </Button>
        </div>
      </div>
    </div>
  );
}
