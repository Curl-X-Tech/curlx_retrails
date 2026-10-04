import { Card } from "@/components/ui/card";
import { CircularProgressRing } from "@/components/shared/circular-progress-ring";
import { SnowflakeIcon, SunIcon, CheckCircleIcon } from "@phosphor-icons/react";

interface StoreFulfillmentChartProps {
  totalOrders: number;
  servedCount: number;
  inTransitCount: number;
  loadingCount: number;
  pendingCount: number;
}

export function StoreFulfillmentChart({
  totalOrders,
  servedCount,
  inTransitCount,
  loadingCount,
  pendingCount,
}: StoreFulfillmentChartProps) {
  const fulfillmentRate =
    totalOrders > 0
      ? Math.round(((servedCount + inTransitCount) / totalOrders) * 100)
      : 100;

  const servedPct = totalOrders > 0 ? (servedCount / totalOrders) * 100 : 0;
  const inTransitPct = totalOrders > 0 ? (inTransitCount / totalOrders) * 100 : 0;
  const loadingPct = totalOrders > 0 ? (loadingCount / totalOrders) * 100 : 0;
  const pendingPct = totalOrders > 0 ? (pendingCount / totalOrders) * 100 : 0;

  return (
    <Card className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div>
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
            <CheckCircleIcon className="size-4 text-emerald-600" weight="bold" />
            Fulfillment & Service Rate
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Real-time delivery progress against today's wave schedule
          </p>
        </div>
        <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-md bg-emerald-600 text-white">
          98.4% On-Time
        </span>
      </div>

      <div className="py-4 flex flex-col sm:flex-row items-center gap-6">
        {/* Ring Gauge */}
        <div className="flex items-center gap-3 shrink-0">
          <CircularProgressRing
            value={fulfillmentRate}
            size={76}
            strokeWidth={8}
            colorClassName="text-emerald-500"
          >
            <div className="text-center">
              <span className="font-extrabold text-sm text-foreground block tabular-nums">
                {fulfillmentRate}%
              </span>
            </div>
          </CircularProgressRing>
          <div>
            <span className="text-xs font-bold text-foreground block">
              Active Fulfillment
            </span>
            <span className="text-[11px] text-muted-foreground block tabular-nums">
              {servedCount + inTransitCount} of {totalOrders} runs active
            </span>
          </div>
        </div>

        {/* Cold Chain vs Ambient Gauge */}
        <div className="w-full space-y-3 flex-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <SnowflakeIcon className="size-3 text-cyan-600" weight="bold" />
                Cold Chain (COL)
              </span>
              <span className="font-bold text-foreground tabular-nums">
                42% (Reefer Active)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
              <div className="h-full bg-cyan-600 rounded-full" style={{ width: "42%" }} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <SunIcon className="size-3 text-amber-600" weight="bold" />
                Ambient Dry Cargo
              </span>
              <span className="font-bold text-foreground tabular-nums">
                58% (Standard)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full bg-amber-600 rounded-full"
                style={{ width: "58%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Multi-segment status bar */}
      <div className="space-y-2 pt-3 border-t border-border/60">
        <div className="h-2.5 w-full rounded-full bg-muted/40 overflow-hidden flex">
          {servedPct > 0 && (
            <div
              style={{ width: `${servedPct}%` }}
              className="h-full bg-emerald-500"
              title={`Delivered: ${servedCount}`}
            />
          )}
          {inTransitPct > 0 && (
            <div
              style={{ width: `${inTransitPct}%` }}
              className="h-full bg-sky-500"
              title={`In Transit: ${inTransitCount}`}
            />
          )}
          {loadingPct > 0 && (
            <div
              style={{ width: `${loadingPct}%` }}
              className="h-full bg-amber-500"
              title={`Staging / Loading: ${loadingCount}`}
            />
          )}
          {pendingPct > 0 && (
            <div
              style={{ width: `${pendingPct}%` }}
              className="h-full bg-violet-500"
              title={`Pending: ${pendingCount}`}
            />
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Delivered ({servedCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-sky-500 shrink-0" />
            <span>In Transit ({inTransitCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500 shrink-0" />
            <span>Staging ({loadingCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-violet-500 shrink-0" />
            <span>Pending ({pendingCount})</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
