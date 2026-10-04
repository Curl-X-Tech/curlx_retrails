import {
  PackageIcon,
  ScalesIcon,
  CubeIcon,
  CurrencyDollarIcon,
  WarningOctagonIcon,
  ClockIcon,
} from "@phosphor-icons/react";
import type { StoreOrderKPIs } from "../types";

interface StoreOrderKpiBarProps {
  kpis: StoreOrderKPIs;
}

export function StoreOrderKpiBar({ kpis }: StoreOrderKpiBarProps) {
  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-3 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <PackageIcon className="size-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground text-[11px]">Total Orders:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {kpis.totalOrders}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <ClockIcon className="size-3.5 text-sky-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Pending:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {kpis.pendingCount}
        </span>
      </div>

      {kpis.urgentCount > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 text-white rounded-lg shadow-2xs">
          <span className="text-[11px] font-bold">Urgent:</span>
          <span className="font-black text-[11px] tabular-nums">{kpis.urgentCount}</span>
        </div>
      )}

      {kpis.deferredCount > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-600 text-white rounded-lg shadow-2xs">
          <WarningOctagonIcon className="size-3.5 shrink-0" weight="bold" />
          <span className="text-[11px] font-bold">Deferred:</span>
          <span className="font-black text-[11px] tabular-nums">
            {kpis.deferredCount}
          </span>
        </div>
      )}

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Gross Weight:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {(kpis.totalWeightKg / 1000).toFixed(2)} t
        </span>
        <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
          ({kpis.totalWeightKg.toFixed(1)} kg)
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Volume:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {kpis.totalVolumeM3.toFixed(2)} m³
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <CurrencyDollarIcon className="size-3.5 text-amber-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Order Value:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          LKR {kpis.totalValueLkr.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
