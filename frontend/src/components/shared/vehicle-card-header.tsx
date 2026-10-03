import { SnowflakeIcon, ArrowSquareOutIcon } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/icon-button";
import type { VehicleCardData } from "./vehicle-card-types";

interface VehicleCardHeaderProps {
  vehicle: VehicleCardData;
  onSelect?: (vehicle: VehicleCardData) => void;
}

export function VehicleCardHeader({ vehicle, onSelect }: VehicleCardHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(vehicle);
        }}
        className="cursor-pointer min-w-0"
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <h3 className="font-heading font-black text-base text-foreground tracking-tight group-hover:text-primary transition-colors shrink-0">
            # {vehicle.plateNumber}
          </h3>
          {vehicle.isColdChain && (
            <div className="size-5 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
              <SnowflakeIcon weight="fill" className="size-3.5" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-medium mt-0.5 truncate max-w-[160px]">
          {vehicle.vehicleModel}
        </p>
      </div>

      <IconButton
        variant="ghost"
        size="xs"
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(vehicle);
        }}
        className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
        title="View Details"
      >
        <ArrowSquareOutIcon className="size-4" />
      </IconButton>
    </div>
  );
}
