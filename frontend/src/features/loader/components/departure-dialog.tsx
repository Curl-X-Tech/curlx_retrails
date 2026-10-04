import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheckIcon, TruckIcon, WarningCircleIcon } from "@phosphor-icons/react";

import type { LoaderVehicleTrip } from "../types";

interface DepartureDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trip: LoaderVehicleTrip;
  isReady: boolean;
  onConfirmDeparture: (sealNumber: string) => void;
  isSubmitting?: boolean;
}

export function DepartureDialog({
  isOpen,
  onOpenChange,
  trip,
  isReady,
  onConfirmDeparture,
  isSubmitting,
}: DepartureDialogProps) {
  const [sealNumber, setSealNumber] = React.useState(trip.sealNumber || "SL-90821-B");

  React.useEffect(() => {
    if (trip.sealNumber) setSealNumber(trip.sealNumber);
  }, [trip.sealNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sealNumber.trim()) return;
    onConfirmDeparture(sealNumber.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 rounded-2xl">
        <DialogHeader className="gap-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TruckIcon className="size-5" weight="bold" />
            </div>
            <div>
              <DialogTitle className="text-base font-heading font-black">
                Confirm Bay Departure
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Trip {trip.tripCode} · Vehicle {trip.regNumber}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {!isReady && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
              <WarningCircleIcon className="size-4 shrink-0 mt-0.5" weight="fill" />
              <span>
                Some waypoints or checklist line items have not been verified and sealed.
                Confirming departure will dispatch the vehicle immediately.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-xl border border-border/60">
            <div>
              <span className="text-muted-foreground block text-[11px]">
                Assigned Driver
              </span>
              <span className="font-semibold text-foreground">{trip.driver.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Total Stops</span>
              <span className="font-semibold text-foreground">
                {trip.stopsCount} Outlets
              </span>
            </div>
            <div className="mt-1">
              <span className="text-muted-foreground block text-[11px]">
                Allocated Weight
              </span>
              <span className="font-semibold text-foreground">
                {trip.payload.currentKg} kg
              </span>
            </div>
            <div className="mt-1">
              <span className="text-muted-foreground block text-[11px]">
                Verified Items
              </span>
              <span className="font-semibold text-foreground">
                {trip.verifiedItemsCount} / {trip.totalItemsCount}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="seal-num" className="text-xs font-semibold">
              Security Tamper Seal Number
            </label>
            <Input
              id="seal-num"
              value={sealNumber}
              onChange={(e) => setSealNumber(e.target.value)}
              placeholder="e.g. SL-90821-B"
              className="h-9 text-xs rounded-xl font-mono uppercase"
              required
            />
            <span className="text-[10px] text-muted-foreground">
              Applied tamper-evident bolt/cable seal for cargo chain of custody.
            </span>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !sealNumber.trim()}
              className="rounded-xl text-xs font-semibold gap-1.5"
            >
              <ShieldCheckIcon className="size-4" weight="bold" />
              <span>{isSubmitting ? "Dispatching..." : "Confirm & Dispatch"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
