import {
  TruckIcon,
  ClockIcon,
  SnowflakeIcon,
  WarningCircleIcon,
  PackageIcon,
} from "@phosphor-icons/react";
import type { ReceivingKPIs } from "../types";

interface StoreReceivingKpisProps {
  kpis: ReceivingKPIs;
}

export function StoreReceivingKpis({ kpis }: StoreReceivingKpisProps) {
  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-3 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <TruckIcon className="size-3.5 text-primary shrink-0" weight="bold" />
        <span className="text-muted-foreground text-[11px]">Inbound Trucks:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {kpis.inboundTrucksCount}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <ClockIcon className="size-3.5 text-sky-600 shrink-0" weight="bold" />
        <span className="text-muted-foreground text-[11px]">Pending Receival:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {kpis.pendingReceivalCount}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <SnowflakeIcon className="size-3.5 text-cyan-600 shrink-0" weight="bold" />
        <span className="text-muted-foreground text-[11px]">Cold Chain Reefer:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {kpis.coldChainRunsCount}
        </span>
      </div>

      {kpis.discrepanciesCount > 0 ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg shadow-2xs">
          <WarningCircleIcon className="size-3.5 text-rose-600 shrink-0" weight="bold" />
          <span className="text-rose-700 dark:text-rose-300 text-[11px] font-bold">
            Discrepancies:
          </span>
          <span className="font-black text-rose-700 dark:text-rose-300 text-[11px] tabular-nums">
            {kpis.discrepanciesCount}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <span className="text-muted-foreground text-[11px]">Discrepancies:</span>
          <span className="font-bold text-emerald-600 text-[11px] tabular-nums">0</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <PackageIcon className="size-3.5 text-amber-600 shrink-0" weight="bold" />
        <span className="text-muted-foreground text-[11px]">Crates Returned:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {kpis.cratesReturnedTotal}
        </span>
      </div>
    </div>
  );
}
