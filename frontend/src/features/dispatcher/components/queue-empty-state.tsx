import { PackageIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface QueueEmptyStateProps {
  onResetFilters: () => void;
}

export function QueueEmptyState({ onResetFilters }: QueueEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <PackageIcon className="size-10 text-muted-foreground/40 mb-3" />
      <h3 className="text-sm font-semibold text-foreground">No queued orders found</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
        No customer store orders match your current filter and search parameters.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4 text-xs"
        onClick={onResetFilters}
      >
        Reset Filters
      </Button>
    </div>
  );
}
