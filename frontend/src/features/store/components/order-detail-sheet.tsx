import * as React from "react";
import { ArrowCounterClockwiseIcon, PrinterIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useOrder, useUpdateOrderStatus } from "@/api/orders";
import { printInvoice } from "../print-invoice";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderDetailItemsTable } from "./order-detail-items-table";
import { OrderCancelDialog } from "./order-cancel-dialog";
import type { StoreOrderItemRow, StoreOrderRecord } from "../types";

interface OrderDetailSheetProps {
  order: StoreOrderRecord | null;
  onClose: () => void;
  onReorder?: (order: StoreOrderRecord, items?: StoreOrderItemRow[]) => void;
  onCancelOrder?: (order: StoreOrderRecord) => void;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function OrderDetailSheet({
  order,
  onClose,
  onReorder,
  onCancelOrder,
}: OrderDetailSheetProps) {
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const { data: detail, isLoading } = useOrder(order?.id ?? "", {
    enabled: !!order && UUID_PATTERN.test(order.id),
  });
  const updateStatusMutation = useUpdateOrderStatus();

  const items: StoreOrderItemRow[] = React.useMemo(() => {
    if (detail && detail.items && detail.items.length > 0) {
      return detail.items.map((i, idx) => ({
        id: i.id ?? `${i.item_id}-${idx}`,
        productId: i.item_id,
        sku: i.package_code ?? i.item_id.slice(0, 8),
        name: i.item_name ?? "Item",
        category: i.category ?? "",
        unit: "units",
        quantity: i.requested_qty,
        unitWeightKg: i.unit_weight_kg,
        unitVolumeM3: i.unit_volume_m3,
        unitPriceLkr: i.unit_price,
        totalWeightKg: i.unit_weight_kg * i.requested_qty,
        totalVolumeM3: i.unit_volume_m3 * i.requested_qty,
        totalPriceLkr: i.unit_price * i.requested_qty,
        specialHandlingCode:
          (i.special_handling_code as StoreOrderItemRow["specialHandlingCode"]) ??
          undefined,
      }));
    }
    return order?.items ?? [];
  }, [detail, order]);

  const handlePrint = () => {
    if (!order) return;
    printInvoice({
      orderRef: order.orderRef,
      outlet: {
        name: detail?.outlet_name ?? order.outletName,
        code: order.outletId,
        district: detail?.district ?? order.district,
        depot: detail?.depot ?? order.depot,
      },
      deliveryDate: order.requiredDate,
      rows: items,
      totalWeightKg: order.totalWeightKg,
      totalOrderValueLkr: order.totalOrderValueLkr,
    });
  };

  const currentStatus = (detail?.status || order?.status || "").toLowerCase();
  const isPending = currentStatus === "pending";
  const isCancelled = currentStatus === "cancelled";

  const handleConfirmCancel = async () => {
    if (!order) return;
    if (onCancelOrder) {
      onCancelOrder(order);
    } else {
      await updateStatusMutation.mutateAsync({
        id: order.id,
        payload: { status: "cancelled", notes: "Cancelled by store manager" },
      });
    }
    setShowCancelDialog(false);
    onClose();
  };

  return (
    <>
      <Sheet
        open={!!order}
        onOpenChange={(open) => {
          if (!open) {
            setShowCancelDialog(false);
            onClose();
          }
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="data-[side=right]:w-full data-[side=right]:sm:w-[70vw] data-[side=right]:sm:max-w-none p-0 flex flex-col h-full bg-card"
        >
          {order && (
            <>
              <SheetHeader className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                    Store Order Details
                  </span>
                  {order.isUrgent && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] uppercase font-bold"
                    >
                      Urgent Priority
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <SheetTitle className="text-lg font-bold text-foreground">
                    {order.orderRef}
                  </SheetTitle>
                  <OrderStatusBadge status={order.status} />
                </div>
                <SheetDescription className="text-xs text-muted-foreground">
                  {detail?.outlet_name ?? order.outletName} •{" "}
                  {detail?.depot ?? order.depot} Depot
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-muted/30 p-3.5 rounded-xl border border-border/80">
                    <span className="text-[11px] text-muted-foreground block">
                      Order Date
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {order.orderDate}
                    </span>
                  </div>
                  <div className="bg-muted/30 p-3.5 rounded-xl border border-border/80">
                    <span className="text-[11px] text-muted-foreground block">
                      Delivery Window
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {detail?.delivery_window ||
                        order.requiredDate ||
                        "05:00 - 08:00 AM"}
                    </span>
                  </div>
                  <div className="bg-muted/30 p-3.5 rounded-xl border border-border/80">
                    <span className="text-[11px] text-muted-foreground block">
                      Weight / Volume
                    </span>
                    <span className="text-xs font-bold text-foreground tabular-nums">
                      {order.totalWeightKg.toFixed(1)} kg (
                      {order.totalVolumeM3.toFixed(2)} m³)
                    </span>
                  </div>
                  <div className="bg-muted/30 p-3.5 rounded-xl border border-border/80">
                    <span className="text-[11px] text-muted-foreground block">
                      Order Total
                    </span>
                    <span className="text-xs font-bold text-primary tabular-nums">
                      LKR {order.totalOrderValueLkr.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Itemized Packages ({items.length})
                    </h4>
                    <span className="text-[11px] text-muted-foreground tabular-nums font-medium">
                      Units: {items.reduce((sum, i) => sum + i.quantity, 0)}
                    </span>
                  </div>

                  <OrderDetailItemsTable isLoading={isLoading} items={items} />
                </div>
              </div>

              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-2.5">
                <div>
                  {isPending && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCancelDialog(true)}
                      className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-xl text-xs font-semibold"
                    >
                      <TrashIcon className="size-4" />
                      Cancel Order
                    </Button>
                  )}
                  {!isPending && !isCancelled && (
                    <span className="text-[11px] text-muted-foreground italic">
                      Order is{" "}
                      {currentStatus ? currentStatus.replace("_", " ") : "locked"} and
                      cannot be cancelled
                    </span>
                  )}
                  {isCancelled && (
                    <span className="text-[11px] text-rose-500 font-semibold">
                      Order is cancelled
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {onReorder && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        onReorder(order, items);
                        onClose();
                      }}
                      className="gap-1.5 cursor-pointer rounded-xl text-xs font-semibold"
                    >
                      <ArrowCounterClockwiseIcon className="size-4" />
                      Reorder Items
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="gap-1.5 cursor-pointer rounded-xl text-xs"
                  >
                    <PrinterIcon className="size-4" />
                    Print Invoice
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onClose}
                    className="rounded-xl cursor-pointer text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <OrderCancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        orderRef={order?.orderRef}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}
