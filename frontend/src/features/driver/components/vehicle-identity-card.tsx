import { TruckIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DriverTrip } from "../types";

interface VehicleIdentityCardProps {
  trip: DriverTrip;
}

export function VehicleIdentityCard({ trip }: VehicleIdentityCardProps) {
  return (
    <Card className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <TruckIcon className="size-5" weight="bold" />
          </div>
          <div>
            <h3 className="font-heading font-black text-base text-foreground">
              #{trip.regNumber}
            </h3>
            <span className="text-xs text-muted-foreground">{trip.modelName}</span>
          </div>
        </div>
        <Badge variant="secondary" className="font-bold text-xs">
          {trip.type.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60">
          <span className="text-muted-foreground text-[10px]">Odometer Reading</span>
          <div className="font-heading font-bold text-sm text-foreground mt-0.5">
            {trip.currentOdometerKm.toLocaleString()} KM
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60">
          <span className="text-muted-foreground text-[10px]">Security Bolt Seal</span>
          <div className="font-heading font-bold text-xs text-foreground mt-0.5">
            {trip.sealNumber}
          </div>
        </div>
      </div>
    </Card>
  );
}
