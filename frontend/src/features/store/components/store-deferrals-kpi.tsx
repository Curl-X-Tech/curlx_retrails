import { WarningOctagonIcon, ShieldCheckIcon, TruckIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";

interface StoreDeferralsKpiProps {
  totalPending: number;
}

export function StoreDeferralsKpi({ totalPending }: StoreDeferralsKpiProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">
            Pending Unserved
          </span>
          <WarningOctagonIcon className="size-4 text-amber-500" />
        </div>
        <p className="text-2xl font-bold text-foreground mt-1">{totalPending} Orders</p>
        <span className="text-[11px] text-muted-foreground">
          Queued for next morning wave
        </span>
      </Card>

      <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">
            Consecutive Skip Block
          </span>
          <ShieldCheckIcon className="size-4 text-emerald-500" />
        </div>
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
          100% Guaranteed
        </p>
        <span className="text-[11px] text-muted-foreground">
          Auto-escalated to Level 1 Priority
        </span>
      </Card>

      <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">
            Recovery Fleet
          </span>
          <TruckIcon className="size-4 text-primary" />
        </div>
        <p className="text-2xl font-bold text-primary mt-1">Wave 1 (05:00 AM)</p>
        <span className="text-[11px] text-muted-foreground">
          Dedicated reefer & van allocation
        </span>
      </Card>
    </div>
  );
}
