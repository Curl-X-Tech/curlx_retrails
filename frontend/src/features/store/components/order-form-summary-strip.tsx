import { PackageIcon, ScalesIcon, CubeIcon } from "@phosphor-icons/react";

interface OrderFormSummaryStripProps {
  totalItems: number;
  totalUnits: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalOrderValueLkr: number;
}

export function OrderFormSummaryStrip({
  totalItems,
  totalUnits,
  totalWeightKg,
  totalVolumeM3,
  totalOrderValueLkr,
}: OrderFormSummaryStripProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
        <span className="text-[11px] text-muted-foreground block font-medium flex items-center gap-1">
          <PackageIcon className="size-3.5 text-primary" />
          Total Package Units
        </span>
        <span className="text-base font-bold text-foreground mt-0.5 block">
          {totalItems} items ({totalUnits} units)
        </span>
      </div>

      <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
        <span className="text-[11px] text-muted-foreground block font-medium flex items-center gap-1">
          <ScalesIcon className="size-3.5 text-primary" />
          Gross Weight
        </span>
        <span className="text-base font-bold text-foreground mt-0.5 block">
          {totalWeightKg.toFixed(1)} kg
        </span>
        <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (totalWeightKg / 2500) * 100)}%` }}
          />
        </div>
      </div>

      <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
        <span className="text-[11px] text-muted-foreground block font-medium flex items-center gap-1">
          <CubeIcon className="size-3.5 text-primary" />
          Cargo Volume
        </span>
        <span className="text-base font-bold text-foreground mt-0.5 block">
          {totalVolumeM3.toFixed(2)} m³
        </span>
      </div>

      <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 shadow-xs">
        <span className="text-[11px] text-primary block font-semibold">
          Total Order Valuation
        </span>
        <span className="text-base font-extrabold text-primary mt-0.5 block">
          LKR {totalOrderValueLkr.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
