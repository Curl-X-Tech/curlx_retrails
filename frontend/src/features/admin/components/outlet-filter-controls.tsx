import { FunnelIcon, TruckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { AdminHubFilter, AdminBrandFilter } from "../store";

export interface OutletFilterControlsProps {
  selectedHub: AdminHubFilter;
  onHubChange: (hub: AdminHubFilter) => void;
  selectedBrand: AdminBrandFilter;
  onBrandChange: (brand: AdminBrandFilter) => void;
  dockFilter: string;
  onDockChange: (dock: string) => void;
  constraintFilter: string;
  onConstraintChange: (constraint: string) => void;
}

export function OutletFilterControls({
  selectedHub,
  onHubChange,
  selectedBrand,
  onBrandChange,
  dockFilter,
  onDockChange,
  constraintFilter,
  onConstraintChange,
}: OutletFilterControlsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="xs"
              className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
            />
          }
        >
          <FunnelIcon className="size-3 text-muted-foreground" />
          <span>Hub: {selectedHub === "ALL" ? "All Hubs" : selectedHub}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel className="text-xs">Filter Hub</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={selectedHub}
            onValueChange={(v) => onHubChange((v as AdminHubFilter) || "ALL")}
          >
            <DropdownMenuRadioItem value="ALL" className="text-xs">
              All Hubs
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="PEL" className="text-xs">
              Peliyagoda (PEL)
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="KDY" className="text-xs">
              Kandy (KDY)
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="xs"
              className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
            />
          }
        >
          <FunnelIcon className="size-3 text-muted-foreground" />
          <span>Brand: {selectedBrand === "ALL" ? "All Brands" : selectedBrand}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel className="text-xs">Filter Brand</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={selectedBrand}
            onValueChange={(v) => onBrandChange((v as AdminBrandFilter) || "ALL")}
          >
            <DropdownMenuRadioItem value="ALL" className="text-xs">
              All Brands
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="FRESH" className="text-xs">
              Fresh
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="STYLE" className="text-xs">
              Style
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="TECH" className="text-xs">
              Tech
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="xs"
              className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
            />
          }
        >
          <FunnelIcon className="size-3 text-muted-foreground" />
          <span className="capitalize">
            Dock: {dockFilter === "all" ? "All Docks" : dockFilter.replace("_", " ")}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel className="text-xs">Filter Dock</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={dockFilter} onValueChange={onDockChange}>
            <DropdownMenuRadioItem value="all" className="text-xs">
              All Docks
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="rear_dock" className="text-xs">
              Rear Dock
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="street" className="text-xs">
              Street Unload
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="mall_bay" className="text-xs">
              Mall Bay
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="xs"
              className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
            />
          }
        >
          <TruckIcon className="size-3 text-muted-foreground" />
          <span className="capitalize">
            Access:{" "}
            {constraintFilter === "all"
              ? "All Vehicles"
              : constraintFilter.replace("_", " ")}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel className="text-xs">Access Constraint</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={constraintFilter}
            onValueChange={onConstraintChange}
          >
            <DropdownMenuRadioItem value="all" className="text-xs">
              All Vehicles
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="van_only" className="text-xs">
              Van Only Access
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="none" className="text-xs">
              Standard Access
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
