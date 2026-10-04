import {
  PackageIcon,
  TruckIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@phosphor-icons/react";
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
      <Card className="p-4 rounded-xl border border-border/80 bg-card shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold">Total Orders</span>
          <PackageIcon className="size-4 text-primary" weight="bold" />
        </div>
        <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
          {totalOrders}
        </p>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {(totalWeight / 1000).toFixed(2)} t ({totalWeight.toFixed(0)} kg)
        </span>
      </Card>

      <Card className="p-4 rounded-xl border border-border/80 bg-card shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold">Active In Transit</span>
          <TruckIcon className="size-4 text-sky-600" weight="bold" />
        </div>
        <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
          {inTransitCount}
        </p>
        <span className="text-[11px] text-muted-foreground">
          Arriving in morning wave
        </span>
      </Card>

      <Card className="p-4 rounded-xl border border-border/80 bg-card shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold">Staging / Loading</span>
          <ClockIcon className="size-4 text-amber-600" weight="bold" />
        </div>
        <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
          {loadingCount + pendingCount}
        </p>
        <span className="text-[11px] text-muted-foreground">Depot bay allocation</span>
      </Card>

      <Card className="p-4 rounded-xl border border-border/80 bg-card shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-semibold">Total Valuation</span>
          <CurrencyDollarIcon className="size-4 text-emerald-600" weight="bold" />
        </div>
        <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
          LKR {(totalOrderValue / 1000).toFixed(0)}k
        </p>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {servedCount} delivered today
        </span>
      </Card>
    </div>
  );
}
