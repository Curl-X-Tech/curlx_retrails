import { FileTextIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useOptimizeAllocations } from "@/api/allocations";
import { useDepots } from "@/api/master";
import { formatErrorMessage } from "@/api/errors";

function colomboToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(
    new Date()
  );
}

export function AllocationSummaryHeader() {
  const { data: depots = [] } = useDepots();
  const optimize = useOptimizeAllocations();
  const depot = depots.find((d) => d.code === "PEL") ?? depots[0];
  const summary = optimize.data?.summary;

  return (
    <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
      <div>
        <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
          Allocation Summary
        </h1>
        <p className="text-[11px] text-muted-foreground">
          Peliyagoda Depot | Dispatch Wave 1 (Morning Shift)
        </p>
      </div>
      <div className="flex items-center gap-2">
        {optimize.isError && (
          <span role="alert" className="text-[11px] text-destructive">
            {formatErrorMessage(optimize.error, "Re-optimize failed.")}
          </span>
        )}
        {summary && !optimize.isPending && (
          <span className="text-[11px] text-muted-foreground">
            {summary.allocated_orders_count} allocated, {summary.deferred_orders_count}{" "}
            deferred
          </span>
        )}
        <Button
          variant="outline"
          size="xs"
          className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
          onClick={() => {}}
        >
          <FileTextIcon className="size-3 text-muted-foreground" />
          <span>Export Manifest</span>
        </Button>
        <Button
          variant="default"
          size="xs"
          className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
          disabled={!depot || optimize.isPending}
          onClick={() =>
            depot &&
            optimize.mutate({ operating_date: colomboToday(), depot_id: depot.id })
          }
        >
          <ArrowsClockwiseIcon
            className={`size-3 ${optimize.isPending ? "animate-spin" : ""}`}
          />
          <span>{optimize.isPending ? "Optimizing..." : "Re-optimize"}</span>
        </Button>
      </div>
    </div>
  );
}
