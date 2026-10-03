import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useCurrentRoute, useTripProgress, DriverStopCard } from "@/features/driver";

export function DriverStopsPage() {
  const navigate = useNavigate();
  const { data: route } = useCurrentRoute();
  const progress = useTripProgress();

  const waypoints = route?.waypoints ?? [];
  const tripCode = route?.trip.trip_code || "RT-14";

  return (
    <div className="w-full h-full flex flex-col min-h-0 p-3.5 space-y-3 overflow-y-auto select-none bg-muted/20">
      <Card className="p-3.5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Run Progress (Trip {tripCode})
          </span>
          <h3 className="font-heading font-black text-sm text-foreground">
            {progress.completed_stops} of {progress.total_stops} Completed
          </h3>
        </div>
        <span className="font-heading font-bold text-xs bg-primary/10 text-primary border border-primary/30 px-2.5 py-1 rounded-xl">
          {progress.remaining_stops} Stops Left
        </span>
      </Card>

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
