import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ManifestVehicleCard, type ManifestVehicleCardData } from "@/components/shared";
import type { LoaderVehicleTrip } from "../types";

interface BayDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tripsCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredTrips: LoaderVehicleTrip[];
  selectedTripId: string;
  onSelectTrip: (tripId: string) => void;
}

export function BayDrawer({
  isOpen,
  onOpenChange,
  tripsCount,
  searchQuery,
  onSearchChange,
  filteredTrips,
  selectedTripId,
  onSelectTrip,
}: BayDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="sm:max-w-md w-full p-0 flex flex-col bg-card [&>button]:hidden"
      >
        <SheetHeader className="p-5 pb-3 border-b border-border/70">
          <SheetTitle className="font-heading font-bold text-base text-foreground flex items-center justify-between">
            <span>Docked Vehicles</span>
            <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              {tripsCount} Docked
            </span>
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Tap any docked vehicle to switch the active bay checklist.
          </SheetDescription>
          <div className="relative mt-2">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search Veh No..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-11 pl-10 rounded-xl bg-background border-border/80 text-sm font-sans shadow-xs"
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredTrips.map((trip) => {
            const isSelected = trip.id === selectedTripId;
            const cardData: ManifestVehicleCardData = {
              id: trip.id,
              plateNumber: trip.regNumber,
              vehicleModel: trip.modelName,
              imageUrl: trip.imagePath,
              hubName: trip.depotName,
              stopsCount: trip.stopsCount,
              nextStopName: trip.nextStopName,
              isColdChain: trip.temp === "reefer",
            };

            return (
              <ManifestVehicleCard
                key={trip.id}
                vehicle={cardData}
                variant="loader"
                isSelected={isSelected}
                onClick={() => {
                  onSelectTrip(trip.id);
                  onOpenChange(false);
                }}
              />
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
