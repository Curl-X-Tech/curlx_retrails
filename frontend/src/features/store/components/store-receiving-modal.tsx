import * as React from "react";
import {
  CheckCircleIcon,
  SnowflakeIcon,
  WarningCircleIcon,
  MinusIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InboundShipment, ReceivingCheckItem } from "../types";

interface StoreReceivingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: InboundShipment | null;
  onConfirm: (payload: {
    shipmentId: string;
    waypointId: string;
    items: ReceivingCheckItem[];
    cratesReturned: number;
    recipientName: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function StoreReceivingModal({
  isOpen,
  onClose,
  shipment,
  onConfirm,
  isSubmitting = false,
}: StoreReceivingModalProps) {
  const [items, setItems] = React.useState<ReceivingCheckItem[]>([]);
  const [cratesReturned, setCratesReturned] = React.useState<number>(0);
  const [recipientName, setRecipientName] = React.useState<string>("Store Manager");

  React.useEffect(() => {
    if (shipment) {
      setItems(
        shipment.items.map((item) => ({
          itemId: item.id,
          name: item.name,
          sku: item.sku,
          requestedQty: item.quantity,
          receivedQty: item.quantity,
          specialHandlingCode: item.specialHandlingCode,
        }))
      );
      setCratesReturned(shipment.cratesReturned || 0);
    }
  }, [shipment]);

  if (!shipment) return null;

  const isReadOnly = shipment.status === "delivered" || shipment.status === "discrepancy";

  const updateReceivedQty = (itemId: string, delta: number) => {
    if (isReadOnly) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.itemId !== itemId) return item;
        const newQty = Math.max(0, Math.min(item.requestedQty, item.receivedQty + delta));
        const hasShortage = newQty < item.requestedQty;
        return {
          ...item,
          receivedQty: newQty,
          issueType: hasShortage ? item.issueType || "damaged_in_transit" : undefined,
        };
      })
    );
  };

  const updateIssueType = (
    itemId: string,
    issueType: ReceivingCheckItem["issueType"]
  ) => {
    if (isReadOnly) return;
    setItems((prev) =>
      prev.map((item) => (item.itemId === itemId ? { ...item, issueType } : item))
    );
  };

  const handleConfirm = async () => {
    await onConfirm({
      shipmentId: shipment.id,
      waypointId: shipment.waypointId,
      items,
      cratesReturned,
      recipientName,
    });
  };

  const hasAnyDiscrepancy = items.some(
    (i) => i.receivedQty < i.requestedQty && i.issueType
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <span>{isReadOnly ? "Receiving Summary" : "Inbound Inspection"}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {shipment.vehicleNo}
              </span>
            </DialogTitle>
            {shipment.tempRequirement === "chilled" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-900 text-cyan-100">
                <SnowflakeIcon className="size-3" weight="bold" />
                {shipment.reeferTempC !== undefined
                  ? `${shipment.reeferTempC.toFixed(1)}°C`
                  : "Cold Chain"}
              </span>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
            <span>Order: {shipment.orderRef}</span>
            <span>•</span>
            <span>Trip: {shipment.tripId}</span>
            <span>•</span>
            <span>Driver: {shipment.driverName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Items Check */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Package Manifest Check
            </span>
            <div className="space-y-2">
              {items.map((item) => {
                const isShort = item.receivedQty < item.requestedQty;
                return (
                  <div
                    key={item.itemId}
                    className="p-3 border border-border/60 rounded-lg bg-card/50 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-foreground">{item.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          SKU: {item.sku}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono">
                          Req: {item.requestedQty}
                        </span>
                        {!isReadOnly ? (
                          <div className="flex items-center border border-border rounded-md">
                            <button
                              type="button"
                              onClick={() => updateReceivedQty(item.itemId, -1)}
                              className="px-2 py-1 hover:bg-muted text-foreground"
                            >
                              <MinusIcon className="size-3" />
                            </button>
                            <span className="px-2 font-mono font-bold text-foreground">
                              {item.receivedQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateReceivedQty(item.itemId, 1)}
                              className="px-2 py-1 hover:bg-muted text-foreground"
                            >
                              <PlusIcon className="size-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-foreground px-2 py-0.5 bg-muted rounded">
                            Rec: {item.receivedQty}
                          </span>
                        )}
                      </div>
                    </div>

                    {isShort && !isReadOnly && (
                      <div className="pt-2 border-t border-border/40 flex items-center gap-2 bg-rose-500/5 p-2 rounded">
                        <WarningCircleIcon className="size-4 text-rose-600 shrink-0" />
                        <span className="text-[11px] font-medium text-rose-600">
                          Discrepancy Reason:
                        </span>
                        <select
                          value={item.issueType || "damaged_in_transit"}
                          onChange={(e) =>
                            updateIssueType(
                              item.itemId,
                              e.target.value as ReceivingCheckItem["issueType"]
                            )
                          }
                          aria-label="Discrepancy Reason"
                          className="h-7 text-xs px-2 rounded border border-border bg-background text-foreground"
                        >
                          <option value="damaged_in_transit">Damaged in Transit</option>
                          <option value="missing_crate">Missing Package / Crate</option>
                          <option value="temp_spoilage">Temperature Spoilage</option>
                          <option value="rejected_by_store">Rejected by Store</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Crate Return & Sign-off */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Empty Crates Returned
              </label>
              <Input
                type="number"
                min={0}
                disabled={isReadOnly}
                value={cratesReturned}
                onChange={(e) => setCratesReturned(Number(e.target.value) || 0)}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Receiver Sign-Off Name
              </label>
              <Input
                type="text"
                disabled={isReadOnly}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/50 flex items-center justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            {isReadOnly ? "Close" : "Cancel"}
          </Button>
          {!isReadOnly && (
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`text-xs font-semibold ${
                hasAnyDiscrepancy
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {isSubmitting ? (
                "Submitting..."
              ) : hasAnyDiscrepancy ? (
                <>
                  <WarningCircleIcon className="size-3.5 mr-1" />
                  Log Discrepancy & Receive
                </>
              ) : (
                <>
                  <CheckCircleIcon className="size-3.5 mr-1" />
                  Confirm All Received
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
