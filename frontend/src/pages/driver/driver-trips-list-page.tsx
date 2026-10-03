import * as React from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useDriverTripsList, DriverTripCard } from "@/features/driver";

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
          <div className="space-y-3">
            {trips.map((trip) => (
              <DriverTripCard
                key={trip.id}
                trip={trip}
                isDownloading={downloadingTripId === trip.id}
                onOpenTrip={() => navigate("/driver/active")}
                onDownloadTrip={() => handleDownloadAndStart(trip.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
