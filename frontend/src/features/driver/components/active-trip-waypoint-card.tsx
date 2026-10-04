import {
  CheckCircleIcon,
  NavigationArrowIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DriverWaypoint } from "../types";

interface ActiveTripWaypointCardProps {
  waypoints: DriverWaypoint[];
  currentWp: DriverWaypoint;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelectIndex: (index: number) => void;
  onNavigateToUnload: () => void;
  onGetDirections: () => void;
}

export function ActiveTripWaypointCard({
  waypoints,
  currentWp,
  currentIndex,
  onPrev,
  onNext,
  onSelectIndex,
  onNavigateToUnload,
  onGetDirections,
}: ActiveTripWaypointCardProps) {
  const outletName =
    (currentWp as { outletName?: string }).outletName ||
    currentWp.outlet_name ||
    "Outlet";
  const deliveryWindow =
    (currentWp as { deliveryWindow?: string }).deliveryWindow ||
    currentWp.delivery_window ||
    "Standard";
  const totalWeight =
    (currentWp as { totalWeightKg?: number }).totalWeightKg ??
    currentWp.order_summary?.total_weight_kg ??
    0;
  const totalCrates =
    (currentWp as { totalCrateCount?: number }).totalCrateCount ??
    currentWp.order_summary?.total_crate_count ??
    0;
  const dockType =
    (currentWp as { dockType?: string }).dockType || currentWp.dock_type || "rear_dock";
  const stagingLocation =
    (currentWp as { stagingLocation?: string }).stagingLocation ||
    `Dock ${currentWp.seq}`;

  const isCompleted = currentWp.status === "completed";
  const isActive = currentWp.status === "arrived" || currentWp.status === "pending";

  return (
    <Card className="rounded-3xl p-4 bg-background/95 backdrop-blur-xl border border-border/90 shadow-2xl space-y-3.5">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "size-8 rounded-xl flex items-center justify-center font-heading font-black text-sm text-white shrink-0 shadow-xs",
            isCompleted ? "bg-emerald-600" : isActive ? "bg-primary" : "bg-sky-700"
          )}
        >
          {currentWp.seq}
        </span>
        <div className="flex flex-col min-w-0">
          <h3 className="font-heading font-black text-base text-foreground truncate leading-tight">
            {outletName}
          </h3>
          <span className="text-[11px] font-semibold text-muted-foreground truncate">
            Window: {deliveryWindow}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Button
          onClick={onNavigateToUnload}
          className={cn(
            "h-10 rounded-2xl font-bold text-xs gap-2 shadow-xs transition-all cursor-pointer",
            isCompleted
              ? "bg-muted text-muted-foreground hover:bg-muted"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          )}
        >
          <CheckCircleIcon className="size-4" weight="fill" />
          <span>{isCompleted ? "View Checklist" : "Arrived"}</span>
        </Button>

        <Button
          onClick={onGetDirections}
          className="h-10 rounded-2xl font-bold text-xs gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all cursor-pointer"
        >
          <NavigationArrowIcon className="size-4" weight="fill" />
          <span>Get Direction</span>
        </Button>
      </div>

      <div className="pt-1">
        <p className="font-heading font-black text-sm text-foreground leading-snug">
          {currentWp.address}
        </p>
      </div>

      <div className="border-t border-border/70 divide-y divide-border/60 text-xs">
        <div className="py-2 flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Total Weight</span>
          <strong className="font-heading font-bold text-foreground">
            {totalWeight} kg
          </strong>
        </div>

        <div className="py-2 flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Pallets / Crates</span>
          <strong className="font-heading font-bold text-primary">
            {totalCrates} Crates
          </strong>
        </div>

        <div className="py-2 flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Staging Location</span>
          <span className="font-semibold text-muted-foreground">
            {stagingLocation} ({dockType.replace("_", " ")})
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/70">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="size-8 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Previous Waypoint"
        >
          <CaretLeftIcon className="size-5" weight="bold" />
        </button>

        <div className="flex items-center gap-1.5">
          {waypoints.map((wp, idx) => (
            <button
              key={wp.seq}
              onClick={() => onSelectIndex(idx)}
              className={cn(
                "transition-all rounded-full cursor-pointer",
                idx === currentIndex
                  ? "w-6 h-2 bg-primary"
                  : wp.status === "completed"
                    ? "size-2 bg-emerald-600"
                    : "size-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Go to Waypoint ${wp.seq}`}
            />
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={currentIndex === waypoints.length - 1}
          className="size-8 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Next Waypoint"
        >
          <CaretRightIcon className="size-5" weight="bold" />
        </button>
      </div>
    </Card>
  );
}
