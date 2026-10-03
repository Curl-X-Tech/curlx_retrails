import { FileTextIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function AllocationSummaryHeader() {
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
          onClick={() => {}}
        >
          <ArrowsClockwiseIcon className="size-3" />
          <span>Re-optimize</span>
        </Button>
      </div>
    </div>
  );
}
