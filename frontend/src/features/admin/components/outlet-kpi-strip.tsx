import { StorefrontIcon, TruckIcon, BuildingIcon } from "@phosphor-icons/react";
import type { MasterOutlet } from "../types";

export interface OutletKpiStripProps {
  outlets?: MasterOutlet[];
}

export function OutletKpiStrip({ outlets = [] }: OutletKpiStripProps) {
  const vanOnlyCount = outlets.filter((o) => o.parking_constraint === "van_only").length;
  const mallBayCount = outlets.filter((o) => o.dock_type === "mall_bay").length;

  return (
    <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <StorefrontIcon className="size-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground text-[11px]">Total Stores:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">{outlets.length}</span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <TruckIcon className="size-3.5 text-amber-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Van-Only Access:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {vanOnlyCount} Outlets
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <BuildingIcon className="size-3.5 text-sky-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Mall Bays:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {mallBayCount} Outlets
        </span>
      </div>
    </div>
  );
}
