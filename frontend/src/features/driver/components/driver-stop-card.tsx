import { NavigationArrowIcon, CheckCircleIcon, ClockIcon } from "@phosphor-icons/react";
import { useLiveQuery } from "dexie-react-hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { db } from "@/lib/dexie-db";
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
  const isActive = (wp.status as string) === "active" || wp.status === "arrived";

  const outletName =
    (wp as { outletName?: string }).outletName ||
    (wp as { outlet_name?: string }).outlet_name ||
    "Outlet";
  const address = wp.address || "";
  const deliveryWindow =
    (wp as { deliveryWindow?: string }).deliveryWindow ||
    (wp as { delivery_window?: string }).delivery_window ||
    "Schedule";
  const totalCrates =
    (wp as { totalCrateCount?: number }).totalCrateCount ??
    (wp as { order_summary?: { total_crate_count: number } }).order_summary
      ?.total_crate_count ??
    0;
  const totalWeight =
    (wp as { totalWeightKg?: number }).totalWeightKg ??
    (wp as { order_summary?: { total_weight_kg: number } }).order_summary
      ?.total_weight_kg ??
    0;
  const legId =
    (wp as { route_leg_id?: string }).route_leg_id ||
    (wp as { id?: string }).id ||
    String(wp.seq);

  const queuedMutations = useLiveQuery(
    () => db.mutationQueue.where("status").anyOf(["queued", "sending"]).toArray(),
    []
  );

  const isQueued = queuedMutations?.some(
    (m) =>
      m.payload?.waypoint_id === legId ||
      m.payload?.route_leg_id === legId ||
      m.payload?.seq === wp.seq
  );

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
              {outletName}
            </h4>
            <span className="text-[11px] text-muted-foreground truncate">{address}</span>
          </div>
        </div>

        {isQueued ? (
          <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
            <ClockIcon className="size-3" weight="bold" />
            Queued, will sync
          </span>
        ) : isCompleted ? (
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
            {deliveryWindow.split(" - ")[0]}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-medium">
          <span>{totalCrates} Crates</span>
          <span>·</span>
          <span>{totalWeight} kg</span>
          <span>·</span>
          <span>{deliveryWindow}</span>
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
