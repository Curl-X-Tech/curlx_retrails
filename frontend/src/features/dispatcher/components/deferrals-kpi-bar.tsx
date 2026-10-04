import { ClockIcon, ScalesIcon, CubeIcon } from "@phosphor-icons/react";
import { DeferralsWave1Card } from "./deferrals-wave1-card";
import type { CarryoverSummaryKPIs, CarryoverOrder } from "../types";

export function DeferralsKpiBar({ orders = [] }: { orders?: CarryoverOrder[] }) {
  const coldLorry = orders.filter(
    (o) => o.tempRequirement === "chilled" && o.parkingConstraint !== "van_only"
  );
  const freezeVan = orders.filter(
    (o) => o.tempRequirement === "chilled" && o.parkingConstraint === "van_only"
  );
  const dryLorry = orders.filter((o) => o.tempRequirement === "ambient");

  const coldKg = Math.round(coldLorry.reduce((sum, o) => sum + o.totalWeightKg, 0));
  const freezeKg = Math.round(freezeVan.reduce((sum, o) => sum + o.totalWeightKg, 0));
  const dryKg = Math.round(dryLorry.reduce((sum, o) => sum + o.totalWeightKg, 0));

  const coldCount = coldKg > 0 ? Math.ceil(coldKg / 2500) : 0;
  const freezeCount = freezeKg > 0 ? Math.ceil(freezeKg / 800) : 0;
  const dryCount = dryKg > 0 ? Math.ceil(dryKg / 3500) : 0;

  const coldValue = Math.min(100, Math.round((coldKg / 5000) * 100));
  const freezeValue = Math.min(100, Math.round((freezeKg / 2000) * 100));
  const dryValue = Math.min(100, Math.round((dryKg / 10000) * 100));

  return (
    <div className="px-4 sm:px-6 py-3.5 grid grid-cols-1 tablet:grid-cols-3 gutter-responsive shrink-0">
      <DeferralsWave1Card
        title="Cold Lorry"
        count={coldCount}
        needed={8}
        totalKg={coldKg}
        value={coldValue}
        imageSrc="/vehicle-images/freeze.png"
        ringColor="text-red-500"
        badgeDotColor={coldCount > 0 ? "bg-red-500" : "bg-muted-foreground/40"}
        tooltipTitle="Cold Lorry (Wave 1 Status)"
        tooltipDesc={
          coldCount > 0
            ? `${coldCount} reefer lorry required for cold-chain carryover cargo. Mandatory Wave 1 skip protection.`
            : "No cold-chain carryover orders currently deferred."
        }
      />
      <DeferralsWave1Card
        title="Freeze Van"
        count={freezeCount}
        needed={16}
        totalKg={freezeKg}
        value={freezeValue}
        imageSrc="/vehicle-images/van.png"
        ringColor="text-red-500"
        badgeDotColor={freezeCount > 0 ? "bg-red-500" : "bg-muted-foreground/40"}
        tooltipTitle="Freeze Van (Wave 1 Status)"
        tooltipDesc={
          freezeCount > 0
            ? `${freezeCount} reefer van required for restricted street dock access. Mandatory Wave 1 skip protection.`
            : "No restricted cold-chain carryover orders currently deferred."
        }
      />
      <DeferralsWave1Card
        title="Dry Lorry"
        count={dryCount}
        needed={36}
        totalKg={dryKg}
        value={dryValue}
        imageSrc="/vehicle-images/dry.png"
        ringColor="text-amber-500"
        badgeDotColor={dryCount > 0 ? "bg-amber-500" : "bg-muted-foreground/40"}
        tooltipTitle="Dry Lorry (Wave 1 Status)"
        tooltipDesc={
          dryCount > 0
            ? `${dryCount} dry lorries required for ambient cargo dispatch corridors.`
            : "No ambient carryover orders currently deferred."
        }
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
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {kpis.totalCarryoverOrders}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Carryover Weight:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {(kpis.totalWeightKg / 1000).toFixed(2)} t
        </span>
        <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
          ({kpis.totalWeightKg.toLocaleString()} kg)
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Carryover Volume:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          {kpis.totalVolumeM3} m³
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <span className="text-muted-foreground text-[11px]">Value at Risk:</span>
        <span className="font-bold text-foreground text-[11px] tabular-nums">
          LKR {(kpis.totalValueLkr / 1000).toFixed(0)}k
        </span>
      </div>
    </div>
  );
}
