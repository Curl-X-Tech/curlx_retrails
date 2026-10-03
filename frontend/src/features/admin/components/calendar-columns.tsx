import { CalendarIcon, SunIcon, CloudRainIcon, CoinsIcon } from "@phosphor-icons/react";
import type { DataTableColumn } from "@/components/shared";
import type { CalendarDay } from "../types";

export interface CalendarColumnHelpers {
  getSurgeMultiplier: (date: string) => number;
}

export function getCalendarColumns(
  helpers: CalendarColumnHelpers
): DataTableColumn<CalendarDay>[] {
  return [
    {
      key: "date",
      header: "Operating Date",
      sortable: true,
      className: "w-[160px] pl-4 font-bold text-foreground text-xs whitespace-nowrap",
      render: (day) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-3.5 text-primary shrink-0" />
          <div>
            <div className="font-bold text-xs text-foreground">{day.date}</div>
            <div className="text-[10px] text-muted-foreground font-mono">
              ISO W{day.iso_week}, {day.iso_year}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "dayOfWeek",
      header: "Day of Week",
      sortable: true,
      className: "w-[120px] text-xs font-semibold text-foreground whitespace-nowrap",
      render: (day) => (
        <div>
          <span>{day.dow_name}</span>
          {day.is_weekend && (
            <span className="ml-1.5 text-[10px] font-bold text-amber-500">Weekend</span>
          )}
        </div>
      ),
    },
    {
      key: "operating",
      header: "Dispatch Status",
      sortable: true,
      className: "w-[130px] whitespace-nowrap",
      render: (day) =>
        day.is_operating ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Operating Day
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
            <span className="size-1.5 rounded-full bg-rose-500" />
            Non-Operating
          </span>
        ),
    },
    {
      key: "surge",
      header: "Surge Multiplier",
      sortable: true,
      className: "w-[130px] whitespace-nowrap",
      render: (day) => {
        const mult = helpers.getSurgeMultiplier(day.date);
        return mult > 1.0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded">
            {mult.toFixed(2)}x Demand
          </span>
        ) : (
          <span className="text-xs text-muted-foreground font-mono">
            {mult.toFixed(2)}x
          </span>
        );
      },
    },
    {
      key: "monsoon",
      header: "Weather / Monsoon",
      sortable: true,
      className: "w-[140px] whitespace-nowrap",
      render: (day) =>
        day.monsoon ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
            <CloudRainIcon className="size-3" />
            Monsoon Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <SunIcon className="size-3 text-amber-500/60" />
            Clear Sky
          </span>
        ),
    },
    {
      key: "special",
      header: "Special Calendar Events",
      className: "w-[180px] pr-4 whitespace-nowrap",
      render: (day) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {day.festival && (
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded">
              {day.festival}
            </span>
          )}
          {day.is_payday && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
              <CoinsIcon className="size-2.5" />
              Payday Surge
            </span>
          )}
          {!day.festival && !day.is_payday && (
            <span className="text-[11px] text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
  ];
}
