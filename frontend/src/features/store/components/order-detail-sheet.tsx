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
import { useOrder } from "@/api/orders";
import { printInvoice } from "../print-invoice";
import { OrderStatusBadge } from "./order-status-badge";
import type { StoreOrderItemRow, StoreOrderRecord } from "../types";

interface OrderDetailSheetProps {
  order: StoreOrderRecord | null;
  onClose: () => void;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function OrderDetailSheet({ order, onClose }: OrderDetailSheetProps) {
  const { data: detail, isLoading } = useOrder(order?.id ?? "", {
    enabled: !!order && UUID_PATTERN.test(order.id),
  });

  const items: StoreOrderItemRow[] = detail
    ? detail.items.map((i, idx) => ({
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
        specialHandlingCode: i.special_handling_code ?? undefined,
      }))
    : (order?.items ?? []);

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

  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-full data-[side=right]:sm:w-[70vw] data-[side=right]:sm:max-w-none p-0 flex flex-col h-full bg-card"
      >
        {order && (
          <>
            <SheetHeader className="p-6 border-b border-border bg-muted/20">
              <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                Order Details
              </span>
              <div className="flex items-center gap-3 mt-1">
                <SheetTitle className="text-lg font-bold text-foreground">
                  {order.orderRef} ({order.tripId || "No Trip Assigned"})
                </SheetTitle>
                <OrderStatusBadge status={order.status} />
              </div>
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
                  Line Items ({items.length})
                </h4>
                {isLoading ? (
                  <p className="text-xs text-muted-foreground">Loading items...</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
                        <tr>
                          <th className="text-left p-3">Item</th>
                          <th className="text-left p-3">Category</th>
                          <th className="text-right p-3">Qty</th>
                          <th className="text-right p-3">Unit Price</th>
                          <th className="text-right p-3">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-t border-border">
                            <td className="p-3">
                              <span className="font-semibold text-foreground">
                                {item.name}
                              </span>
                              {item.specialHandlingCode && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-[10px] px-1.5 py-0 h-4"
                                >
                                  {item.specialHandlingCode}
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-muted-foreground">{item.category}</td>
                            <td className="p-3 text-right">{item.quantity}</td>
                            <td className="p-3 text-right">
                              {item.unitPriceLkr.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-semibold">
                              {item.totalPriceLkr.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 cursor-pointer rounded-xl"
              >
                <PrinterIcon className="size-4" />
                Print Invoice
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
