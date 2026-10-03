import { ClockIcon, ScalesIcon, CubeIcon } from "@phosphor-icons/react";
import { DeferralsWave1Card } from "./deferrals-wave1-card";
import type { CarryoverSummaryKPIs } from "../types";

export function DeferralsKpiBar() {
  return (
    <div className="grid grid-cols-1 tablet:grid-cols-3 gutter-responsive mb-4 shrink-0">
      <DeferralsWave1Card
        title="Cold Lorry"
        count={1}
        needed={8}
        totalKg={620}
        value={13}
        imageSrc="/vehicle-images/freeze.png"
        ringColor="text-red-500"
        badgeDotColor="bg-red-500"
        tooltipTitle="Cold Lorry (Top Priority)"
        tooltipDesc="1 reefer lorry locked for Kandy City cold-chain cargo (OUT018). Mandatory Wave 1 consecutive skip protection."
      />
      <DeferralsWave1Card
        title="Freeze Van"
        count={1}
        needed={16}
        totalKg={540}
        value={6}
        imageSrc="/vehicle-images/van.png"
        ringColor="text-red-500"
        badgeDotColor="bg-red-500"
        tooltipTitle="Freeze Van (Top Priority)"
        tooltipDesc="1 reefer van locked for Wattala street dock access (OUT004). Mandatory Wave 1 consecutive skip protection."
      />
      <DeferralsWave1Card
        title="Dry Lorry"
        count={2}
        needed={36}
        totalKg={590}
        value={6}
        imageSrc="/vehicle-images/dry.png"
        ringColor="text-amber-500"
        badgeDotColor="bg-amber-500"
        tooltipTitle="Dry Lorry (Medium Priority)"
        tooltipDesc="2 dry lorries scheduled for Havelock (OUT032) and Negombo (OUT045) ambient cargo routes."
      />
    </div>
  );
}

export function DeferralsKpiHeader({ kpis }: { kpis: CarryoverSummaryKPIs }) {
  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none shrink-0">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <ClockIcon className="size-3.5 text-amber-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Carryover Orders:</span>
        <span className="font-bold text-foreground text-[11px]">
          {kpis.totalCarryoverOrders}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Carryover Weight:</span>
        <span className="font-bold text-foreground text-[11px]">
          {(kpis.totalWeightKg / 1000).toFixed(2)} t
        </span>
        <span className="text-[10px] text-muted-foreground font-medium">
          ({kpis.totalWeightKg.toLocaleString()} kg)
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Carryover Volume:</span>
        <span className="font-bold text-foreground text-[11px]">
          {kpis.totalVolumeM3} m³
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <span className="text-muted-foreground text-[11px]">Value at Risk:</span>
        <span className="font-bold text-foreground text-[11px]">
          LKR {(kpis.totalValueLkr / 1000).toFixed(0)}k
        </span>
      </div>
    </div>
  );
}
