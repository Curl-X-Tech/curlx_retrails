import * as React from "react";
import { CaretDownIcon, CrosshairIcon, XIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import type { VehicleTrackingData } from "@/data/mock-live-map";
import { VehicleCargoVisualizer } from "@/components/shared";
import { LiveVehicleDriverInfo } from "./live-vehicle-driver-info";

interface LiveVehicleCardProps {
  vehicle: VehicleTrackingData;
  allVehicles: VehicleTrackingData[];
  onSelectVehicle: (vehicle: VehicleTrackingData) => void;
  onFocusVehicle: (vehicle: VehicleTrackingData) => void;
  onClose?: () => void;
}

export function LiveVehicleCard({
  vehicle,
  onFocusVehicle,
  onClose,
}: LiveVehicleCardProps) {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [cargoMode, setCargoMode] = React.useState<"weight" | "volume">("weight");

  const getStatusBadge = (status: VehicleTrackingData["status"]) => {
    switch (status) {
      case "en_route":
        return (
          <Badge variant="default" className="text-[10px] h-5 px-2 font-semibold">
            En Route
          </Badge>
        );
      case "at_stop":
        return (
          <Badge variant="success" className="text-[10px] h-5 px-2 font-semibold">
            At Stop
          </Badge>
        );
      case "delayed":
        return (
          <Badge variant="warning" className="text-[10px] h-5 px-2 font-semibold">
            Delayed
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-96 sm:w-[460px] max-w-[calc(100vw-2rem)] bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto transition-all duration-300">
      <div className="p-3.5 pb-2.5 border-b border-border/50 flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-sm tracking-tight text-foreground">
            {vehicle.code}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {vehicle.vehicleType}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {getStatusBadge(vehicle.status)}

          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => setIsMinimized(!isMinimized)}
            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg transition-transform duration-200"
            title={isMinimized ? "Expand Vehicle Details" : "Collapse Card"}
          >
            <CaretDownIcon
              className={cn(
                "size-4 transition-transform duration-300 ease-in-out",
                isMinimized ? "-rotate-90 text-primary" : "rotate-0"
              )}
            />
          </IconButton>

          {onClose && (
            <IconButton
              variant="ghost"
              size="xs"
              onClick={onClose}
              className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
              title="Close Card"
            >
              <XIcon className="size-3.5" />
            </IconButton>
          )}
        </div>
      </div>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out overflow-hidden w-full max-w-full",
          isMinimized ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        )}
      >
        <div className="min-h-0 min-w-0 flex flex-col w-full max-w-full overflow-hidden">
          <div className="p-3 bg-muted/20 border-b border-border/40 overflow-hidden w-full max-w-full min-w-0">
            <VehicleCargoVisualizer
              vehicle={vehicle}
              mode={cargoMode}
              onToggleMode={(m) => setCargoMode(m)}
            />
          </div>

          <LiveVehicleDriverInfo vehicle={vehicle} />

          <div className="p-2.5 pt-0 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs font-medium gap-1.5 cursor-pointer rounded-xl bg-background"
              onClick={() => onFocusVehicle(vehicle)}
            >
              <CrosshairIcon className="size-3.5 text-primary" />
              <span>Focus on Map</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
