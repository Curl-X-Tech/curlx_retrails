import {
  MagnifyingGlassIcon,
  StorefrontIcon,
  SnowflakeIcon,
  FunnelIcon,
  MapPinIcon,
  ListBulletsIcon,
  SquaresFourIcon,
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
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="xs" className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card" />}>
            <StorefrontIcon className="size-3 text-muted-foreground" />
            <span className="capitalize">Brand: {brandFilter === "all" ? "All Brands" : brandFilter}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">Filter Brand</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={brandFilter} onValueChange={(val) => onBrandChange(val ?? "all")}>
              <DropdownMenuRadioItem value="all" className="text-xs">All Brands</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Fresh" className="text-xs">Waypoint Fresh</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Style" className="text-xs">Waypoint Style</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Tech" className="text-xs">Waypoint Tech</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="xs" className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card" />}>
            <SnowflakeIcon className="size-3 text-muted-foreground" />
            <span className="capitalize">Temp: {tempFilter === "all" ? "All Zones" : tempFilter}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuLabel className="text-xs">Temperature</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={tempFilter} onValueChange={(val) => onTempChange(val ?? "all")}>
              <DropdownMenuRadioItem value="all" className="text-xs">All Zones</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="chilled" className="text-xs">Chilled</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="ambient" className="text-xs">Ambient</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="xs" className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card" />}>
            <FunnelIcon className="size-3 text-muted-foreground" />
            <span className="capitalize">Status: {statusFilter === "all" ? "All Statuses" : statusFilter}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs">Priority & Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={statusFilter} onValueChange={(val) => onStatusChange(val ?? "all")}>
              <DropdownMenuRadioItem value="all" className="text-xs">All Statuses</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="urgent" className="text-xs">Urgent Only</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="deferred" className="text-xs">Deferred Yesterday</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {viewMode === "table" && (
          <Button variant={groupByStore ? "default" : "outline"} size="xs" onClick={onToggleGroupByStore} className="h-7 px-2.5 text-[11px] font-semibold cursor-pointer rounded-lg">
            <MapPinIcon className="size-3 mr-1" />
            Group by Store
          </Button>
        )}

        <div className="flex items-center border border-border/70 rounded-lg p-0.5 bg-card">
          <IconButton variant={viewMode === "table" ? "default" : "ghost"} size="xs" onClick={() => onViewModeChange("table")} className="size-6 rounded-md cursor-pointer" title="Table View">
            <ListBulletsIcon className="size-3.5" />
          </IconButton>
          <IconButton variant={viewMode === "grid" ? "default" : "ghost"} size="xs" onClick={() => onViewModeChange("grid")} className="size-6 rounded-md cursor-pointer" title="Card Grid View">
            <SquaresFourIcon className="size-3.5" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
