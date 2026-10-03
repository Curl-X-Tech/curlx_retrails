import { NavigationArrowIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DriverWaypoint, LocalTripStop } from "../types";

interface DriverStopCardProps {
  waypoint: DriverWaypoint | LocalTripStop;
  onNavigateToMap: () => void;
  onNavigateToUnload: () => void;
}

export function DriverStopCard({
  waypoint: wp,
  onNavigateToMap,
  onNavigateToUnload,
}: DriverStopCardProps) {
  const isCompleted = wp.status === "completed";
  const isActive = wp.status === "active";

  return (
    <Card
      className={cn(
        "p-3.5 rounded-2xl border transition-all space-y-2.5",
        isCompleted
          ? "bg-emerald-500/5 border-emerald-500/30 opacity-90"
          : isActive
            ? "bg-card border-primary/50 shadow-md ring-1 ring-primary/30"
            : "bg-card border-border/80"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={cn(
              "size-7 rounded-xl flex items-center justify-center font-heading font-black text-xs text-white shrink-0 shadow-xs",
              isCompleted ? "bg-emerald-600" : isActive ? "bg-primary" : "bg-sky-700"
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
          <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
            <CheckCircleIcon className="size-3" weight="fill" />
            Delivered
          </span>
        ) : isActive ? (
          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
            Active Stop
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
            {wp.deliveryWindow.split(" - ")[0]}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-medium">
          <span>{wp.totalCrateCount} Crates</span>
          <span>·</span>
          <span>{wp.totalWeightKg} kg</span>
          <span>·</span>
          <span>{wp.deliveryWindow}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={onNavigateToMap}
            className="h-7 px-2 rounded-lg text-[11px] font-bold gap-1 cursor-pointer"
          >
            <NavigationArrowIcon className="size-3" weight="bold" />
            <span>Map</span>
          </Button>
          <Button
            size="sm"
            variant={isActive ? "default" : "secondary"}
            onClick={onNavigateToUnload}
            className={cn(
              "h-7 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer",
              isActive && "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            <span>{isCompleted ? "Manifest" : "Unload"}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
