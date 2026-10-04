import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface StoreReceivingHeaderProps {
  onRefresh: () => void;
}

export function StoreReceivingHeader({ onRefresh }: StoreReceivingHeaderProps) {
  return (
    <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
      <div>
        <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
          Inbound Receiving
        </h1>
        <p className="text-[11px] text-muted-foreground">
          Today's deliveries for your outlet, with shortage reporting
        </p>
      </div>
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
  );
}
