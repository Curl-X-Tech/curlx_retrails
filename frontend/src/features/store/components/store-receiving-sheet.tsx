import * as React from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useOrder, type OrderItem } from "@/api/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StoreReceivingStage } from "./store-receiving-stage";
import { StoreReceivingSheetTable } from "./store-receiving-sheet-table";
import type { InboundShipment, ReceivingCheckItem } from "../types";

interface StoreReceivingSheetProps {
  shipment: InboundShipment | null;
  onClose: () => void;
  onSubmit: (shipment: InboundShipment, lines: ReceivingCheckItem[]) => Promise<void>;
  isSubmitting: boolean;
  submitError: Error | null;
}

function toCheckLine(item: OrderItem): ReceivingCheckItem | null {
  if (!item.id) return null;
  return {
    itemId: item.id,
    name: item.item_name ?? item.item_id,
    packageCode: item.package_code,
    requestedQty: item.requested_qty,
    receivedQty: item.delivered_qty ?? item.requested_qty,
    issueType: "damaged_in_transit",
    specialHandlingCode: item.special_handling_code,
  };
}

function SummaryCell({
  label,
  value,
  danger,
}: {
  label: string;
  value: string | number;
  danger?: boolean;
}) {
  return (
    <div className="bg-muted/30 p-3 rounded-xl border border-border/80">
      <span className="text-[11px] text-muted-foreground block">{label}</span>
      <span
        className={`text-sm font-bold tabular-nums ${
          danger ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function StoreReceivingSheet({
  shipment,
  onClose,
  onSubmit,
  isSubmitting,
  submitError,
}: StoreReceivingSheetProps) {
  const { data: detail, isLoading } = useOrder(shipment?.id ?? "");
  const [lines, setLines] = React.useState<ReceivingCheckItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [shortOnly, setShortOnly] = React.useState(false);

  React.useEffect(() => {
    setLines(
      (detail?.items ?? [])
        .map(toCheckLine)
        .filter((l): l is ReceivingCheckItem => l !== null)
    );
    setSearch("");
    setShortOnly(false);
  }, [detail]);

  const priceByItem = React.useMemo(
    () => new Map((detail?.items ?? []).map((i) => [i.id, i.unit_price])),
    [detail]
  );

  const canReceive = shipment?.status === "in_transit";
  const shortLines = lines.filter((l) => l.receivedQty < l.requestedQty);
  const orderedUnits = lines.reduce((s, l) => s + l.requestedQty, 0);
  const receivedUnits = lines.reduce((s, l) => s + l.receivedQty, 0);
  const missingValue = shortLines.reduce(
    (s, l) => s + (l.requestedQty - l.receivedQty) * (priceByItem.get(l.itemId) ?? 0),
    0
  );

  const visibleLines = lines.filter((l) => {
    if (shortOnly && l.receivedQty >= l.requestedQty) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) || (l.packageCode ?? "").toLowerCase().includes(q)
    );
  });

  const patch = (itemId: string, change: Partial<ReceivingCheckItem>) =>
    setLines((prev) => prev.map((l) => (l.itemId === itemId ? { ...l, ...change } : l)));

  const setQty = (line: ReceivingCheckItem, qty: number) =>
    patch(line.itemId, {
      receivedQty: Math.min(line.requestedQty, Math.max(0, qty)),
    });

  const markAllReceived = () =>
    setLines((prev) => prev.map((l) => ({ ...l, receivedQty: l.requestedQty })));

  return (
    <Sheet open={!!shipment} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="data-[side=right]:w-full data-[side=right]:sm:w-[70vw] data-[side=right]:sm:max-w-none p-0 flex flex-col h-full bg-card"
      >
        {shipment && (
          <>
            <SheetHeader className="p-6 border-b border-border bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                  {canReceive ? "Receive Delivery" : "Delivery Details"}
                </span>
                {shipment.isUrgent && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] uppercase font-bold"
                  >
                    Urgent Priority
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-lg font-bold text-foreground">
                {shipment.orderRef}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {shipment.outletName} • {shipment.depot} Depot • Delivery{" "}
                {shipment.requiredDate}
              </SheetDescription>
              <StoreReceivingStage status={shipment.status} />
            </SheetHeader>

            <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryCell label="Lines" value={lines.length} />
              <SummaryCell label="Ordered units" value={orderedUnits} />
              <SummaryCell label="Received units" value={receivedUnits} />
              <SummaryCell
                label="Short units"
                value={orderedUnits - receivedUnits}
                danger={orderedUnits > receivedUnits}
              />
            </div>

            <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="relative w-full sm:w-72">
                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search item or package code"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-7 h-7 text-xs bg-card"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={shortOnly ? "default" : "outline"}
                  size="xs"
                  className="h-7 px-2 text-[11px] cursor-pointer"
                  onClick={() => setShortOnly((v) => !v)}
                >
                  Short only ({shortLines.length})
                </Button>
                {canReceive && (
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-7 px-2 text-[11px] cursor-pointer"
                    onClick={markAllReceived}
                  >
                    Mark all as received
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
              <StoreReceivingSheetTable
                isLoading={isLoading}
                visibleLines={visibleLines}
                canReceive={canReceive}
                onSetQty={setQty}
                onPatch={patch}
              />
            </div>

            <div className="px-6 py-3 border-t border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-[11px]">
                {submitError ? (
                  <span className="text-destructive">{submitError.message}</span>
                ) : canReceive && shortLines.length > 0 ? (
                  <span className="text-destructive font-semibold tabular-nums">
                    {orderedUnits - receivedUnits} units short on {shortLines.length}{" "}
                    lines • LKR {missingValue.toLocaleString()}
                  </span>
                ) : canReceive ? (
                  <span className="text-muted-foreground">
                    Full count matches the order. Receipt is closed by the driver proof of
                    delivery.
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
                  Close
                </Button>
                {canReceive && (
                  <Button
                    size="sm"
                    className="text-xs"
                    disabled={shortLines.length === 0 || isSubmitting}
                    onClick={() => onSubmit(shipment, lines)}
                  >
                    {isSubmitting ? "Submitting" : "Report shortages"}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
