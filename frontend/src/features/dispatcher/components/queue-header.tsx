import { useNavigate } from "react-router-dom";
import { FileTextIcon, TruckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface QueueHeaderProps {
  onExportOrders: () => void;
  onNavigateToAllocation?: () => void;
}

export function QueueHeader({
  onExportOrders,
  onNavigateToAllocation,
}: QueueHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
      <div>
        <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
          Order Queue
        </h1>
        <p className="text-[11px] text-muted-foreground">
          Peliyagoda Depot • Western Province Delivery Planning (4:00 PM Order Cutoff)
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="xs"
          className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
          onClick={onExportOrders}
        >
          <FileTextIcon className="size-3 text-muted-foreground" />
          <span>Export Orders</span>
        </Button>
        <Button
          variant="default"
          size="xs"
          className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
          onClick={() =>
            onNavigateToAllocation
              ? onNavigateToAllocation()
              : navigate("/dispatcher/allocations")
          }
        >
          <TruckIcon className="size-3" />
          <span>Proceed to Allocation</span>
        </Button>
      </div>
    </div>
  );
}
