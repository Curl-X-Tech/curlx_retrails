import * as React from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarDay } from "../types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarGridProps {
  days: CalendarDay[];
  getSurgeMultiplier: (date: string) => number;
  isLoading?: boolean;
  onSelectDay?: (day: CalendarDay) => void;
  onSelectEmpty?: (date: string) => void;
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

export function CalendarGrid({
  days,
  getSurgeMultiplier,
  isLoading,
  onSelectDay,
  onSelectEmpty,
}: CalendarGridProps) {
  const byDate = React.useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const months = React.useMemo(
    () => Array.from(new Set(days.map((d) => monthKey(d.date)))).sort(),
    [days]
  );
  const [index, setIndex] = React.useState(0);
  const safeIndex = Math.min(index, Math.max(0, months.length - 1));
  const current = months[safeIndex];

  const cells = React.useMemo(() => {
    if (!current) return [];
    const [year, month] = current.split("-").map(Number);
    const lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
    const total = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from(
        { length: total },
        (_, i) => `${current}-${String(i + 1).padStart(2, "0")}`
      ),
    ];
  }, [current]);

  const title = current
    ? new Date(`${current}-01T00:00:00Z`).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";

  if (!isLoading && months.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
        No calendar records found.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden flex flex-col shrink-0">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="size-7 cursor-pointer"
            disabled={safeIndex === 0}
            onClick={() => setIndex(safeIndex - 1)}
            aria-label="Previous month"
          >
            <CaretLeftIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-7 cursor-pointer"
            disabled={safeIndex >= months.length - 1}
            onClick={() => setIndex(safeIndex + 1)}
            aria-label="Next month"
          >
            <CaretRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-border/60 bg-muted/30">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) {
            return (
              <div key={`pad-${i}`} className="min-h-20 border-b border-r bg-muted/10" />
            );
          }
          const day = byDate.get(date);
          const surge = day ? getSurgeMultiplier(date) : 1;
          return (
            <div
              key={date}
              role="button"
              tabIndex={0}
              onClick={() => (day ? onSelectDay?.(day) : onSelectEmpty?.(date))}
              onKeyDown={(e) => {
                if (e.key === "Enter") day ? onSelectDay?.(day) : onSelectEmpty?.(date);
              }}
              className={cn(
                "min-h-20 border-b border-r p-1.5 flex flex-col gap-0.5 text-[10px] cursor-pointer hover:bg-muted/40",
                !day && "bg-muted/30 text-muted-foreground/50",
                day?.is_holiday && "bg-amber-500/10"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{Number(date.slice(8))}</span>
                {day?.is_payday && <span className="font-bold text-primary">PAY</span>}
              </div>
              {day?.festival && (
                <span className="font-semibold text-foreground truncate capitalize">
                  {day.festival.replace(/_/g, " ")}
                </span>
              )}
              {day && surge !== 1 && (
                <span className="font-bold text-foreground">x{surge.toFixed(2)}</span>
              )}
              {day?.monsoon && <span className="text-muted-foreground">Monsoon</span>}
              {!day && <span>Closed</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
