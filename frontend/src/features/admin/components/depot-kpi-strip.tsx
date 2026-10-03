import {
  WarehouseIcon,
  MapTrifoldIcon,
  StorefrontIcon,
} from "@phosphor-icons/react";

export interface DepotKpiStripProps {
  depotsCount: number;
  districtsCount: number;
  outletsCount: number;
}

export function DepotKpiStrip({
  depotsCount,
  districtsCount,
  outletsCount,
}: DepotKpiStripProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <WarehouseIcon className="size-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground text-[11px]">Active Hubs:</span>
        <span className="font-bold text-foreground text-[11px]">{depotsCount}</span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <MapTrifoldIcon className="size-3.5 text-sky-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Districts Covered:</span>
        <span className="font-bold text-foreground text-[11px]">{districtsCount}</span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <StorefrontIcon className="size-3.5 text-emerald-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Total Stores:</span>
        <span className="font-bold text-foreground text-[11px]">{outletsCount}</span>
      </div>
    </div>
  );
}
