import * as React from "react";
import { PlusIcon, MinusIcon, CrosshairIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import type {
  AllocationWaypoint,
  AllocationVehiclePosition,
} from "@/data/mock-allocation-details";
import { useRouteMap } from "./use-route-map";

interface AllocationRouteMapProps {
  waypoints: AllocationWaypoint[];
  vehiclePosition?: AllocationVehiclePosition;
  vehicleUnitId?: string;
  vehicleModel?: string;
  driverName?: string;
  className?: string;
}

export function AllocationRouteMap({
  waypoints,
  vehiclePosition,
  vehicleUnitId = "Unit",
  vehicleModel = "truck",
  driverName,
  className,
}: AllocationRouteMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const { handleZoomIn, handleZoomOut, handleRecenter } = useRouteMap(
    mapContainerRef,
    waypoints,
    vehiclePosition,
    vehicleUnitId,
    vehicleModel,
    driverName
  );

  return (
    <Card
      className={`relative isolate overflow-hidden rounded-2xl border border-border/80 shadow-xs h-[230px] sm:h-[260px] min-w-0 ${className || ""}`}
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 bg-background/92 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-border/70 shadow-xs text-[11px] font-medium text-foreground select-none">
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[#059669]" />
          <span>Completed</span>
        </div>
        <span className="text-muted-foreground/40">•</span>
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[#0070BA]" />
          <span>Upcoming</span>
        </div>
        <span className="text-muted-foreground/40">•</span>
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[#7C3AED]" />
          <span>New Added</span>
        </div>
      </div>
      <div className="absolute right-3 bottom-3 z-10 flex flex-col gap-1 bg-card/90 backdrop-blur-md p-1 rounded-xl border border-border/80 shadow-md">
        <IconButton
          variant="ghost"
          size="xs"
          onClick={handleZoomIn}
          className="size-7 rounded-lg text-foreground hover:bg-muted cursor-pointer"
          title="Zoom in"
        >
          <PlusIcon className="size-3.5" weight="bold" />
        </IconButton>
        <IconButton
          variant="ghost"
          size="xs"
          onClick={handleZoomOut}
          className="size-7 rounded-lg text-foreground hover:bg-muted cursor-pointer"
          title="Zoom out"
        >
          <MinusIcon className="size-3.5" weight="bold" />
        </IconButton>
        <IconButton
          variant="ghost"
          size="xs"
          onClick={handleRecenter}
          className="size-7 rounded-lg text-foreground hover:bg-muted cursor-pointer"
          title="Center map"
        >
          <CrosshairIcon className="size-3.5" weight="bold" />
        </IconButton>
      </div>
    </Card>
  );
}
