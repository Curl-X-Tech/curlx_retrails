import { TruckIcon, UserIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ManifestWaypointsList } from "./manifest-waypoints-list";
import type { LoaderVehicleTrip } from "../types";

interface ManifestInspectSheetProps {
  trip: LoaderVehicleTrip | null;
  onClose: () => void;
  onOpenBayStation: (tripId: string) => void;
}

export function ManifestInspectSheet({ trip, onClose, onOpenBayStation }: ManifestInspectSheetProps) {
  return (
    <Sheet open={Boolean(trip)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col bg-card">
        {trip && (
          <>
            <SheetHeader className="p-4 pb-3 border-b border-border/70">
              <div className="flex items-center justify-between">
                <SheetTitle className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                  <TruckIcon className="size-5 text-primary" weight="bold" />
                  <span>Manifest {trip.tripCode}</span>
                </SheetTitle>
                <Badge variant="secondary" className="font-bold text-xs">
                  {trip.dockBay}
                </Badge>
              </div>
              <SheetDescription className="text-xs text-muted-foreground">
                Vehicle #{trip.regNumber} · Seal #{trip.sealNumber}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserIcon className="size-4 text-primary" />
                    <span className="font-heading font-bold text-xs text-foreground">
                      {trip.driver.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {trip.driver.phone}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Weight</span>
                    <span className="font-heading font-bold text-foreground">
                      {trip.payload.currentKg} / {trip.weightCapKg} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Volume</span>
                    <span className="font-heading font-bold text-foreground">
                      {trip.payload.currentVolumeM3} / {trip.volumeCapM3} m³
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Departure</span>
                    <span className="font-heading font-bold text-foreground">{trip.plannedDepartureTime}</span>
                  </div>
                </div>
              </div>

              {trip.flagReason && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <WarningCircleIcon className="size-4.5 text-amber-600 shrink-0 mt-0.5" weight="fill" />
                  <div>
                    <span className="font-bold block">Flagged Discrepancy Logged:</span>
                    <span>{trip.flagReason}</span>
                  </div>
                </div>
              )}

              <ManifestWaypointsList waypoints={trip.waypoints} />

              <div className="pt-1 flex items-center gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1 h-9 rounded-xl text-xs font-semibold cursor-pointer">
                  Close
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    onClose();
                    onOpenBayStation(trip.id);
                  }}
                  className="flex-1 h-9 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer"
                >
                  Open Bay Station
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
