import * as React from "react";
import { Card } from "@/components/ui/card";
import { ChartBarIcon, ScalesIcon, CurrencyDollarIcon } from "@phosphor-icons/react";

interface DailyDataPoint {
  day: string;
  label: string;
  weightKg: number;
  valueLkr: number;
  ordersCount: number;
  isToday?: boolean;
}

const WEEKLY_DATA: DailyDataPoint[] = [
  { day: "Mon", label: "Oct 01", weightKg: 1250, valueLkr: 640000, ordersCount: 4 },
  { day: "Tue", label: "Oct 02", weightKg: 1820, valueLkr: 890000, ordersCount: 6 },
  { day: "Wed", label: "Oct 03", weightKg: 1450, valueLkr: 720000, ordersCount: 5 },
  {
    day: "Thu",
    label: "Oct 04",
    weightKg: 2100,
    valueLkr: 1120000,
    ordersCount: 7,
    isToday: true,
  },
  { day: "Fri", label: "Oct 05", weightKg: 1980, valueLkr: 980000, ordersCount: 6 },
  { day: "Sat", label: "Oct 06", weightKg: 2450, valueLkr: 1350000, ordersCount: 8 },
  { day: "Sun", label: "Oct 07", weightKg: 950, valueLkr: 480000, ordersCount: 3 },
];

export function StoreReplenishmentChart() {
  const [metric, setMetric] = React.useState<"weight" | "value">("weight");
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  const maxVal = React.useMemo(() => {
    return Math.max(
      ...WEEKLY_DATA.map((d) => (metric === "weight" ? d.weightKg : d.valueLkr))
    );
  }, [metric]);

  const totalWeeklyWeight = WEEKLY_DATA.reduce((s, d) => s + d.weightKg, 0);
  const totalWeeklySpend = WEEKLY_DATA.reduce((s, d) => s + d.valueLkr, 0);

  return (
    <Card className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <ChartBarIcon className="size-4 text-primary" weight="bold" />
            <h3 className="font-heading font-bold text-sm text-foreground">
              7-Day Replenishment Velocity
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Weekly intake volume and procurement spend trends
          </p>
        </div>

        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric("weight")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              metric === "weight"
                ? "bg-card text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ScalesIcon className="size-3.5" />
            <span>Volume (kg)</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric("value")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              metric === "value"
                ? "bg-card text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CurrencyDollarIcon className="size-3.5" />
            <span>Spend (LKR)</span>
          </button>
        </div>
      </div>

      {/* Chart Bars Grid */}
      <div className="pt-6 pb-2">
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44">
          {WEEKLY_DATA.map((d, idx) => {
            const rawVal = metric === "weight" ? d.weightKg : d.valueLkr;
            const pct = Math.max(12, Math.round((rawVal / maxVal) * 100));
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={d.day}
                className="flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip on Hover */}
                <div
                  className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded bg-popover text-popover-foreground border border-border/80 shadow-md mb-1 transition-all ${
                    isHovered
                      ? "opacity-100 -translate-y-0.5"
                      : "opacity-0 pointer-events-none"
                  }`}
                >
                  {metric === "weight"
                    ? `${d.weightKg.toLocaleString()} kg`
                    : `LKR ${(d.valueLkr / 1000).toFixed(0)}k`}
                </div>

                {/* The Bar */}
                <div className="w-full max-w-[42px] bg-muted/40 rounded-xl overflow-hidden flex flex-col justify-end p-1 h-32 relative">
                  <div
                    style={{ height: `${pct}%` }}
                    className={`w-full rounded-lg transition-all duration-300 ${
                      d.isToday
                        ? "bg-primary shadow-xs"
                        : isHovered
                          ? "bg-primary/80"
                          : "bg-primary/40 group-hover:bg-primary/60"
                    }`}
                  />
                </div>

                {/* Day Label */}
                <div className="mt-2 text-center">
                  <span
                    className={`text-xs block font-bold ${
                      d.isToday ? "text-primary font-black" : "text-foreground"
                    }`}
                  >
                    {d.day}
                  </span>
                  <span className="text-[10px] text-muted-foreground block tabular-nums">
                    {d.label.slice(4)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] block uppercase font-bold text-muted-foreground">
              7-Day Total Volume
            </span>
            <span className="font-bold text-foreground tabular-nums">
              {(totalWeeklyWeight / 1000).toFixed(2)} tonnes
            </span>
          </div>
          <div>
            <span className="text-[10px] block uppercase font-bold text-muted-foreground">
              7-Day Total Spend
            </span>
            <span className="font-bold text-foreground tabular-nums">
              LKR {(totalWeeklySpend / 1000).toFixed(0)}k
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" />
          <span className="text-[11px] font-semibold text-foreground">
            Today's Intake
          </span>
        </div>
      </div>
    </Card>
  );
}
