import { CalendarIcon, TrendUpIcon, CloudRainIcon } from "@phosphor-icons/react";
import type { CalendarDay } from "../types";

export interface CalendarKpiStripProps {
  operatingDays?: CalendarDay[];
  peakSurge: number | null;
}

export function CalendarKpiStrip({
  operatingDays = [],
  peakSurge,
}: CalendarKpiStripProps) {
  const monsoonDaysCount = operatingDays.filter((d) => d.monsoon).length;

  return (
    <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <CalendarIcon className="size-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground text-[11px]">Operating:</span>
        <span className="font-bold text-foreground text-[11px]">
          Mon - Sat Schedule
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <TrendUpIcon className="size-3.5 text-amber-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Peak Multiplier:</span>
        <span className="font-bold text-foreground text-[11px]">
          {peakSurge ? `${peakSurge.toFixed(2)}x` : "1.00x"}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
        <CloudRainIcon className="size-3.5 text-sky-600 shrink-0" />
        <span className="text-muted-foreground text-[11px]">Monsoon Advisory:</span>
        <span className="font-bold text-foreground text-[11px]">
          {monsoonDaysCount} Days
        </span>
      </div>
    </div>
  );
}
