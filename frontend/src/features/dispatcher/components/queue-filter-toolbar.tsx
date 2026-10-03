import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ListBulletsIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { QueueFilterDropdowns } from "./queue-filter-dropdowns";
import type { QueueViewMode } from "../types";

interface QueueFilterToolbarProps {
  searchQuery: string;
  brandFilter: string;
  tempFilter: string;
  statusFilter: string;
  groupByStore: boolean;
  viewMode: QueueViewMode;
  onSearchChange: (val: string) => void;
  onBrandChange: (val: string) => void;
  onTempChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onToggleGroupByStore: () => void;
  onViewModeChange: (mode: QueueViewMode) => void;
}

export function QueueFilterToolbar({
  searchQuery,
  brandFilter,
  tempFilter,
  statusFilter,
  groupByStore,
  viewMode,
  onSearchChange,
  onBrandChange,
  onTempChange,
  onStatusChange,
  onToggleGroupByStore,
  onViewModeChange,
}: QueueFilterToolbarProps) {
  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search order ref, outlet, SKU, package..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 h-7 text-xs bg-card"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <QueueFilterDropdowns
          brandFilter={brandFilter}
          tempFilter={tempFilter}
          statusFilter={statusFilter}
          onBrandChange={onBrandChange}
          onTempChange={onTempChange}
          onStatusChange={onStatusChange}
        />

        {viewMode === "table" && (
          <Button
            variant={groupByStore ? "default" : "outline"}
            size="xs"
            onClick={onToggleGroupByStore}
            className="h-7 px-2.5 text-[11px] font-semibold cursor-pointer rounded-lg"
          >
            <MapPinIcon className="size-3 mr-1" />
            Group by Store
          </Button>
        )}

        <div className="flex items-center border border-border/70 rounded-lg p-0.5 bg-card">
          <IconButton
            variant={viewMode === "table" ? "default" : "ghost"}
            size="xs"
            onClick={() => onViewModeChange("table")}
            className="size-6 rounded-md cursor-pointer"
            title="Table View"
          >
            <ListBulletsIcon className="size-3.5" />
          </IconButton>
          <IconButton
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="xs"
            onClick={() => onViewModeChange("grid")}
            className="size-6 rounded-md cursor-pointer"
            title="Card Grid View"
          >
            <SquaresFourIcon className="size-3.5" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
