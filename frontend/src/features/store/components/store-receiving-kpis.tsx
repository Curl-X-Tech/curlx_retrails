import {
  ClockIcon,
  PackageIcon,
  ScalesIcon,
  SnowflakeIcon,
  TruckIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import type { ReceivingKPIs } from "../types";

interface StoreReceivingKpisProps {
  kpis: ReceivingKPIs;
}

const CHIP =
  "flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs";
const LABEL = "text-muted-foreground text-[11px]";
const VALUE = "font-bold text-foreground text-[11px] tabular-nums";

export function StoreReceivingKpis({ kpis }: StoreReceivingKpisProps) {
  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-3 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
      <div className={CHIP}>
        <PackageIcon className="size-3.5 text-primary shrink-0" />
        <span className={LABEL}>Inbound Orders:</span>
        <span className={VALUE}>{kpis.totalInbound}</span>
      </div>
      <div className={CHIP}>
        <ClockIcon className="size-3.5 text-amber-600 shrink-0" />
        <span className={LABEL}>Loading:</span>
        <span className={VALUE}>{kpis.loadingCount}</span>
      </div>
      <div className={CHIP}>
        <TruckIcon className="size-3.5 text-sky-600 shrink-0" />
        <span className={LABEL}>In Transit:</span>
        <span className={VALUE}>{kpis.inTransitCount}</span>
      </div>
      <div className={CHIP}>
        <CheckCircleIcon className="size-3.5 text-emerald-600 shrink-0" />
        <span className={LABEL}>Received:</span>
        <span className={VALUE}>{kpis.receivedCount}</span>
      </div>
      <div className={CHIP}>
        <SnowflakeIcon className="size-3.5 text-sky-600 shrink-0" />
        <span className={LABEL}>Cold Chain:</span>
        <span className={VALUE}>{kpis.coldChainCount}</span>
      </div>
      <div className={CHIP}>
        <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
        <span className={LABEL}>Gross Weight:</span>
        <span className={VALUE}>{(kpis.totalWeightKg / 1000).toFixed(2)} t</span>
      </div>
    </div>
  );
}
