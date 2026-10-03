import { PhoneIcon, UserIcon, MapPinIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { VehicleTrackingData } from "@/types";

interface LiveVehicleDriverInfoProps {
  vehicle: VehicleTrackingData;
}

export function LiveVehicleDriverInfo({ vehicle }: LiveVehicleDriverInfoProps) {
  return (
    <div className="p-3.5 space-y-3">
      <div className="flex items-center justify-between bg-muted/40 p-2 rounded-xl border border-border/40 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
            <UserIcon className="size-3.5" />
          </div>
          <div className="truncate">
            <p className="font-medium text-foreground truncate">{vehicle.driverName}</p>
            <p className="text-[10px] text-muted-foreground">{vehicle.driverPhone}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="xs"
          className="h-6 text-[11px] gap-1 cursor-pointer rounded-lg"
          onClick={() => window.open(`tel:${vehicle.driverPhone}`, "_self")}
        >
          <PhoneIcon className="size-3 text-primary" />
          <span>Call</span>
        </Button>
      </div>

      <div className="bg-primary/5 border border-primary/15 rounded-xl p-2.5 flex items-start gap-2">
        <MapPinIcon className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
              Next Delivery Stop
            </span>
            <span className="text-[10px] font-semibold text-primary/80">
              ETA {vehicle.nextStopEta}
            </span>
          </div>
          <p className="font-semibold text-foreground truncate mt-0.5">
            {vehicle.nextStop}
          </p>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5 pt-1.5 border-t border-primary/10">
            <span className="flex items-center gap-1">
              <CheckCircleIcon className="size-3 text-emerald-600" />
              <span>
                Progress:{" "}
                <strong>
                  {vehicle.stopsCompleted} of {vehicle.stopsTotal}
                </strong>{" "}
                stops
              </span>
            </span>
            <span>
              <strong>{vehicle.cratesCount}</strong> Crates
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
