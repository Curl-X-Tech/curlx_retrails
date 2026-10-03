import { GasPumpIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import type { DriverTrip } from "../types";

interface VehicleFuelCardProps {
  trip: DriverTrip;
  fuelPercentage: number;
}

export function VehicleFuelCard({ trip, fuelPercentage }: VehicleFuelCardProps) {
  return (
    <Card className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GasPumpIcon className="size-5 text-primary" weight="bold" />
          <h4 className="font-heading font-bold text-sm text-foreground">
            Fuel Quota & Efficiency
          </h4>
        </div>
        <span className="font-heading font-bold text-xs text-foreground">
          {trip.kmPerL} km/L
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground font-medium">Remaining Fuel</span>
          <strong className="text-foreground">
            {trip.fuelRemainingL} L / {trip.weeklyFuelQuotaL} L ({fuelPercentage}%)
          </strong>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${fuelPercentage}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
