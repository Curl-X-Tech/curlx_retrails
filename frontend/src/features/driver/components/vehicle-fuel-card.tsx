import { GasPumpIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";

interface VehicleFuelCardProps {
  trip: {
    kmPerL?: number;
    fuelRemainingL?: number;
    weeklyFuelQuotaL?: number;
  };
  fuelPercentage: number;
}

export function VehicleFuelCard({ trip, fuelPercentage }: VehicleFuelCardProps) {
  const kmPerL = trip.kmPerL ?? 6.8;
  const remaining = trip.fuelRemainingL ?? 84.5;
  const quota = trip.weeklyFuelQuotaL ?? 120;

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
          {kmPerL} km/L
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground font-medium">Remaining Fuel</span>
          <strong className="text-foreground">
            {remaining} L / {quota} L ({fuelPercentage}%)
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
