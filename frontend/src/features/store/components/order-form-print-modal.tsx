import { PrinterIcon, ReceiptIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { StoreOrderItemRow, StoreOutletOption } from "../types";

interface OrderFormPrintModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderRef: string;
  selectedOutlet: StoreOutletOption;
  selectedDate: string;
  rows: StoreOrderItemRow[];
  totalWeightKg: number;
  totalOrderValueLkr: number;
}

export function OrderFormPrintModal({
  isOpen,
  onOpenChange,
  orderRef,
  selectedOutlet,
  selectedDate,
  rows,
  totalWeightKg,
  totalOrderValueLkr,
}: OrderFormPrintModalProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col h-full bg-card"
      >
        <SheetHeader className="p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <ReceiptIcon className="size-5 text-primary" />
            <SheetTitle className="text-lg font-bold text-foreground">
              Draft Manifest Bill of Lading
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Draft #{orderRef} • {selectedOutlet.name}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
            <div className="flex justify-between font-semibold">
              <span>Destination:</span>
              <span>
                {selectedOutlet.name} ({selectedOutlet.code})
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Target Date:</span>
              <span>{selectedDate}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Depot DC:</span>
              <span>{selectedOutlet.depot} Distribution Center</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
              Itemized Summary ({rows.length} items)
            </h4>
            {rows.map((r, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg border border-border flex justify-between"
              >
                <div>
                  <span className="font-semibold block text-foreground">{r.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {r.sku} • {r.quantity} {r.unit}
                  </span>
                </div>
                <span className="font-bold text-foreground">
                  LKR {r.totalPriceLkr.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-foreground">
              <span>Gross Weight:</span>
              <span>{totalWeightKg.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-primary">
              <span>Total Order Value:</span>
              <span>LKR {totalOrderValueLkr.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl bg-primary text-primary-foreground gap-1.5"
          >
            <PrinterIcon className="size-4" />
            Print Now
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
