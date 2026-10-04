import {
  PackageIcon,
  StorefrontIcon,
  WarningOctagonIcon,
  ScalesIcon,
  CubeIcon,
  CurrencyDollarIcon,
} from "@phosphor-icons/react";
import type { OrderQueueKPIs } from "../types";

interface QueueKpiBarProps {
  kpis: OrderQueueKPIs;
}

export function QueueKpiBar({ kpis }: QueueKpiBarProps) {
  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-3 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <PackageIcon className="size-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground text-[11px]">Orders:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">{kpis.totalOrders}</span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <StorefrontIcon className="size-3.5 text-sky-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Outlets:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">{kpis.totalStores}</span>
      </div>

      {kpis.deferredYesterdayOrders > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg shadow-2xs">
          <WarningOctagonIcon className="size-3.5 text-rose-600 shrink-0" weight="bold" />
          <span className="text-rose-700 dark:text-rose-300 text-[11px] font-bold">
            Yesterday Skips:
          </span>
          <span className="font-black text-rose-700 dark:text-rose-300 text-[11px] tabular-nums">
            {kpis.deferredYesterdayOrders}
          </span>
        </div>
      )}

      {kpis.urgentOrders > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg shadow-2xs">
          <span className="text-amber-700 dark:text-amber-300 text-[11px] font-bold">
            Urgent:
          </span>
          <span className="font-black text-amber-700 dark:text-amber-300 text-[11px] tabular-nums">
            {kpis.urgentOrders}
          </span>
        </div>
      )}

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Weight:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {(kpis.totalWeightKg / 1000).toFixed(1)} t
        </span>
        <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
          ({kpis.totalWeightKg.toLocaleString()} kg)
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Volume:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {kpis.totalVolumeCbm} m³
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <CurrencyDollarIcon className="size-3.5 text-amber-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Total Value:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          LKR {kpis.totalValueLkr.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
