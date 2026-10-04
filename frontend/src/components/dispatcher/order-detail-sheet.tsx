import {
  ScalesIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TagIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetClose } from "@/components/ui/sheet";
import type { QueuedOrder } from "@/types";
import { OrderDetailHeader } from "./order-detail-header";
import { OrderDetailItemsTable } from "./order-detail-items-table";
import { OrderAllocatePanel } from "./order-allocate-panel";

interface OrderDetailSheetProps {
  order: QueuedOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function OrderDetailSheet({
  order,
  open,
  onOpenChange,
  className,
}: OrderDetailSheetProps) {
  if (!order) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`w-full data-[side=right]:sm:max-w-2xl data-[side=right]:md:max-w-3xl data-[side=right]:lg:max-w-4xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 flex flex-col h-full bg-card border-l border-border/80 shadow-2xl ${className || ""}`}
      >
        <OrderDetailHeader order={order} />

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-background border border-border/70 rounded-xl">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
                <span>Total Weight</span>
              </div>
              <p className="font-heading font-black text-sm text-foreground mt-1">
                {order.totalWeightKg.toLocaleString()} kg
              </p>
            </div>

            <div className="p-3 bg-background border border-border/70 rounded-xl">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
                <span>Total Volume</span>
              </div>
              <p className="font-heading font-black text-sm text-foreground mt-1">
                {order.totalVolumeM3.toFixed(2)} m³
              </p>
            </div>

            <div className="p-3 bg-background border border-border/70 rounded-xl">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <CurrencyDollarIcon className="size-3.5 text-amber-600 shrink-0" />
                <span>Order Valuation</span>
              </div>
              <p className="font-heading font-black text-sm text-foreground mt-1">
                LKR {order.totalOrderValueLkr.toLocaleString()}
              </p>
            </div>

            <div className="p-3 bg-background border border-border/70 rounded-xl">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <ClockIcon className="size-3.5 text-sky-600 shrink-0" />
                <span>Delivery Window</span>
              </div>
              <p className="font-semibold text-xs text-foreground mt-1 truncate">
                {order.deliveryWindow}
              </p>
            </div>
          </div>

          <div className="p-3 bg-muted/30 border border-border/60 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Dock Type:</span>
              <span className="font-bold text-foreground capitalize">
                {order.dockType.replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <TagIcon className="size-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Parking Constraint:</span>
              <span className="font-bold text-foreground capitalize">
                {order.parkingConstraint.replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Days Since Last Served:</span>
              <span className="font-bold text-foreground">
                {order.daysSinceLastServed} d
              </span>
            </div>
          </div>

          <OrderDetailItemsTable items={order.items} />
        </div>

        <SheetFooter className="p-4 border-t border-border/80 bg-muted/20 shrink-0 flex flex-row items-center justify-between gap-3">
          {order.status === "pending" || order.status === "deferred" ? (
            <OrderAllocatePanel
              key={order.id}
              orderId={order.id}
              onAllocated={() => onOpenChange(false)}
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              Target Date: {order.requiredDate} • Western Province Hub
            </span>
          )}

          <SheetClose
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 text-xs font-semibold cursor-pointer rounded-lg"
              >
                Close
              </Button>
            }
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
