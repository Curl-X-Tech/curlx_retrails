import {
  TruckIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardKPIsProps {
  activeCount: number;
  readyCount: number;
  flaggedCount: number;
  dispatchedCount: number;
  totalCrates: number;
  verifiedCrates: number;
}

export function DashboardKPIs({
  activeCount,
  readyCount,
  flaggedCount,
  dispatchedCount,
  totalCrates,
  verifiedCrates,
}: DashboardKPIsProps) {
  const cratePct = totalCrates > 0 ? Math.round((verifiedCrates / totalCrates) * 100) : 0;

  const kpiItems = [
    {
      label: "Active Bays",
      value: activeCount,
      sub: "Vehicles currently docked",
      icon: TruckIcon,
      colorClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    },
    {
      label: "Ready for Departure",
      value: readyCount,
      sub: "Sealed and verified",
      icon: CheckCircleIcon,
      colorClass:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      label: "Exceptions & Shortfalls",
      value: flaggedCount,
      sub: "Requires bay resolution",
      icon: WarningCircleIcon,
      colorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
    {
      label: "Dispatched Today",
      value: dispatchedCount,
      sub: `${verifiedCrates}/${totalCrates} Crates (${cratePct}%)`,
      icon: PaperPlaneTiltIcon,
      colorClass: "bg-primary/10 text-primary border-primary/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpiItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.label}
            className="p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {item.label}
              </span>
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl border",
                  item.colorClass
                )}
              >
                <Icon className="size-4.5" weight="bold" />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
                {item.value}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {item.sub}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
