import { WarningCircleIcon, ClockIcon, SnowflakeIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StoreDashboardAlerts() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-sm sm:text-base text-foreground flex items-center gap-2">
          <WarningCircleIcon className="size-4 text-amber-500" />
          Store System Alerts
        </h3>
        <Badge variant="outline" className="text-[10px]">
          2 Active Alerts
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SnowflakeIcon className="size-4 text-sky-600 dark:text-sky-400" />
              <span className="font-bold text-xs text-foreground">
                Cold Chain Reefer Run Inbound
              </span>
            </div>
            <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 text-[10px]">
              TRP-0928-COL
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Reefer truck carrying dairy and chilled produce is scheduled to dock at Fort
            Dock at 06:30 AM. Ensure dock receiving team is standing by.
          </p>
        </Card>

        <Card className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-4 text-amber-600 dark:text-amber-400" />
              <span className="font-bold text-xs text-foreground">
                Deferred Order Auto-Escalated
              </span>
            </div>
            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px]">
              ORD-2026-085
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Negombo Bay order was deferred yesterday due to vehicle volume cap. System has
            escalated this run to Level 1 Priority for dispatch tomorrow.
          </p>
        </Card>
      </div>
    </div>
  );
}
