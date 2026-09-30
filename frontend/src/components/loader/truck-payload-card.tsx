import * as React from "react";
import {
  PrinterIcon,
  WarningIcon,
  TruckIcon,
  SnowflakeIcon,
  ArrowsLeftRightIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  VehicleCargoVisualizer,
  type VehicleVisualizerData,
  SwipeToConfirm,
} from "@/components/shared";
import type { LoaderVehicleTrip } from "@/data/mock-loader-bays";

interface TruckPayloadCardProps {
  trip: LoaderVehicleTrip;
  onSwitchVehicle?: () => void;
  onPrint?: () => void;
  onFlagIssue?: () => void;
  onConfirm?: () => void;
}

export function TruckPayloadCard({
  trip,
  onSwitchVehicle,
  onPrint,
  onFlagIssue,
  onConfirm,
}: TruckPayloadCardProps) {
  const [visualizerMode, setVisualizerMode] = React.useState<"weight" | "volume">(
    "weight"
  );
  const { driver, payload, imagePath, type } = trip;

  const visualizerData: VehicleVisualizerData = {
    vehicleCategory: type === "van" ? "van" : "lorry",
    weightPercentage: payload.percentage,
    volumePercentage: Math.min(Math.round(payload.percentage * 0.95), 100),
    imageUrl: imagePath,
    code: trip.regNumber,
    allocatedWeightKg: payload.currentKg,
    maxWeightKg: payload.maxKg,
    allocatedVolumeCbm: 22.4,
    maxVolumeCbm: 28.0,
  };

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Detail Card & Payload Card in 2-Col Grid on Portrait Tablets (portrait:grid-cols-2), 1-Col on Landscape (lg:grid-cols-1) */}
      <div className="grid grid-cols-1 md:portrait:grid-cols-2 lg:grid-cols-1 gap-3.5 items-stretch">
        {/* Left Column: Active Vehicle Info & Driver Profile */}
        <div className="flex flex-col gap-3.5 h-full">
          {/* Active Vehicle Info Card */}
          <Card className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TruckIcon className="size-6" weight="bold" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight">
                    # {trip.regNumber}
                  </span>
                  {trip.temp === "reefer" && (
                    <SnowflakeIcon className="size-4 text-sky-500 shrink-0" />
                  )}
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-bold px-2 py-0.5"
                  >
                    {trip.stopsCount} Stops
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {trip.modelName} ·{" "}
                  <strong className="text-foreground">{trip.depotName}</strong>
                </span>
              </div>
            </div>

            {onSwitchVehicle && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchVehicle}
                className="h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold border-border/80 hover:bg-accent gap-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                <ArrowsLeftRightIcon className="size-3.5 text-primary" />
                <span>Switch</span>
              </Button>
            )}
          </Card>

          {/* Driver Profile Card */}
          <Card className="flex flex-1 items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card shadow-xs">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-heading font-black text-base">
              {driver.avatarInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-heading font-bold text-foreground truncate">
                {driver.name}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {driver.designation}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground/80 truncate">
                {driver.licenseId}
              </span>
            </div>
          </Card>
        </div>

        {/* Right Column: Shared Vehicle Cargo Visualizer Card */}
        <Card className="p-3.5 sm:p-4 bg-card rounded-2xl border border-border/80 shadow-xs flex flex-col justify-center min-w-0 h-full">
          <VehicleCargoVisualizer
            vehicle={visualizerData}
            mode={visualizerMode}
            onToggleMode={setVisualizerMode}
            size="md"
          />
        </Card>
      </div>

      {/* Action Buttons & Swipe to Confirm in Grid */}
      <div className="grid grid-cols-1 md:portrait:grid-cols-2 lg:grid-cols-1 gap-2.5 w-full">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Print Manifest */}
          <Button
            variant="outline"
            size="lg"
            onClick={onPrint}
            className="h-12 rounded-xl text-xs sm:text-sm font-semibold border-border/80 hover:bg-accent gap-1.5 cursor-pointer shadow-xs"
          >
            <PrinterIcon className="size-4" />
            Print Manifest
          </Button>

          {/* Flag Issue (Red Danger) */}
          <Button
            variant="destructive"
            size="lg"
            onClick={onFlagIssue}
            className="h-12 rounded-xl text-xs sm:text-sm font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-1.5 shadow-xs cursor-pointer"
          >
            <WarningIcon className="size-4" />
            Flag Issue
          </Button>
        </div>

        {/* Swipable Confirm Loading Slider */}
        <SwipeToConfirm
          onConfirm={() => onConfirm?.()}
          label="Slide to Confirm Loading"
          confirmedLabel="Loading Confirmed"
        />
      </div>
    </div>
  );
}
