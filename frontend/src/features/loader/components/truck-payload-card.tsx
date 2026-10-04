import * as React from "react";
import { SnowflakeIcon, ArrowsLeftRightIcon, PrinterIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  VehicleCargoVisualizer,
  type VehicleVisualizerData,
  HoldToConfirmButton,
} from "@/components/shared";

import { CheckCircleIcon } from "@phosphor-icons/react";
import { TruckCountdownBar } from "./truck-countdown-bar";
import { printManifestWaybill } from "../utils/print-manifest";
import { useTruckCountdown } from "../hooks/use-truck-countdown";
import type { LoaderVehicleTrip } from "../types";

interface TruckPayloadCardProps {
  trip: LoaderVehicleTrip;
  isCompleted?: boolean;
  isDeparting?: boolean;
  onSwitchVehicle?: () => void;
  onConfirm?: () => void;
}

export function TruckPayloadCard({
  trip,
  isCompleted = false,
  isDeparting = false,
  onSwitchVehicle,
  onConfirm,
}: TruckPayloadCardProps) {
  const [visualizerMode, setVisualizerMode] = React.useState<"weight" | "volume">(
    "weight"
  );
  const { driver, payload, imagePath, type } = trip;
  const { timeString, isCritical, isWarning } = useTruckCountdown(
    trip.dispatchDate,
    trip.plannedDepartureTime,
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
      <Card className="flex flex-col p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card shadow-xs gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="font-heading font-black text-base sm:text-lg text-foreground tracking-tight">
              # {trip.regNumber}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
              <span className="font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-[10px]">
                {trip.stopsCount} Drops
              </span>
              <span>·</span>
              <span>{trip.modelName}</span>
              <span>·</span>
              <strong className="text-foreground">{trip.depotName}</strong>
              {trip.temp === "reefer" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded ml-0.5">
                  <SnowflakeIcon className="size-3 shrink-0" />
                  <span>Cold Chain</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => printManifestWaybill(trip)}
              className="size-8 p-0 rounded-xl border-border/80 hover:bg-accent cursor-pointer shadow-xs"
              title="Print Loading Manifest Waybill"
              aria-label="Print Loading Manifest Waybill"
            >
              <PrinterIcon className="size-4 text-foreground" />
            </Button>
            {onSwitchVehicle && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchVehicle}
                className="h-8 px-2.5 rounded-xl text-xs font-semibold border-border/80 hover:bg-accent gap-1.5 shadow-xs cursor-pointer"
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
        {isCompleted ? (
          <Button
            disabled
            className="w-full text-xs font-bold bg-emerald-600/90 text-white h-10 rounded-xl opacity-90 cursor-not-allowed shadow-xs gap-1.5"
          >
            <CheckCircleIcon className="size-4 shrink-0" weight="fill" />
            <span>Loading Complete · Handed Over to Driver</span>
          </Button>
        ) : (
          <HoldToConfirmButton
            label={
              isDeparting
                ? "Confirming Departure..."
                : "Hold to Confirm Bay Loading Complete"
            }
            onConfirmed={() => onConfirm?.()}
            durationMs={700}
            className="w-full text-xs font-bold bg-primary text-primary-foreground h-10 rounded-xl"
          />
        )}
      </div>
    </div>
  );
}
