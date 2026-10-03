import { FunnelIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ManifestEmptyStateProps {
  onResetFilters: () => void;
}

export function ManifestEmptyState({ onResetFilters }: ManifestEmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-border/80 bg-card">
      <FunnelIcon className="size-8 text-muted-foreground/50 mb-2" />
      <h3 className="font-heading font-bold text-sm text-foreground">
        No matching manifests in this filter
      </h3>
      <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
        Try switching your tab selection or clearing the search keyword.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onResetFilters}
        className="mt-3 h-8 rounded-xl text-xs font-semibold cursor-pointer"
      >
        <ArrowsClockwiseIcon className="size-3 mr-1.5" />
        Reset Filters
      </Button>
    </Card>
  );
}
