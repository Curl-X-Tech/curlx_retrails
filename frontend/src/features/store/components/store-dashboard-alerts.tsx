import { WarningCircleIcon, ClockIcon, SnowflakeIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";

export function StoreDashboardAlerts() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-sm sm:text-base text-foreground flex items-center gap-2">
          <WarningCircleIcon className="size-4 text-amber-500" weight="bold" />
          Live Operations Alerts
        </h3>
        <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
          2 Active
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <Card className="p-4 rounded-xl border border-cyan-500/20 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SnowflakeIcon className="size-4 text-cyan-600" weight="bold" />
              <span className="font-bold text-xs text-foreground">
                Cold Chain Reefer Inbound
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-900 text-cyan-100">
              TRP-0928-COL
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Reefer truck carrying dairy and chilled produce is scheduled to dock at 06:30
            AM. Ensure dock receiving team is standing by.
          </p>
        </Card>

        <Card className="p-4 rounded-xl border border-amber-500/20 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-4 text-amber-600" weight="bold" />
              <span className="font-bold text-xs text-foreground">
                Deferred Order Escalation
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
              ORD-2026-085
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Negombo Bay order deferred yesterday has been auto-escalated to Level 1
            Priority for tomorrow's Wave 1 dispatch.
          </p>
        </Card>
      </div>
    </div>
  );
}
