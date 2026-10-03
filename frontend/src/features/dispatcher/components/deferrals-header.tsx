import { FileTextIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface DeferralsHeaderProps {
  isAuditLog: boolean;
  onExportJson: () => void;
}

export function DeferralsHeader({ isAuditLog, onExportJson }: DeferralsHeaderProps) {
  return (
    <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
      <div>
        <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
          {isAuditLog ? "Deferral Audit Log" : "Active Carryover & Next-Day Planning"}
        </h1>
        <p className="text-[11px] text-muted-foreground">
          {isAuditLog
            ? "Peliyagoda Depot | Historical Deferral Records & Dispatcher Accountability"
            : "Peliyagoda Depot | Next-Day Pre-Allocation & 2-Day Consecutive Skip Protection"}
        </p>
      </div>
      {isAuditLog && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={onExportJson}
          >
            <FileTextIcon className="size-3 text-muted-foreground" />
            <span>Export Audit Log</span>
          </Button>
        </div>
      )}
    </div>
  );
}
