import { useNavigate } from "react-router-dom";
import { FileTextIcon, PlusIcon, PrinterIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface StoreOrderHeaderProps {
  onExportOrders: () => void;
  onPrintManifests?: () => void;
}

export function StoreOrderHeader({
  onExportOrders,
  onPrintManifests,
}: StoreOrderHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
      <div>
        <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
          Store Replenishment Orders
        </h1>
        <p className="text-[11px] text-muted-foreground">
          Daily retail orders, fulfillment tracking & manifest receipts (4:00 PM Colombo
          Cutoff)
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
          <span>Export CSV</span>
        </Button>
        {onPrintManifests && (
          <Button
            variant="outline"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg hidden sm:flex"
            onClick={onPrintManifests}
          >
            <PrinterIcon className="size-3 text-muted-foreground" />
            <span>Print Manifests</span>
          </Button>
        )}
        <Button
          variant="default"
          size="xs"
          className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
          onClick={() => navigate("/store/orders/new")}
        >
          <PlusIcon className="size-3 font-bold" />
          <span>Create New Order</span>
        </Button>
      </div>
    </div>
  );
}
