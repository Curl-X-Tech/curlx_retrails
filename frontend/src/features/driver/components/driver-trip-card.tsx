import {
  DownloadSimpleIcon,
  CheckCircleIcon,
  NavigationArrowIcon,
  MapPinIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LocalTripSummary } from "../types";

interface DriverTripCardProps {
  trip: LocalTripSummary;
  isDownloading: boolean;
  onOpenTrip: () => void;
  onDownloadTrip: () => void;
}

export function DriverTripCard({
  trip,
  isDownloading,
  onOpenTrip,
  onDownloadTrip,
}: DriverTripCardProps) {
  return (
    <Card className="border-border overflow-hidden shadow-sm hover:border-primary/50 transition-colors">
      <CardHeader className="p-4 pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
              {trip.tripCode}
            </span>
            <span className="text-xs font-semibold text-foreground">
              {trip.regNumber}
            </span>
          </div>
          {trip.isDownloaded ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircleIcon className="size-3.5" />
              Offline Ready
            </span>
          ) : (
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              Not Downloaded
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <div>
            <span className="block text-[10px] uppercase text-muted-foreground/80 font-medium">
              Home Depot
            </span>
            <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
              <MapPinIcon className="size-3.5 text-primary" />
              {trip.depotName}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-muted-foreground/80 font-medium">
              Total Stops
            </span>
            <span className="font-semibold text-foreground block mt-0.5">
              {trip.totalStops} Store Outlets
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
          <span>Payload: {trip.totalWeightKg.toLocaleString()} kg</span>
          <span>Volume: {trip.totalVolumeM3} m³</span>
        </div>

        <div className="pt-1">
          {trip.isDownloaded ? (
            <Button
              onClick={onOpenTrip}
              className="w-full gap-2 font-semibold text-xs cursor-pointer"
            >
              <NavigationArrowIcon weight="bold" className="size-4" />
              Open Active Trip Navigation
            </Button>
          ) : (
            <Button
              onClick={onDownloadTrip}
              disabled={isDownloading}
              variant="default"
              className="w-full gap-2 font-semibold text-xs cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <ArrowsClockwiseIcon className="size-4 animate-spin" />
                  Downloading Trip & Offline Manifests...
                </>
              ) : (
                <>
                  <DownloadSimpleIcon weight="bold" className="size-4" />
                  Download Trip (Enable Offline Mode)
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
