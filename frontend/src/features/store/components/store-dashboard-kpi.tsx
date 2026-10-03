import { Card } from "@/components/ui/card";

interface StoreDashboardKpiProps {
  totalOrders: number;
  totalWeight: number;
  inTransitCount: number;
  loadingCount: number;
  pendingCount: number;
  totalOrderValue: number;
  servedCount: number;
}

export function StoreDashboardKpi({
  totalOrders,
  totalWeight,
  inTransitCount,
  loadingCount,
  pendingCount,
  totalOrderValue,
  servedCount,
}: StoreDashboardKpiProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
        <span className="text-[11px] text-muted-foreground font-medium block">
          Total Store Orders
        </span>
        <p className="text-2xl font-bold text-foreground mt-1">{totalOrders}</p>
        <span className="text-[11px] text-muted-foreground">
          {totalWeight.toFixed(1)} kg allocated
        </span>
      </Card>

      <Card className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/5 shadow-xs">
        <span className="text-[11px] text-sky-700 dark:text-sky-300 font-medium block">
          Active In Transit
        </span>
        <p className="text-2xl font-bold text-sky-700 dark:text-sky-300 mt-1">
          {inTransitCount}
        </p>
        <span className="text-[11px] text-muted-foreground">
          Arriving before 08:30 AM
        </span>
      </Card>

      <Card className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-xs">
        <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium block">
          Loading / Pending
        </span>
        <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
          {loadingCount + pendingCount}
        </p>
        <span className="text-[11px] text-muted-foreground">Depot bay staging</span>
      </Card>

      <Card className="p-4 rounded-xl border border-primary/20 bg-primary/5 shadow-xs">
        <span className="text-[11px] text-primary font-semibold block">
          Total Valuation
        </span>
        <p className="text-2xl font-extrabold text-primary mt-1">
          LKR {(totalOrderValue / 1000).toFixed(0)}k
        </p>
        <span className="text-[11px] text-muted-foreground">
          {servedCount} fulfilled today
        </span>
      </Card>
    </div>
  );
}
