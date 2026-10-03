import { Button } from "@/components/ui/button";

interface OrderListPaginationProps {
  totalCount: number;
}

export function OrderListPagination({ totalCount }: OrderListPaginationProps) {
  return (
    <div className="border-t border-border bg-card px-4 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <div>
        Showing 1 - {totalCount} of {totalCount} allocation runs
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span>Rows per page:</span>
          <span className="font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
            10
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-7 w-7 p-0 rounded border-border text-muted-foreground cursor-not-allowed"
          >
            &lt;
          </Button>
          <Button
            size="sm"
            className="h-7 w-7 p-0 rounded bg-primary text-primary-foreground font-bold"
          >
            1
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-7 w-7 p-0 rounded border-border text-muted-foreground cursor-not-allowed"
          >
            &gt;
          </Button>
        </div>
      </div>
    </div>
  );
}
