import { Card } from "@/components/ui/card";
import { CircularProgressRing } from "@/components/shared/circular-progress-ring";

import type { BayWithManifest } from "@/api/loader/types";

interface DashboardChartsProps {
  bays: BayWithManifest[];
}

export function DashboardCharts({ bays }: DashboardChartsProps) {
  const totalAllocatedWeight = bays.reduce((acc, b) => acc + b.progress.payload_kg, 0);
  const totalMaxWeight = bays.reduce((acc, b) => acc + b.progress.max_payload_kg, 0) || 1;
  const weightPct = Math.round((totalAllocatedWeight / totalMaxWeight) * 100);

  const totalAllocatedVolume = bays.reduce((acc, b) => acc + b.progress.volume_m3, 0);
  const totalMaxVolume = bays.reduce((acc, b) => acc + b.progress.max_volume_m3, 0) || 1;
  const volumePct = Math.round((totalAllocatedVolume / totalMaxVolume) * 100);

  const totalCrates = bays.reduce((acc, b) => acc + b.progress.total_crates_count, 0);
  const verifiedCrates = bays.reduce(
    (acc, b) => acc + b.progress.verified_crates_count,
    0
  );
  const packPct = totalCrates > 0 ? Math.round((verifiedCrates / totalCrates) * 100) : 0;

  const reeferBays = bays.filter((b) => b.vehicle.temp === "reefer");
  const ambientBays = bays.filter((b) => b.vehicle.temp !== "reefer");
  const reeferPct =
    bays.length > 0 ? Math.round((reeferBays.length / bays.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {/* 1. Overall Packing Progress Gauge */}
      <Card className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground">
              Dock Packing Rate
            </span>
            <span className="text-lg font-heading font-black text-foreground">
              {verifiedCrates} / {totalCrates} Crates
            </span>
          </div>
          <CircularProgressRing
            value={packPct}
            size={50}
            strokeWidth={5}
            colorClassName="text-primary"
          >
            <span className="text-xs font-heading font-black text-foreground">
              {packPct}%
            </span>
          </CircularProgressRing>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground text-[11px]">
          <span>Progress</span>
          <span className="font-semibold text-foreground">
            {verifiedCrates} of {totalCrates} Crates
          </span>
        </div>
      </Card>

      {/* 2. Weight Capacity Utilization */}
      <Card className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground">
              Payload Weight
            </span>
            <span className="text-lg font-heading font-black text-foreground">
              {totalAllocatedWeight.toLocaleString()} kg
            </span>
          </div>
          <CircularProgressRing
            value={weightPct}
            size={50}
            strokeWidth={5}
            colorClassName={weightPct > 95 ? "text-rose-500" : "text-emerald-500"}
          >
            <span className="text-xs font-heading font-black text-foreground">
              {weightPct}%
            </span>
          </CircularProgressRing>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground text-[11px]">
          <span>Fleet Cap: {totalMaxWeight.toLocaleString()} kg</span>
          <span className="font-bold text-foreground">{weightPct}% Utilized</span>
        </div>
      </Card>

      {/* 3. Volume Capacity Utilization */}
      <Card className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground">
              Cargo Volume (CBM)
            </span>
            <span className="text-lg font-heading font-black text-foreground">
              {totalAllocatedVolume.toFixed(1)} m³
            </span>
          </div>
          <CircularProgressRing
            value={volumePct}
            size={50}
            strokeWidth={5}
            colorClassName="text-sky-500"
          >
            <span className="text-xs font-heading font-black text-foreground">
              {volumePct}%
            </span>
          </CircularProgressRing>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground text-[11px]">
          <span>Max Volume: {totalMaxVolume.toFixed(1)} m³</span>
          <span className="font-bold text-foreground">{volumePct}% Cubed</span>
        </div>
      </Card>

      {/* 4. Temperature Mix & Fleet Types */}
      <Card className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground">
              Cold Chain Fleet Mix
            </span>
            <span className="text-lg font-heading font-black text-foreground">
              {reeferBays.length} Reefer · {ambientBays.length} Dry
            </span>
          </div>
          <CircularProgressRing
            value={reeferPct}
            size={50}
            strokeWidth={5}
            colorClassName="text-sky-500"
          >
            <span className="text-xs font-heading font-black text-foreground">
              {reeferPct}%
            </span>
          </CircularProgressRing>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="size-2 rounded-full bg-sky-500" />
            <span>Reefer ({reeferPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="size-2 rounded-full bg-muted-foreground" />
            <span>Ambient ({100 - reeferPct}%)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
