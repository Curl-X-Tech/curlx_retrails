import * as React from "react";
import {
  TruckIcon,
  UserIcon,
  WarningCircleIcon,
  PrinterIcon,
  CalendarBlankIcon,
  ClockIcon,
  SnowflakeIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useTripChecklist } from "@/api/loader";
import { ManifestWaypointsList } from "./manifest-waypoints-list";
import { printManifestWaybill } from "../utils/print-manifest";
import { mapChecklistToWaypoints } from "../hooks/bay-mappers";
import type { LoaderVehicleTrip } from "../types";

interface ManifestInspectSheetProps {
  trip: LoaderVehicleTrip | null;
  onClose: () => void;
  onOpenBayStation: (tripId: string) => void;
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "Today";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  } catch {
    /* fallback */
  }
  return dateStr;
}

function formatTime12h(timeStr?: string): string {
  if (!timeStr) return "";
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h < 10 ? "0" : ""}${h}:${m} ${ampm}`;
  }
  return timeStr;
}

export function ManifestInspectSheet({
  trip,
  onClose,
  onOpenBayStation,
}: ManifestInspectSheetProps) {
  const needsFetch = Boolean(
    trip?.id && (!trip.waypoints || trip.waypoints.length === 0)
  );
  const { data: checklistData } = useTripChecklist(needsFetch ? trip?.id || "" : "");

  const waypoints = React.useMemo(() => {
    if (!trip) return [];
    if (trip.waypoints && trip.waypoints.length > 0) return trip.waypoints;
    if (checklistData) return mapChecklistToWaypoints(checklistData);
    return [];
  }, [trip, checklistData]);

  const totalCrates = React.useMemo(() => {
    return waypoints.reduce(
      (acc, wp) => acc + wp.items.reduce((sum, i) => sum + i.crateCount, 0),
      0
    );
  }, [waypoints]);

  if (!trip) return null;

  const fullTrip: LoaderVehicleTrip = {
    ...trip,
    waypoints,
  };

  const formattedDate = formatDisplayDate(trip.dispatchDate);
  const formattedRollout = formatTime12h(trip.plannedDepartureTime);

  return (
    <Sheet open={Boolean(trip)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="sm:max-w-lg w-full p-0 flex flex-col bg-card [&>button]:hidden"
      >
        <SheetHeader className="p-4 pb-3 border-b border-border/70 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <TruckIcon className="size-5 text-primary shrink-0" weight="bold" />
            <SheetTitle className="font-heading font-black text-base text-foreground truncate">
              Manifest #{trip.tripCode}
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-foreground">{trip.dockBay}</span>
            <span>·</span>
            <span className="font-semibold text-foreground">#{trip.regNumber}</span>
            <span>·</span>
            <span>{trip.modelName}</span>
            <span>·</span>
            <span>{trip.depotName}</span>
            {trip.temp === "reefer" && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
                  <SnowflakeIcon className="size-3" />
                  <span>Cold Chain</span>
                </span>
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* Timing & Rollout Schedule Card */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-muted/40 border border-border text-xs">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-4 text-primary shrink-0" weight="bold" />
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Planned Rollout
                </span>
                <span className="font-bold text-foreground text-xs">
                  {formattedRollout}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarBlankIcon className="size-4 text-primary shrink-0" weight="bold" />
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Dispatch Date
                </span>
                <span className="font-bold text-foreground text-xs">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Vehicle & Pilot Details */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserIcon className="size-4 text-primary" weight="bold" />
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
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Weight
                </span>
                <span className="font-heading font-bold text-foreground">
                  {trip.payload.currentKg} / {trip.weightCapKg} kg
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Volume
                </span>
                <span className="font-heading font-bold text-foreground">
                  {trip.payload.currentVolumeM3} / {trip.volumeCapM3} m³
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Total Payload
                </span>
                <span className="font-heading font-bold text-foreground">
                  {totalCrates} Crates ({waypoints.length || trip.stopsCount} Drops)
                </span>
              </div>
            </div>
          </div>

          {trip.flagReason && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <WarningCircleIcon
                className="size-4.5 text-amber-600 shrink-0 mt-0.5"
                weight="fill"
              />
              <div>
                <span className="font-bold block">Flagged Discrepancy Logged:</span>
                <span>{trip.flagReason}</span>
              </div>
            </div>
          )}

          <ManifestWaypointsList waypoints={waypoints} />

          <div className="pt-2 flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => printManifestWaybill(fullTrip)}
              className="h-9 px-3 text-xs font-semibold rounded-xl gap-1.5 cursor-pointer"
              title="Print Manifest Waybill"
            >
              <PrinterIcon className="size-3.5" weight="bold" />
              <span>Print Waybill</span>
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="h-9 px-3 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close
            </Button>
            <Button
              variant="default"
              onClick={() => {
                onClose();
                onOpenBayStation(trip.id);
              }}
              className="flex-1 h-9 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer shadow-xs"
            >
              Open Bay Station
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
