import * as React from "react";
import { MagnifyingGlassIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StoreReceivingStage } from "./store-receiving-stage";
import type { DiscrepancyIssue, InboundShipment, ReceivingCheckItem } from "../types";

interface StoreReceivingSheetProps {
  shipment: InboundShipment | null;
  onClose: () => void;
  onSubmit: (shipment: InboundShipment, lines: ReceivingCheckItem[]) => Promise<void>;
  isSubmitting: boolean;
  submitError: Error | null;
}

const ISSUE_LABELS: Record<DiscrepancyIssue, string> = {
  damaged_in_transit: "Damaged in transit",
  missing_crate: "Missing package",
  temp_spoilage: "Temperature spoilage",
  rejected_by_store: "Rejected by store",
};

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
              <div className="border border-border/80 rounded-xl overflow-hidden">
                <Table className="w-full text-xs">
                  <TableHeader className="bg-muted/30 sticky top-0 z-10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold">Item</TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Ordered
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-center">
                        Received
                      </TableHead>
                      <TableHead className="text-xs font-semibold">Reason</TableHead>
                      <TableHead className="text-xs font-semibold">Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-32 text-center text-muted-foreground"
                        >
                          Loading items
                        </TableCell>
                      </TableRow>
                    ) : visibleLines.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-32 text-center text-muted-foreground"
                        >
                          No items match the current filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleLines.map((line) => {
                        const short = line.receivedQty < line.requestedQty;
                        return (
                          <TableRow key={line.itemId}>
                            <TableCell>
                              <span className="font-medium text-foreground block">
                                {line.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {line.packageCode}
                                {line.specialHandlingCode
                                  ? ` • ${line.specialHandlingCode}`
                                  : ""}
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {line.requestedQty}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="xs"
                                  className="size-6 p-0 cursor-pointer"
                                  disabled={!canReceive || line.receivedQty === 0}
                                  onClick={() => setQty(line, line.receivedQty - 1)}
                                >
                                  <MinusIcon className="size-3" />
                                </Button>
                                <input
                                  type="number"
                                  min={0}
                                  max={line.requestedQty}
                                  disabled={!canReceive}
                                  value={line.receivedQty}
                                  onChange={(e) =>
                                    setQty(line, Number(e.target.value) || 0)
                                  }
                                  className={`w-14 h-6 rounded-md border border-border bg-card px-1 text-center text-xs font-bold tabular-nums disabled:opacity-70 ${
                                    short ? "text-destructive" : "text-foreground"
                                  }`}
                                />
                                <Button
                                  variant="outline"
                                  size="xs"
                                  className="size-6 p-0 cursor-pointer"
                                  disabled={
                                    !canReceive || line.receivedQty >= line.requestedQty
                                  }
                                  onClick={() => setQty(line, line.receivedQty + 1)}
                                >
                                  <PlusIcon className="size-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              {short && canReceive ? (
                                <select
                                  value={line.issueType}
                                  onChange={(e) =>
                                    patch(line.itemId, {
                                      issueType: e.target.value as DiscrepancyIssue,
                                    })
                                  }
                                  aria-label="Discrepancy reason"
                                  className="h-7 rounded-md border border-border bg-card px-2 text-xs"
                                >
                                  {Object.entries(ISSUE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {short && canReceive ? (
                                <Input
                                  placeholder="Optional note"
                                  value={line.notes ?? ""}
                                  onChange={(e) =>
                                    patch(line.itemId, { notes: e.target.value })
                                  }
                                  className="h-7 text-xs min-w-40"
                                />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
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
