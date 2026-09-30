import { TruckIcon, MapPinIcon, SnowflakeIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VehicleAllocation } from "@/data/mock-allocations";

interface AllocationManifestCardProps {
  allocation: VehicleAllocation;
  isSelected?: boolean;
  onSelect?: (allocation: VehicleAllocation) => void;
  className?: string;
}

export function AllocationManifestCard({
  allocation,
  isSelected = false,
  onSelect,
  className,
}: AllocationManifestCardProps) {
  const isColdChain =
    allocation.temperatureZone === "frozen" ||
    allocation.temperatureZone === "chilled" ||
    allocation.vehicleCategory === "freeze_lorry";

  const nextStopName = allocation.assignedStops[0]?.name || "Waypoint Fresh Wattala";

  return (
    <Card
      onClick={() => onSelect?.(allocation)}
      className={cn(
        "relative bg-card rounded-2xl p-4 overflow-hidden select-none cursor-pointer transition-all duration-150 min-h-[160px] flex flex-col justify-between",
        isSelected
          ? "border-2 border-neutral-400 dark:border-neutral-400 shadow-sm bg-card"
          : "border border-border/80 hover:border-border hover:shadow-xs",
        className
      )}
    >
      {/* Right Side Cropped Vehicle Asset (Front cab visible, rear 50% pushed outside right boundary) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[45%] w-52 sm:w-60 h-32 pointer-events-none flex items-center justify-start select-none">
        <img
          src={allocation.imageUrl}
          alt={allocation.plateNumber}
          className="h-full w-auto object-contain drop-shadow-sm select-none pointer-events-none"
          loading="lazy"
        />
      </div>

      {/* Left Content Column */}
      <div className="relative z-10 max-w-[62%] sm:max-w-[65%] space-y-3">
        {/* Header: Plate Number + Cold-Chain Badge & Model */}
        <div className="leading-tight">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight">
              # {allocation.plateNumber}
            </span>
            {isColdChain && (
              <div className="size-4 rounded-full bg-[#0070BA] flex items-center justify-center text-white shrink-0 shadow-xs">
                <SnowflakeIcon weight="bold" className="size-2.5" />
              </div>
            )}
          </div>
          <p className="text-xs font-semibold text-foreground/80 mt-0.5 truncate">
            {allocation.vehicleModel}
          </p>
        </div>

        {/* Origin Depot -> Stops Pill -> Next Stop Sequence */}
        <div className="space-y-1.5 text-xs">
          {/* Origin Stop: Blue Truck Icon + Hub Name */}
          <div className="flex items-center gap-2">
            <TruckIcon className="size-4 text-[#0070BA] shrink-0" weight="regular" />
            <span className="font-medium text-foreground truncate text-[11px] sm:text-xs">
              {allocation.hubName}
            </span>
          </div>

          {/* Vertical Connector Path with Blue Pill Badge */}
          <div className="flex items-center pl-[7px]">
            <div className="h-5 border-l border-dashed border-border flex items-center">
              <Badge className="bg-[#0070BA] hover:bg-[#0070BA] text-white text-[9px] font-bold px-2 py-0.2 rounded-full ml-2 shrink-0 shadow-xs">
                {allocation.assignedStops.length} Stops
              </Badge>
            </div>
          </div>

          {/* Next Destination Stop: Filled Black MapPin Icon + Stop Name */}
          <div className="flex items-center gap-2">
            <MapPinIcon className="size-4 text-foreground shrink-0" weight="fill" />
            <span className="font-medium text-foreground truncate text-[11px] sm:text-xs">
              {nextStopName}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
