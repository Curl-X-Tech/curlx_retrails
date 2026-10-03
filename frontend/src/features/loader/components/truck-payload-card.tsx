import * as React from "react";
import {
  TruckIcon,
  SnowflakeIcon,
  ArrowsLeftRightIcon,
  PrinterIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  VehicleCargoVisualizer,
  type VehicleVisualizerData,
  SwipeToConfirm,
  HoldToConfirmButton,
} from "@/components/shared";
import { TruckCountdownBar } from "./truck-countdown-bar";
import { useTruckCountdown } from "../hooks/use-truck-countdown";
import type { LoaderVehicleTrip } from "../types";

interface TruckPayloadCardProps {
  trip: LoaderVehicleTrip;
  onSwitchVehicle?: () => void;
  onConfirm?: () => void;
}

export function TruckPayloadCard({
  trip,
  onSwitchVehicle,
  onConfirm,
}: TruckPayloadCardProps) {
  const [visualizerMode, setVisualizerMode] = React.useState<"weight" | "volume">(
    "weight"
  );
  const { driver, payload, imagePath, type } = trip;
  const initialMinutes = trip.departureCountdownMinutes || 38;
  const { timeString, isCritical, isWarning } = useTruckCountdown(
    initialMinutes,
    trip.id
  );

  const visualizerData: VehicleVisualizerData = {
    vehicleCategory: type === "van" ? "van" : "lorry",
    weightPercentage: payload.percentage,
    volumePercentage: Math.min(Math.round(payload.percentage * 0.95), 100),
    imageUrl: imagePath,
    code: trip.regNumber,
    allocatedWeightKg: payload.currentKg,
    maxWeightKg: payload.maxKg,
    allocatedVolumeCbm: payload.currentVolumeM3 ?? 22.4,
    maxVolumeCbm: payload.maxVolumeM3 ?? 28.0,
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <Card className="flex flex-col p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card shadow-xs gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TruckIcon className="size-5.5" weight="bold" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight">
                  # {trip.regNumber}
                </span>
                {trip.temp === "reefer" && (
                  <SnowflakeIcon className="size-4 text-sky-500 shrink-0" />
                )}
                <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">
                  {trip.stopsCount} Stops
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {trip.modelName} ·{" "}
                <strong className="text-foreground">{trip.depotName}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="size-8.5 p-0 rounded-xl border-border/80 hover:bg-accent cursor-pointer shadow-xs"
              title="Print Loading Manifest"
              aria-label="Print Loading Manifest"
            >
              <PrinterIcon className="size-4 text-foreground" />
            </Button>
            {onSwitchVehicle && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchVehicle}
                className="h-8.5 px-2.5 rounded-xl text-xs font-semibold border-border/80 hover:bg-accent gap-1.5 shadow-xs cursor-pointer"
              >
                <ArrowsLeftRightIcon className="size-3.5 text-primary" />
                <span>Switch</span>
              </Button>
            )}
          </div>
        </div>

        <TruckCountdownBar
          departureTime={trip.plannedDepartureTime}
          timeString={timeString}
          isCritical={isCritical}
          isWarning={isWarning}
        />

        <div className="flex items-center gap-2.5 pt-1 border-t border-border/60">
          <div className="flex size-6.5 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-heading font-black text-[11px]">
            {driver.avatarInitials}
          </div>
          <div className="flex items-center justify-between min-w-0 flex-1">
            <span className="text-xs font-heading font-bold text-foreground truncate">
              {driver.name}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground truncate">
              {driver.licenseId}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-2.5 sm:p-3 bg-card rounded-2xl border border-border/80 shadow-xs flex flex-col justify-center min-w-0">
        <VehicleCargoVisualizer
          vehicle={visualizerData}
          mode={visualizerMode}
          onToggleMode={setVisualizerMode}
          size="compact"
        />
      </Card>

      <div className="flex flex-col gap-2 w-full pt-0.5">
        <SwipeToConfirm
          onConfirm={() => onConfirm?.()}
          label="Slide to Confirm Loading"
          confirmedLabel="Loading Confirmed"
        />
        <HoldToConfirmButton
          label="Hold to Confirm Bay Departure"
          onConfirmed={() => onConfirm?.()}
          durationMs={700}
          className="w-full text-xs font-bold"
        />
      </div>
    </div>
  );
}
