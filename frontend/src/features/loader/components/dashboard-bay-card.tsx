import { useNavigate } from "react-router-dom";
import { SnowflakeIcon, CaretRightIcon, ClockIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BayWithManifest } from "@/api/loader/types";

interface DashboardBayCardProps {
  bayData: BayWithManifest;
}

export function DashboardBayCard({ bayData }: DashboardBayCardProps) {
  const navigate = useNavigate();
  const { bay, vehicle, driver, trip, progress } = bayData;

  const pct =
    progress.total_items_count > 0
      ? Math.round((progress.verified_items_count / progress.total_items_count) * 100)
      : 0;

  const isComplete =
    progress.total_items_count > 0 &&
    progress.verified_items_count === progress.total_items_count;

  return (
    <Card className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 px-2.5 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-heading font-black text-xs">
            {bay.bay_number}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-sm text-foreground truncate">
                {vehicle.reg_number}
              </span>
              {vehicle.temp === "reefer" && (
                <SnowflakeIcon className="size-3.5 text-sky-500 shrink-0" />
              )}
            </div>
            <span className="text-[11px] text-muted-foreground truncate">
              {trip.trip_code} · {trip.stops_count} Stops
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] font-bold">
          <span
            className={cn(
              "size-2 rounded-full shrink-0",
              bay.dock_status === "verified_sealed" && "bg-emerald-500",
              bay.dock_status === "docked_loading" && "bg-sky-500",
              bay.dock_status === "departed" && "bg-muted-foreground"
            )}
          />
          <span className="text-muted-foreground uppercase tracking-wider">
            {bay.dock_status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 bg-muted/30 p-2.5 rounded-xl border border-border/50 text-xs">
        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
          <span className="flex items-center gap-1">
            <ClockIcon className="size-3" />
            <span>ETD: {trip.planned_departure_time || "06:00"}</span>
          </span>
          <span className="font-semibold text-foreground">
            {progress.verified_crates_count} / {progress.total_crates_count} Crates
          </span>
        </div>

        <div className="h-1.5 w-full bg-muted/80 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isComplete ? "bg-emerald-500" : "bg-primary"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
          <span>Driver: {driver.name || "Unassigned"}</span>
          <span>{pct}% Loaded</span>
        </div>
      </div>

      <Button
        variant="default"
        size="sm"
        onClick={() => navigate(`/loader/bays?tripId=${trip.id}`)}
        className="w-full h-8.5 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
      >
        <span>Enter Station Checklist</span>
        <CaretRightIcon className="size-3.5" weight="bold" />
      </Button>
    </Card>
  );
}
