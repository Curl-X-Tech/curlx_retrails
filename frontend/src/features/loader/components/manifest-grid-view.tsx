import { Button } from "@/components/ui/button";
import { ManifestVehicleCard, type ManifestVehicleCardData } from "@/components/shared";
import type { LoaderVehicleTrip } from "../types";

interface ManifestGridViewProps {
  trips: LoaderVehicleTrip[];
  onInspectTrip: (trip: LoaderVehicleTrip) => void;
  onOpenBay: (tripId: string) => void;
}

export function ManifestGridView({
  trips,
  onInspectTrip,
  onOpenBay,
}: ManifestGridViewProps) {
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

        return (
          <div key={trip.id} className="flex flex-col gap-1">
            <ManifestVehicleCard
              vehicle={cardData}
              variant="loader"
              onClick={() => onOpenBay(trip.id)}
            />
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-foreground">
                  {trip.tripCode}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground font-semibold">
                  {trip.plannedDepartureTime}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onInspectTrip(trip)}
                className="h-6.5 px-2 text-[11px] font-semibold rounded-lg cursor-pointer"
              >
                Inspect Stops
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
