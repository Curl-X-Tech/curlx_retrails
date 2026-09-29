import * as React from "react";
import {
  CaretLeftIcon,
  CaretRightIcon,
  CrosshairIcon,
  PhoneIcon,
  UserIcon,
  XIcon,
  MapPinIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import type { VehicleTrackingData } from "@/data/mock-live-map";
import { VehicleCargoVisualizer } from "./vehicle-cargo-visualizer";

interface LiveVehicleCardProps {
  vehicle: VehicleTrackingData;
  allVehicles: VehicleTrackingData[];
  onSelectVehicle: (vehicle: VehicleTrackingData) => void;
  onFocusVehicle: (vehicle: VehicleTrackingData) => void;
  onClose?: () => void;
}

export function LiveVehicleCard({
  vehicle,
  allVehicles,
  onSelectVehicle,
  onFocusVehicle,
  onClose,
}: LiveVehicleCardProps) {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [cargoMode, setCargoMode] = React.useState<"weight" | "volume">("weight");

  const currentIndex = allVehicles.findIndex((v) => v.id === vehicle.id);

  const handlePrev = () => {
    if (allVehicles.length <= 1) return;
    const nextIdx = (currentIndex - 1 + allVehicles.length) % allVehicles.length;
    onSelectVehicle(allVehicles[nextIdx]);
  };

  const handleNext = () => {
    if (allVehicles.length <= 1) return;
    const nextIdx = (currentIndex + 1) % allVehicles.length;
    onSelectVehicle(allVehicles[nextIdx]);
  };

  const getStatusBadge = (status: VehicleTrackingData["status"]) => {
    switch (status) {
      case "en_route":
        return (
          <Badge variant="default" className="text-[10px] h-5 px-2 font-medium">
            En Route
          </Badge>
        );
      case "at_stop":
        return (
          <Badge variant="success" className="text-[10px] h-5 px-2 font-medium">
            At Stop
          </Badge>
        );
      case "delayed":
        return (
          <Badge variant="warning" className="text-[10px] h-5 px-2 font-medium">
            Delayed
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isMinimized) {
    return (
      <Card className="p-2.5 bg-card/95 backdrop-blur-md border-border shadow-xl rounded-2xl flex items-center gap-3 w-80 pointer-events-auto">
        <img
          src={vehicle.imageUrl}
          alt={vehicle.code}
          className="w-12 h-8 object-contain"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-heading font-bold text-xs text-foreground truncate">
              {vehicle.code}
            </span>
            {getStatusBadge(vehicle.status)}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {vehicle.driverName} • W {vehicle.weightPercentage}%
          </p>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => setIsMinimized(false)}
            title="Expand Vehicle Details"
          >
            <CaretRightIcon className="size-3.5 -rotate-90" />
          </IconButton>
          {onClose && (
            <IconButton variant="ghost" size="xs" onClick={onClose} title="Close">
              <XIcon className="size-3.5" />
            </IconButton>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-96 sm:w-[460px] bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto transition-all animate-in fade-in-50 duration-200">
      {/* Header Section with Navigation */}
      <div className="p-3.5 pb-2.5 border-b border-border/50 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-sm tracking-tight text-foreground">
              {vehicle.code}
            </h3>
            {getStatusBadge(vehicle.status)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {vehicle.vehicleType}
          </p>
        </div>

        {/* Fleet Navigation Controls */}
        <div className="flex items-center gap-1">
          <div className="flex items-center bg-muted/70 rounded-lg p-0.5 mr-1 border border-border/40">
            <IconButton
              variant="ghost"
              size="xs"
              onClick={handlePrev}
              disabled={allVehicles.length <= 1}
              className="size-5 rounded-md"
              title="Previous vehicle"
            >
              <CaretLeftIcon className="size-3" />
            </IconButton>
            <span className="text-[10px] font-bold px-1.5 text-muted-foreground tabular-nums">
              {currentIndex + 1}/{allVehicles.length}
            </span>
            <IconButton
              variant="ghost"
              size="xs"
              onClick={handleNext}
              disabled={allVehicles.length <= 1}
              className="size-5 rounded-md"
              title="Next vehicle"
            >
              <CaretRightIcon className="size-3" />
            </IconButton>
          </div>

          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => setIsMinimized(true)}
            className="size-6 text-muted-foreground hover:text-foreground"
            title="Minimize"
          >
            <CaretRightIcon className="size-3.5 rotate-90" />
          </IconButton>

          {onClose && (
            <IconButton
              variant="ghost"
              size="xs"
              onClick={onClose}
              className="size-6 text-muted-foreground hover:text-foreground"
              title="Close Card"
            >
              <XIcon className="size-3.5" />
            </IconButton>
          )}
        </div>
      </div>

      {/* Cargo Container Fill Visualizer on Vehicle Graphic */}
      <div className="p-3 bg-muted/20 border-b border-border/40">
        <VehicleCargoVisualizer
          vehicle={vehicle}
          mode={cargoMode}
          onToggleMode={(m) => setCargoMode(m)}
        />
      </div>

      {/* Operational Information */}
      <div className="p-3.5 space-y-3">
        {/* Driver Contact Row */}
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

        {/* Next Delivery Stop & Mission Progress */}
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

      {/* Action Footer */}
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
    </Card>
  );
}
