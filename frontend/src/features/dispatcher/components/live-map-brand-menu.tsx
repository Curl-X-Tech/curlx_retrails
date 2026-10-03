import { PlantIcon, StorefrontIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { StoreLocation } from "@/types";

interface LiveMapBrandMenuProps {
  stores: StoreLocation[];
  showStores: boolean;
  onToggleShowStores: () => void;
  selectedBrands: ("Fresh" | "Style" | "Tech")[];
  onToggleBrand: (brand: "Fresh" | "Style" | "Tech") => void;
}

export function LiveMapBrandMenu({
  stores,
  showStores,
  onToggleShowStores,
  selectedBrands,
  onToggleBrand,
}: LiveMapBrandMenuProps) {
  return (
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
        <StorefrontIcon weight="bold" className="size-3.5 text-emerald-600" />
        <span>Brands</span>
        <Badge
          variant={showStores ? "secondary" : "outline"}
          className="px-1.5 py-0 h-4 text-[10px] font-bold"
        >
          {showStores ? selectedBrands.length : "Off"}
        </Badge>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-60 p-2">
        <DropdownMenuLabel className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <StorefrontIcon className="size-3.5" /> Retail Outlets
          </span>
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={showStores}
          onCheckedChange={onToggleShowStores}
        >
          <span className="font-semibold">Display Outlets on Map</span>
        </DropdownMenuCheckboxItem>

        {showStores && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] text-muted-foreground py-1">
              Filter by Brand
            </DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={selectedBrands.includes("Fresh")}
              onCheckedChange={() => onToggleBrand("Fresh")}
            >
              <PlantIcon className="size-3.5 text-emerald-600" />
              <span>
                Waypoint Fresh ({stores.filter((s) => s.brand === "Fresh").length})
              </span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={selectedBrands.includes("Style")}
              onCheckedChange={() => onToggleBrand("Style")}
            >
              <span className="size-2 rounded-full bg-purple-500 inline-block" />
              <span>
                Waypoint Style ({stores.filter((s) => s.brand === "Style").length})
              </span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={selectedBrands.includes("Tech")}
              onCheckedChange={() => onToggleBrand("Tech")}
            >
              <StorefrontIcon className="size-3.5 text-sky-600" />
              <span>
                Waypoint Tech ({stores.filter((s) => s.brand === "Tech").length})
              </span>
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
