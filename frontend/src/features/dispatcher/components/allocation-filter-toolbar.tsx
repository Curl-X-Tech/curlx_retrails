import {
  MagnifyingGlassIcon,
  FunnelIcon,
  TruckIcon,
  SquaresFourIcon,
  ListBulletsIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { AllocationViewMode } from "../types";

interface AllocationFilterToolbarProps {
  searchQuery: string;
  statusFilter: string;
  categoryFilter: string;
  viewMode: AllocationViewMode;
  onSearchChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onViewModeChange: (mode: AllocationViewMode) => void;
}

export function AllocationFilterToolbar({
  searchQuery,
  statusFilter,
  categoryFilter,
  viewMode,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onViewModeChange,
}: AllocationFilterToolbarProps) {
  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search vehicle, route, driver, plate..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 h-7 text-xs bg-card"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="xs" className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card" />}>
            <FunnelIcon className="size-3 text-muted-foreground" />
            <span className="capitalize">Status: {statusFilter === "all" ? "All" : statusFilter}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">Filter Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={statusFilter} onValueChange={(val) => onStatusChange(val ?? "all")}>
              <DropdownMenuRadioItem value="all" className="text-xs">All Statuses</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="allocated" className="text-xs">Allocated</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="loading" className="text-xs">Loading Bay</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dispatched" className="text-xs">Dispatched</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="xs" className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card" />}>
            <TruckIcon className="size-3 text-muted-foreground" />
            <span className="capitalize">Type: {categoryFilter === "all" ? "All Types" : categoryFilter}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuLabel className="text-xs">Vehicle Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={categoryFilter} onValueChange={(val) => onCategoryChange(val ?? "all")}>
              <DropdownMenuRadioItem value="all" className="text-xs">All Types</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="lorry" className="text-xs">Lorries (14ft / 16ft)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="van" className="text-xs">Vans</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center border border-border/70 rounded-lg p-0.5 bg-card">
          <IconButton variant={viewMode === "grid" ? "default" : "ghost"} size="xs" onClick={() => onViewModeChange("grid")} className="size-6 rounded-md cursor-pointer" title="Grid View">
            <SquaresFourIcon className="size-3.5" />
          </IconButton>
          <IconButton variant={viewMode === "table" ? "default" : "ghost"} size="xs" onClick={() => onViewModeChange("table")} className="size-6 rounded-md cursor-pointer" title="Table View">
            <ListBulletsIcon className="size-3.5" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
