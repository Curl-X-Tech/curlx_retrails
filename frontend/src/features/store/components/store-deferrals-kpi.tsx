import {
  WarningOctagonIcon,
  ShieldCheckIcon,
  TruckIcon,
  ScalesIcon,
  CurrencyDollarIcon,
} from "@phosphor-icons/react";

interface StoreDeferralsKpiProps {
  totalPending: number;
  totalWeightKg?: number;
  totalValueLkr?: number;
  mustDispatchCount?: number;
}

const CHIP =
  "flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs";
const LABEL = "text-muted-foreground text-[11px]";
const VALUE = "font-bold text-foreground text-[11px] tabular-nums";

export function StoreDeferralsKpi({
  totalPending,
  totalWeightKg = 0,
  totalValueLkr = 0,
  mustDispatchCount = 0,
}: StoreDeferralsKpiProps) {
  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-3 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
      <div className={CHIP}>
        <WarningOctagonIcon className="size-3.5 text-amber-600 shrink-0" weight="bold" />
        <span className={LABEL}>Pending Deferrals:</span>
        <span className={VALUE}>{totalPending}</span>
      </div>

      {mustDispatchCount > 0 && (
        <div className={CHIP}>
          <span className="text-rose-600 font-bold text-[11px]">
            Must Dispatch Tomorrow:
          </span>
          <span className="font-black text-rose-600 text-[11px] tabular-nums">
            {mustDispatchCount}
          </span>
        </div>
      )}

      <div className={CHIP}>
        <ShieldCheckIcon className="size-3.5 text-emerald-600 shrink-0" weight="bold" />
        <span className={LABEL}>Consecutive Skip Block:</span>
        <span className="font-bold text-emerald-600 text-[11px]">100% Guaranteed</span>
      </div>

      <div className={CHIP}>
        <TruckIcon className="size-3.5 text-primary shrink-0" weight="bold" />
        <span className={LABEL}>Recovery Wave:</span>
        <span className={VALUE}>Wave 1 (05:00 AM)</span>
      </div>

      {totalWeightKg > 0 && (
        <div className={CHIP}>
          <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className={LABEL}>Gross Weight:</span>
          <span className={VALUE}>{(totalWeightKg / 1000).toFixed(2)} t</span>
        </div>
      )}

      {totalValueLkr > 0 && (
        <div className={CHIP}>
          <CurrencyDollarIcon className="size-3.5 text-primary shrink-0" />
          <span className={LABEL}>Valuation:</span>
          <span className={VALUE}>LKR {totalValueLkr.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
