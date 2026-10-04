import { WarningCircleIcon, ClockIcon, SnowflakeIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";

export function StoreDashboardAlerts() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-sm sm:text-base text-foreground flex items-center gap-2">
          <WarningCircleIcon className="size-4 text-amber-500" weight="bold" />
          Store Operations Alerts
        </h3>
        <span className="text-[11px] font-bold font-mono text-muted-foreground">
          2 Active Alerts
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-4 rounded-xl border border-border/80 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SnowflakeIcon className="size-4 text-cyan-600" weight="bold" />
              <span className="font-bold text-xs text-foreground">
                Cold Chain Reefer Run Inbound
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-900 text-cyan-100">
              TRP-0928-COL
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Reefer truck carrying dairy and chilled produce is scheduled to dock at Fort
            Dock at 06:30 AM. Ensure dock receiving team is standing by.
          </p>
        </Card>

        <Card className="p-4 rounded-xl border border-border/80 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-4 text-amber-600" weight="bold" />
              <span className="font-bold text-xs text-foreground">
                Deferred Order Auto-Escalated
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
              ORD-2026-085
            </span>
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
