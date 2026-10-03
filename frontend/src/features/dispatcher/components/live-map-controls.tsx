import * as React from "react";
import {
  MagnifyingGlassIcon,
  CrosshairIcon,
  MapTrifoldIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  type StoreLocation,
  type VehicleTrackingData,
  MAP_THEMES,
} from "@/data/mock-live-map";
import { LiveMapFleetMenu } from "./live-map-fleet-menu";
import { LiveMapBrandMenu } from "./live-map-brand-menu";

interface LiveMapControlsProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  vehicles: VehicleTrackingData[];
  selectedVehicleStatuses: string[];
  onToggleVehicleStatus: (status: string) => void;
  stores: StoreLocation[];
  showStores: boolean;
  onToggleShowStores: () => void;
  selectedBrands: ("Fresh" | "Style" | "Tech")[];
  onToggleBrand: (brand: "Fresh" | "Style" | "Tech") => void;
  selectedThemeId: string;
  onSelectThemeId: (id: string) => void;
  onRecenter: () => void;
}

export function LiveMapControls({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  vehicles,
  selectedVehicleStatuses,
  onToggleVehicleStatus,
  stores,
  showStores,
  onToggleShowStores,
  selectedBrands,
  onToggleBrand,
  selectedThemeId,
  onSelectThemeId,
  onRecenter,
}: LiveMapControlsProps) {
  const selectedTheme = MAP_THEMES.find((t) => t.id === selectedThemeId) || MAP_THEMES[0];

  return (
    <div className="absolute top-3 inset-x-4 z-400 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
      <div className="flex items-center gap-2 pointer-events-auto bg-card/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-border shadow-md">
        <form onSubmit={onSearchSubmit} className="relative w-56">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search vehicle or store..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7.5 h-8 text-xs rounded-xl bg-background"
          />
        </form>

        <Separator orientation="vertical" className="h-4 mx-0.5" />

        <LiveMapFleetMenu
          vehicles={vehicles}
          selectedVehicleStatuses={selectedVehicleStatuses}
          onToggleVehicleStatus={onToggleVehicleStatus}
        />

        <LiveMapBrandMenu
          stores={stores}
          showStores={showStores}
          onToggleShowStores={onToggleShowStores}
          selectedBrands={selectedBrands}
          onToggleBrand={onToggleBrand}
        />
      </div>

      <div className="flex items-center gap-2 pointer-events-auto bg-card/95 backdrop-blur-md p-1.5 rounded-2xl border border-border shadow-md">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 cursor-pointer rounded-xl font-medium"
              />
            }
          >
            <MapTrifoldIcon className="size-3.5" />
            <span>{selectedTheme.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-1.5">
            <DropdownMenuLabel className="text-xs">Map Layer Theme</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={selectedThemeId}
              onValueChange={onSelectThemeId}
            >
              {MAP_THEMES.map((t) => (
                <DropdownMenuRadioItem key={t.id} value={t.id}>
                  {t.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <IconButton
          variant="outline"
          size="default"
          onClick={onRecenter}
          className="size-8 cursor-pointer rounded-xl"
          title="Recenter Map"
        >
          <CrosshairIcon className="size-3.5" />
        </IconButton>
      </div>
    </div>
  );
}
