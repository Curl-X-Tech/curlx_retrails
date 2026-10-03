import {
  TruckIcon,
  PackageIcon,
  ScalesIcon,
  CubeIcon,
  ChartPieIcon,
} from "@phosphor-icons/react";
import type { AllocationSummaryKPIs } from "../types";

interface AllocationKpiBarProps {
  kpis: AllocationSummaryKPIs;
}

export function AllocationKpiBar({ kpis }: AllocationKpiBarProps) {
  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <TruckIcon className="size-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground text-[11px]">Vehicles:</span>
        <span className="font-bold text-foreground text-[11px]">
          {kpis.activeAllocations}/{kpis.totalVehicles}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <PackageIcon className="size-3.5 text-sky-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Crates:</span>
        <span className="font-bold text-foreground text-[11px]">
          {kpis.totalCratesAllocated}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Weight:</span>
        <span className="font-bold text-foreground text-[11px]">
          {(kpis.totalWeightKg / 1000).toFixed(1)} t
        </span>
        <span className="text-[10px] text-muted-foreground font-medium">
          ({kpis.totalWeightKg.toLocaleString()} kg)
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Volume:</span>
        <span className="font-bold text-foreground text-[11px]">
          {kpis.totalVolumeCbm} m³
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <ChartPieIcon className="size-3.5 text-amber-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Avg Load:</span>
        <span className="font-bold text-primary text-[11px]">
          {kpis.averageCapacityPercentage}%
        </span>
      </div>
    </div>
  );
}
