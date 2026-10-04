import * as React from "react";
import {
  ArrowCounterClockwiseIcon,
  PrinterIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useOrder, useUpdateOrderStatus } from "@/api/orders";
import { printInvoice } from "../print-invoice";
import { OrderStatusBadge } from "./order-status-badge";
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

                  {isLoading ? (
                    <p className="text-xs text-muted-foreground py-8 text-center">
                      Loading line items...
                    </p>
                  ) : items.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground rounded-xl border border-border bg-muted/20">
                      No itemized packages available.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border/80 overflow-hidden bg-card shadow-2xs">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border/60">
                          <tr>
                            <th className="text-left p-3 font-semibold">Item & SKU</th>
                            <th className="text-left p-3 font-semibold">Category</th>
                            <th className="text-right p-3 font-semibold">Qty</th>
                            <th className="text-right p-3 font-semibold">Unit Price</th>
                            <th className="text-right p-3 font-semibold">Weight</th>
                            <th className="text-right p-3 font-semibold pr-4">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {items.map((item, idx) => (
                            <tr
                              key={item.id || idx}
                              className="hover:bg-muted/20 transition-colors"
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-foreground">
                                    {item.name}
                                  </span>
                                  {item.specialHandlingCode && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0 h-4 font-mono font-bold"
                                    >
                                      {item.specialHandlingCode}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {item.sku}
                                </span>
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {item.category || "General"}
                              </td>
                              <td className="p-3 text-right">
                                <span className="font-bold text-foreground bg-muted/50 px-2 py-0.5 rounded-md tabular-nums">
                                  {item.quantity}
                                </span>
                              </td>
                              <td className="p-3 text-right tabular-nums text-muted-foreground">
                                LKR {item.unitPriceLkr.toLocaleString()}
                              </td>
                              <td className="p-3 text-right tabular-nums text-muted-foreground">
                                {item.totalWeightKg.toFixed(1)} kg
                              </td>
                              <td className="p-3 text-right font-bold text-foreground tabular-nums pr-4">
                                LKR {item.totalPriceLkr.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t border-border font-semibold text-xs">
                          <tr>
                            <td colSpan={2} className="p-3 text-foreground font-bold">
                              Total Order Manifest
                            </td>
                            <td className="p-3 text-right font-bold text-foreground tabular-nums">
                              {items.reduce((sum, i) => sum + i.quantity, 0)}
                            </td>
                            <td className="p-3"></td>
                            <td className="p-3 text-right font-bold text-foreground tabular-nums">
                              {items
                                .reduce((sum, i) => sum + i.totalWeightKg, 0)
                                .toFixed(1)}{" "}
                              kg
                            </td>
                            <td className="p-3 text-right font-extrabold text-primary tabular-nums pr-4">
                              LKR{" "}
                              {items
                                .reduce((sum, i) => sum + i.totalPriceLkr, 0)
                                .toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
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

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <WarningCircleIcon className="size-5 text-destructive" />
              <DialogTitle className="text-base font-bold">
                Confirm Order Cancellation
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to cancel order{" "}
              <strong className="text-foreground">{order?.orderRef}</strong>? This action
              will remove the order from the dispatch planning queue and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelDialog(false)}
              className="text-xs rounded-xl cursor-pointer"
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmCancel}
              className="text-xs rounded-xl font-semibold cursor-pointer"
            >
              Confirm Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
