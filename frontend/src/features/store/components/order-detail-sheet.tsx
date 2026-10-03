import { PrinterIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { OrderStatusBadge } from "./order-status-badge";
import type { StoreOrderRecord } from "../types";

interface OrderDetailSheetProps {
  order: StoreOrderRecord | null;
  onClose: () => void;
}

export function OrderDetailSheet({ order, onClose }: OrderDetailSheetProps) {
  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-card"
      >
        {order && (
          <>
            <SheetHeader className="p-6 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                  Order Details
                </span>
                <OrderStatusBadge status={order.status} />
              </div>
              <SheetTitle className="text-lg font-bold text-foreground mt-1">
                {order.orderRef} ({order.tripId || "No Trip Assigned"})
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {order.outletName} • {order.outletAddress}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-muted/40 p-3 rounded-xl border border-border">
                  <span className="text-[11px] text-muted-foreground block">
                    Order Date
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {order.orderDate}
                  </span>
                </div>
                <div className="bg-muted/40 p-3 rounded-xl border border-border">
                  <span className="text-[11px] text-muted-foreground block">ETA</span>
                  <span className="text-xs font-semibold text-foreground">
                    {order.eta || "Pending"}
                  </span>
                </div>
                <div className="bg-muted/40 p-3 rounded-xl border border-border">
                  <span className="text-[11px] text-muted-foreground block">
                    Gross Weight
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {order.totalWeightKg.toFixed(1)} kg
                  </span>
                </div>
                <div className="bg-muted/40 p-3 rounded-xl border border-border">
                  <span className="text-[11px] text-muted-foreground block">
                    Total LKR
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    LKR {order.totalOrderValueLkr.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Allocated Line Items ({order.items.length})
                </h4>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-border bg-card flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate">
                            {item.name}
                          </span>
                          {item.specialHandlingCode && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4"
                            >
                              {item.specialHandlingCode}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {item.sku} • {item.category}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-foreground block">
                          {item.quantity} {item.unit}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          LKR {item.totalPriceLkr.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 cursor-pointer rounded-xl"
              >
                <PrinterIcon className="size-4" />
                Print Manifest
              </Button>
              <Button size="sm" onClick={onClose} className="rounded-xl cursor-pointer">
                Close
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
