import {
  FadersIcon,
  DownloadSimpleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface CargoListHeaderProps {
  manifestCode?: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  groupByStops: boolean;
  onToggleGroupByStops: () => void;
  onSortByWeight: () => void;
  onExport: () => void;
}

export function CargoListHeader({
  manifestCode,
  searchQuery,
  onSearchChange,
  groupByStops,
  onToggleGroupByStops,
  onSortByWeight,
  onExport,
}: CargoListHeaderProps) {
  return (
    <SheetHeader className="p-5 border-b border-border/80 bg-muted/20 shrink-0 space-y-3">
      <SheetTitle className="font-heading font-black text-lg text-foreground tracking-tight">
        {manifestCode || "Cargo Orders"}
      </SheetTitle>

      <div className="flex items-center gap-2 pt-1">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter packages by code, store, destination..."
            className="pl-8 h-8 text-xs bg-background rounded-lg border-border/80"
          />
        </div>

        <Button
          variant={groupByStops ? "default" : "outline"}
          size="sm"
          onClick={onToggleGroupByStops}
          className="h-8 px-2.5 text-xs font-semibold cursor-pointer rounded-lg"
        >
          <MapPinIcon className="size-3.5 mr-1" />
          Group by Stops
        </Button>

        <IconButton
          variant="outline"
          size="xs"
          onClick={onSortByWeight}
          className="size-8 rounded-lg cursor-pointer shrink-0"
          title="Sort by weight"
        >
          <FadersIcon className="size-3.5" />
        </IconButton>

        <IconButton
          variant="outline"
          size="xs"
          onClick={onExport}
          className="size-8 rounded-lg cursor-pointer shrink-0"
          title="Export JSON"
        >
          <DownloadSimpleIcon className="size-3.5" />
        </IconButton>
      </div>
    </SheetHeader>
  );
}
