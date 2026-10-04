import { Button } from "@/components/ui/button";
import { ManifestVehicleCard, type ManifestVehicleCardData } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { LoaderVehicleTrip } from "../types";

interface ManifestGridViewProps {
  trips: LoaderVehicleTrip[];
  onOpenBay: (tripId: string) => void;
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "";
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

export function ManifestGridView({ trips, onOpenBay }: ManifestGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
      {trips.map((trip) => {
        const cardData: ManifestVehicleCardData = {
          id: trip.id,
          plateNumber: trip.regNumber,
          vehicleModel: trip.modelName,
          imageUrl: trip.imagePath,
          hubName: trip.dockBay,
          stopsCount: trip.stopsCount,
          nextStopName: trip.nextStopName,
          isColdChain: trip.temp === "reefer",
        };

        const statusLabel =
          trip.status === "dispatched"
            ? "Loaded"
            : trip.status === "in_transit"
              ? "In Transit"
              : trip.status === "completed"
                ? "Completed"
                : trip.status === "ready"
                  ? "Ready"
                  : trip.status === "flagged"
                    ? "Flagged"
                    : "Loading";

        const formattedDate = formatDisplayDate(trip.dispatchDate);
        const formattedTime = formatTime12h(trip.plannedDepartureTime);

        return (
          <div
            key={trip.id}
            className="flex flex-col gap-1.5 p-2 bg-card rounded-2xl border border-border/80 shadow-xs"
          >
            <ManifestVehicleCard
              vehicle={cardData}
              variant="loader"
              onClick={() => onOpenBay(trip.id)}
            />
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-heading font-black text-foreground truncate">
                  {trip.tripCode}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground font-semibold shrink-0">
                  {formattedTime}
                </span>
                {formattedDate && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground font-medium shrink-0">
                      {formattedDate}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground">·</span>
                <span
                  className={cn(
                    "text-[11px] font-bold shrink-0",
                    statusLabel === "Loaded"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-primary"
                  )}
                >
                  {statusLabel}
                </span>
              </div>
              <Button
                variant={trip.status === "loading" ? "default" : "secondary"}
                size="sm"
                onClick={() => onOpenBay(trip.id)}
                className="h-6.5 px-2.5 text-[11px] font-bold rounded-lg cursor-pointer shrink-0"
              >
                {trip.status === "loading" ? "Open Bay" : "View"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
