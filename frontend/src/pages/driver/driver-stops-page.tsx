import { useNavigate } from "react-router-dom";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useOfflineActiveTrip,
  DriverStopCard,
  type DriverWaypoint,
  type LocalTripStop,
} from "@/features/driver";

export function DriverStopsPage() {
  const navigate = useNavigate();
  const { stops, isDownloaded, tripDetail } = useOfflineActiveTrip();

  const waypoints: (DriverWaypoint | LocalTripStop)[] =
    isDownloaded && stops.length > 0 ? stops : tripDetail.waypoints;

  const totalStops = waypoints.length;
  const completedStops = waypoints.filter((w) => w.status === "completed").length;
  const remainingStops = totalStops - completedStops;

  return (
    <div className="w-full h-full flex flex-col min-h-0 p-3.5 space-y-3 overflow-y-auto select-none bg-muted/20">
      <Card className="p-3.5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Run Progress (Trip {tripDetail.tripCode})
          </span>
          <h3 className="font-heading font-black text-sm text-foreground">
            {completedStops} of {totalStops} Completed
          </h3>
        </div>
        <span className="font-heading font-bold text-xs bg-primary/10 text-primary border border-primary/30 px-2.5 py-1 rounded-xl">
          {remainingStops} Stops Left
        </span>
      </Card>

      {!isDownloaded && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <span className="text-amber-700 dark:text-amber-400 font-medium">
            Trip not downloaded to offline cache.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/driver/trips")}
            className="h-7 text-xs font-semibold gap-1 cursor-pointer"
          >
            <DownloadSimpleIcon className="size-3.5" />
            Download
          </Button>
        </div>
      )}

      <div className="space-y-2.5">
        {waypoints.map((wp) => (
          <DriverStopCard
            key={wp.seq}
            waypoint={wp}
            onNavigateToMap={() => navigate(`/driver/active?wp=${wp.seq}`)}
            onNavigateToUnload={() => navigate(`/driver/unload?wp=${wp.seq}`)}
          />
        ))}
      </div>
    </div>
  );
}
