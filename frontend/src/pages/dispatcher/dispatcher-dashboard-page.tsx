import { useNavigate } from "react-router-dom";
import {
  TruckIcon,
  TrayIcon,
  WarningOctagonIcon,
  ChartBarIcon,
  NavigationArrowIcon,
  CheckCircleIcon,
  ScalesIcon,
  CubeIcon,
  ArrowRightIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import { useVehicles } from "@/api/fleet";
import { useDeferralSummary } from "@/api/deferrals/hooks";
import { useAllocationKpis, useOptimizeAllocations } from "@/api/allocations/hooks";
import { useDepots } from "@/api/master";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircularProgressRing } from "@/components/shared/circular-progress-ring";

function colomboToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(
    new Date()
  );
}

export function DispatcherDashboardPage() {
  const navigate = useNavigate();
  const { data: vehicles = [] } = useVehicles();
  const { data: deferralSummary } = useDeferralSummary();
  const { data: allocKpis } = useAllocationKpis();
  const { data: depots = [] } = useDepots();
  const optimize = useOptimizeAllocations();
  const depot = depots.find((d) => d.code === "PEL") ?? depots[0];

  const totalVehicles = vehicles.length;
  const inTransitCount = vehicles.filter((v) => v.status === "in_transit").length;
  const availableCount = vehicles.filter((v) => v.status === "available").length;
  const workshopCount = vehicles.filter(
    (v) => v.status === "in_workshop" || v.status === "breakdown"
  ).length;

  const fleetActivePct =
    totalVehicles > 0 ? Math.round((inTransitCount / totalVehicles) * 100) : 0;
  const weightUtilPct = Math.round(allocKpis?.avg_weight_utilization_pct ?? 84);
  const volumeUtilPct = Math.round(allocKpis?.avg_volume_utilization_pct ?? 78);

  const quickActions = [
    {
      title: "Allocation Engine",
      desc: "Review & confirm runs",
      icon: ChartBarIcon,
      path: "/dispatcher/allocations",
      color: "text-primary",
    },
    {
      title: "Live Telemetry",
      desc: "GPS & temperatures",
      icon: NavigationArrowIcon,
      path: "/dispatcher/live-map",
      color: "text-sky-500",
    },
    {
      title: "Order Queue",
      desc: "Demand & deferrals",
      icon: TrayIcon,
      path: "/dispatcher/orders",
      color: "text-emerald-500",
    },
    {
      title: "Fleet Vehicles",
      desc: "Units & capacities",
      icon: TruckIcon,
      path: "/dispatcher/fleet/vehicles",
      color: "text-amber-500",
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
            Command Center
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Peliyagoda Central Hub | Real-time fleet oversight and dispatch analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={() => navigate("/dispatcher/live-map")}
          >
            <NavigationArrowIcon className="size-3 text-muted-foreground" />
            <span>Open Live Map</span>
          </Button>
          <Button
            variant="secondary"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
            disabled={!depot || optimize.isPending}
            onClick={() =>
              depot &&
              optimize.mutate({ operating_date: colomboToday(), depot_id: depot.id })
            }
          >
            <ArrowsClockwiseIcon
              className={`size-3 ${optimize.isPending ? "animate-spin" : ""}`}
            />
            <span>{optimize.isPending ? "Auto-Allocating..." : "Auto-Allocate"}</span>
          </Button>
          <Button
            variant="default"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={() => navigate("/dispatcher/allocations")}
          >
            <ChartBarIcon className="size-3" />
            <span>Manage Allocations</span>
          </Button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <TruckIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Fleet Active:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            {inTransitCount}/{totalVehicles}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <CheckCircleIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Available:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            {availableCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <WarningOctagonIcon className="size-3.5 text-amber-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">In Workshop:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            {workshopCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Payload:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            {((allocKpis?.total_weight_kg ?? 0) / 1000).toFixed(1)} t
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Volume:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            {allocKpis?.total_volume_m3 ?? 0} m³
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <WarningOctagonIcon className="size-3.5 text-rose-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Deferrals:</span>
          <span className="font-bold text-rose-600 dark:text-rose-400 text-[11px] tabular-nums">
            {deferralSummary?.total_deferred_orders ?? 0}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 margin-responsive py-4 sm:py-5 overflow-y-auto space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-card border border-border/80 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                Fleet Deployment
              </span>
              <div className="text-2xl font-bold font-heading text-foreground">
                {fleetActivePct}%
              </div>
              <p className="text-xs text-muted-foreground">
                {inTransitCount} vehicles currently dispatched
              </p>
            </div>
            <CircularProgressRing
              value={fleetActivePct}
              size={54}
              strokeWidth={5}
              colorClassName="text-primary"
            />
          </Card>

          <Card className="p-4 bg-card border border-border/80 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                Weight Utilization
              </span>
              <div className="text-2xl font-bold font-heading text-foreground">
                {weightUtilPct}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average truck payload factor
              </p>
            </div>
            <CircularProgressRing
              value={weightUtilPct}
              size={54}
              strokeWidth={5}
              colorClassName="text-emerald-500"
            />
          </Card>

          <Card className="p-4 bg-card border border-border/80 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                Volume Fill Rate
              </span>
              <div className="text-2xl font-bold font-heading text-foreground">
                {volumeUtilPct}%
              </div>
              <p className="text-xs text-muted-foreground">Cubic capacity efficiency</p>
            </div>
            <CircularProgressRing
              value={volumeUtilPct}
              size={54}
              strokeWidth={5}
              colorClassName="text-purple-500"
            />
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4 bg-card border border-border/80 rounded-2xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Operational Workflows</h3>
              <span className="text-xs text-muted-foreground">Direct planning links</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickActions.map((act) => {
                const Icon = act.icon;
                return (
                  <Button
                    key={act.path}
                    variant="outline"
                    onClick={() => navigate(act.path)}
                    className="h-auto p-3 flex items-center justify-between text-left rounded-xl hover:bg-muted/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon weight="duotone" className={`size-5 ${act.color}`} />
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {act.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {act.desc}
                        </div>
                      </div>
                    </div>
                    <ArrowRightIcon className="size-3.5 text-muted-foreground" />
                  </Button>
                );
              })}
            </div>
          </Card>

          <Card className="p-4 bg-card border border-border/80 rounded-2xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Active Units On Route</h3>
              <Button
                variant="ghost"
                size="xs"
                className="h-6 text-[11px] text-primary hover:bg-transparent hover:underline cursor-pointer"
                onClick={() => navigate("/dispatcher/live-map")}
              >
                Live Map &rarr;
              </Button>
            </div>
            <div className="divide-y divide-border/60">
              {vehicles
                .filter((v) => v.status === "in_transit" || v.status === "available")
                .slice(0, 4)
                .map((v) => (
                  <div
                    key={v.id}
                    className="py-2 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-foreground">
                        {v.reg_number}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        ({v.type.toUpperCase()} &bull; {v.temp.toUpperCase()})
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-muted-foreground">{v.weight_cap_kg} kg</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          v.status === "in_transit"
                            ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
