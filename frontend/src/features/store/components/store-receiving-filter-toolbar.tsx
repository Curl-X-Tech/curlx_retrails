import {
  MagnifyingGlassIcon,
  ListBulletsIcon,
  SquaresFourIcon,
  XIcon,
  CaretDownIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StoreViewMode } from "../types";

interface StoreReceivingFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusSelect: (status: string) => void;
  hubFilter: string;
  onHubSelect: (hub: string) => void;
  viewMode: StoreViewMode;
  onViewModeChange: (mode: StoreViewMode) => void;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "loading", label: "Loading" },
  { value: "in_transit", label: "In Transit" },
  { value: "served", label: "Received" },
];

const HUB_OPTIONS = [
  { value: "all", label: "All Depots" },
  { value: "peliyagoda", label: "Peliyagoda Depot" },
  { value: "kandy", label: "Kandy Depot" },
];

const TRIGGER_CLASS =
  "h-9 px-3 text-xs gap-1.5 rounded-lg border-border font-normal text-muted-foreground hover:text-foreground cursor-pointer";

function FilterDropdown({
  prefix,
  value,
  options,
  onSelect,
}: {
  prefix: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  const current = options.find((o) => o.value === value)?.label ?? options[0].label;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className={TRIGGER_CLASS} />}
      >
        <span>{prefix}</span>
        <span className="font-medium text-foreground">{current}</span>
        <CaretDownIcon className="size-3 text-muted-foreground ml-0.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 text-xs">
        {options.map((o) => (
          <DropdownMenuItem key={o.value} onClick={() => onSelect(o.value)}>
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StoreReceivingFilterToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusSelect,
  hubFilter,
  onHubSelect,
  viewMode,
  onViewModeChange,
}: StoreReceivingFilterToolbarProps) {
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
        <FilterDropdown
          prefix="Status:"
          value={statusFilter}
          options={STATUS_OPTIONS}
          onSelect={onStatusSelect}
        />
        <FilterDropdown
          prefix="Hubs:"
          value={hubFilter}
          options={HUB_OPTIONS}
          onSelect={onHubSelect}
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
