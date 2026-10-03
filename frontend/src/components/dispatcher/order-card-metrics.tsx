import { ScalesIcon, CubeIcon } from "@phosphor-icons/react";

interface OrderCardMetricsProps {
  totalWeightKg: number;
  totalVolumeM3: number;
  totalOrderValueLkr: number;
}

export function OrderCardMetrics({
  totalWeightKg,
  totalVolumeM3,
  totalOrderValueLkr,
}: OrderCardMetricsProps) {
  return (
    <div className="my-3 py-2.5 px-3 bg-muted/30 border border-border/50 rounded-xl space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
          <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span>Weight</span>
        </div>
        <span className="font-bold text-foreground">
          {totalWeightKg.toLocaleString()} kg
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
          <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
          <span>Volume</span>
        </div>
        <span className="font-bold text-foreground">{totalVolumeM3.toFixed(2)} m³</span>
      </div>

      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/40">
        <span className="text-[11px] text-muted-foreground">Order Valuation</span>
        <span className="font-bold text-foreground">
          LKR {totalOrderValueLkr.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
