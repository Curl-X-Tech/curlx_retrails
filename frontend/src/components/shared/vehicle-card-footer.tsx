import { TruckIcon, MapPinIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";

interface VehicleCardFooterProps {
  hubName: string;
  stopsCount: number;
  nextStopName: string;
}

export function VehicleCardFooter({
  hubName,
  stopsCount,
  nextStopName,
}: VehicleCardFooterProps) {
  return (
    <div className="pt-2 border-t border-border/50 space-y-1.5">
      <div className="flex items-center gap-2.5">
        <TruckIcon className="size-5 text-[#0070BA] shrink-0" weight="regular" />
        <span className="text-xs font-semibold text-foreground truncate">{hubName}</span>
      </div>

      <div className="flex items-center pl-[9px]">
        <div className="h-6 border-l-2 border-dashed border-border/80 flex items-center">
          <Badge className="bg-[#0070BA] hover:bg-[#0070BA] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full ml-3 shrink-0 shadow-xs">
            {stopsCount} Stops
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <MapPinIcon className="size-5 text-foreground shrink-0" weight="fill" />
        <span className="text-xs font-semibold text-foreground truncate">
          {nextStopName}
        </span>
      </div>
    </div>
  );
}
