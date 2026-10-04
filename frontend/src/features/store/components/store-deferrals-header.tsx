import { ArrowsClockwiseIcon, FileTextIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface StoreDeferralsHeaderProps {
  activeTab: "unserved" | "carryover" | "log";
  onTabChange: (tab: "unserved" | "carryover" | "log") => void;
  onRefresh: () => void;
  onExport?: () => void;
}

export function StoreDeferralsHeader({
  activeTab,
  onTabChange,
  onRefresh,
  onExport,
}: StoreDeferralsHeaderProps) {
  return (
    <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
            Store Order Deferrals & Carryovers
          </h1>
          <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
            • Rule: Max 1 Day Deferral
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Track postponed retail replenishments, capacity bottlenecks, and scheduled
          recovery runs
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/70 text-xs">
          <button
            type="button"
            onClick={() => onTabChange("unserved")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "unserved"
                ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Unserved Queue
          </button>
          <button
            type="button"
            onClick={() => onTabChange("carryover")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "carryover"
                ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Carryover
          </button>
          <button
            type="button"
            onClick={() => onTabChange("log")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "log"
                ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Audit Log
          </button>
        </div>

        {onExport && (
          <Button
            variant="outline"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={onExport}
          >
            <FileTextIcon className="size-3 text-muted-foreground" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="xs"
          className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
          onClick={onRefresh}
        >
          <ArrowsClockwiseIcon className="size-3 text-muted-foreground" />
          <span>Refresh</span>
        </Button>
      </div>
    </div>
  );
}
