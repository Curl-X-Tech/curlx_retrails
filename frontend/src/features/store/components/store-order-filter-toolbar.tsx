import {
  MagnifyingGlassIcon,
  ListBulletsIcon,
  SquaresFourIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/ui/icon-button";
import { OrderListFilterDropdowns } from "./order-list-filter-dropdowns";
import type { StoreViewMode } from "../types";

interface StoreOrderFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateSelect: (date: string) => void;
  statusFilter: string;
  onStatusSelect: (status: string) => void;
  hubFilter: string;
  onHubSelect: (hub: string) => void;
  viewMode: StoreViewMode;
  onViewModeChange: (mode: StoreViewMode) => void;
}

export function StoreOrderFilterToolbar({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateSelect,
  statusFilter,
  onStatusSelect,
  hubFilter,
  onHubSelect,
  viewMode,
  onViewModeChange,
}: StoreOrderFilterToolbarProps) {
  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search order ref, outlet, district..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 pr-7 h-7 text-xs bg-card"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <OrderListFilterDropdowns
          dateFilter={dateFilter}
          onDateSelect={onDateSelect}
          statusFilter={statusFilter}
          onStatusSelect={onStatusSelect}
          hubFilter={hubFilter}
          onHubSelect={onHubSelect}
        />

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
