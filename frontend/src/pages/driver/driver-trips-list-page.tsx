import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  DownloadSimpleIcon,
  CheckCircleIcon,
  NavigationArrowIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDriverTripsList } from "@/hooks/use-offline-trip";
import { useAuth } from "@/context/auth-context";

export function DriverTripsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trips, isLoading, downloadTrip } = useDriverTripsList();
  const [downloadingTripId, setDownloadingTripId] = React.useState<string | null>(null);

  const handleDownloadAndStart = async (tripId: string) => {
    setDownloadingTripId(tripId);
    const success = await downloadTrip(tripId);
    setDownloadingTripId(null);
    if (success) {
      navigate("/driver/active");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground overflow-y-auto">
      {/* 1. Header Profile Banner */}
      <div className="p-4 border-b border-border bg-card/60">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground block uppercase">
              Field Driver Console
            </span>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              {user?.name || "Sunil Shantha"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              License: B-904128 · Heavy Commercial
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="p-4 space-y-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Assigned Trips Today
          </span>
          <span className="text-xs text-muted-foreground font-semibold">
            {new Date().toISOString().split("T")[0]}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-36 rounded-xl bg-muted/40 animate-pulse" />
            <div className="h-36 rounded-xl bg-muted/40 animate-pulse" />
          </div>
        ) : trips.length === 0 ? (
          /* Empty State: No trips found for the day */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-border bg-card/30 my-auto">
            <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
              <CalendarIcon weight="duotone" className="size-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              No trips found for the day
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
              You currently have no dispatched delivery routes assigned for today. New
              routes will appear here once dispatchers finalize vehicle allocations.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-5 gap-2 text-xs font-semibold"
            >
              <ArrowsClockwiseIcon className="size-3.5" />
              Check for Dispatches
            </Button>
          </div>
        ) : (
          /* Assigned Trips List */
          <div className="space-y-3">
            {trips.map((trip) => {
              const isDownloading = downloadingTripId === trip.id;

              return (
                <Card
                  key={trip.id}
                  className="border-border overflow-hidden shadow-sm hover:border-primary/50 transition-colors"
                >
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
                          onClick={() => navigate("/driver/active")}
                          className="w-full gap-2 font-semibold text-xs cursor-pointer"
                        >
                          <NavigationArrowIcon weight="bold" className="size-4" />
                          Open Active Trip Navigation
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleDownloadAndStart(trip.id)}
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
