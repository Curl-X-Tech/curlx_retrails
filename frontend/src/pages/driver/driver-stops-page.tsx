import { useNavigate } from "react-router-dom";
import { NavigationArrowIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockDriverTrip } from "@/data/mock-driver-trips";
import { cn } from "@/lib/utils";

export function DriverStopsPage() {
  const navigate = useNavigate();
  const trip = mockDriverTrip;

  const totalStops = trip.waypoints.length;
  const completedStops = trip.waypoints.filter((w) => w.status === "completed").length;
  const remainingStops = totalStops - completedStops;

  return (
    <div className="w-full h-full flex flex-col min-h-0 p-3.5 space-y-3 overflow-y-auto select-none bg-muted/20">
      {/* Header Summary Card */}
      <Card className="p-3.5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Run Progress
          </span>
          <h3 className="font-heading font-black text-sm text-foreground">
            {completedStops} of {totalStops} Completed
          </h3>
        </div>
        <Badge
          variant="secondary"
          className="font-heading font-bold text-xs bg-primary/10 text-primary border border-primary/30 px-2.5 py-1 rounded-xl"
        >
          {remainingStops} Stops Left
        </Badge>
      </Card>

      {/* Stop Sequence List */}
      <div className="space-y-2.5">
        {trip.waypoints.map((wp) => {
          const isCompleted = wp.status === "completed";
          const isActive = wp.status === "active";

          return (
            <Card
              key={wp.seq}
              className={cn(
                "p-3.5 rounded-2xl border transition-all space-y-2.5",
                isCompleted
                  ? "bg-emerald-500/5 border-emerald-500/30 opacity-90"
                  : isActive
                    ? "bg-card border-primary/50 shadow-md ring-1 ring-primary/30"
                    : "bg-card border-border/80"
              )}
            >
              {/* Top Row: Badge, Name, Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      "size-7 rounded-xl flex items-center justify-center font-heading font-black text-xs text-white shrink-0 shadow-xs",
                      isCompleted
                        ? "bg-emerald-600"
                        : isActive
                          ? "bg-primary"
                          : "bg-sky-700"
                    )}
                  >
                    {wp.seq}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <h4 className="font-heading font-bold text-xs text-foreground truncate">
                      {wp.outletName}
                    </h4>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {wp.address}
                    </span>
                  </div>
                </div>

                {isCompleted ? (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold shrink-0"
                  >
                    Delivered
                  </Badge>
                ) : isActive ? (
                  <Badge
                    variant="default"
                    className="bg-primary text-primary-foreground text-[10px] font-bold shrink-0 animate-pulse"
                  >
                    Active Stop
                  </Badge>
                ) : (
                  <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
                    {wp.deliveryWindow.split(" - ")[0]}
                  </span>
                )}
              </div>

              {/* Metrics & Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                  <span>{wp.totalCrateCount} Crates</span>
                  <span>·</span>
                  <span>{wp.totalWeightKg} kg</span>
                  <span>·</span>
                  <span className="capitalize">{wp.dockType.replace("_", " ")}</span>
                </div>

                <Button
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => navigate(`/driver/active?wp=${wp.seq}`)}
                  className="h-7 px-2.5 rounded-lg text-[11px] font-bold gap-1 cursor-pointer"
                >
                  <NavigationArrowIcon className="size-3" weight="bold" />
                  <span>Navigate</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
