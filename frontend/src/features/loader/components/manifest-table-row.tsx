import { ClockIcon, CalendarBlankIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { LoaderVehicleTrip } from "../types";
import { ManifestRowStatus } from "./manifest-row-status";

interface ManifestTableRowProps {
  trip: LoaderVehicleTrip;
  onOpenBay: (tripId: string) => void;
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  } catch {
    /* fallback */
  }
  return dateStr;
}

function formatTime12h(timeStr?: string): string {
  if (!timeStr) return "";
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h < 10 ? "0" : ""}${h}:${m} ${ampm}`;
  }
  return timeStr;
}

export function ManifestTableRow({ trip, onOpenBay }: ManifestTableRowProps) {
  const isReady = trip.status === "ready";
  const isFlagged = trip.status === "flagged";
  const isLoadingActive = trip.status === "loading";
  const formattedDate = formatDisplayDate(trip.dispatchDate);
  const formattedPlannedTime = formatTime12h(trip.plannedDepartureTime);

  return (
    <TableRow
      className={cn(
        "transition-colors hover:bg-accent/30",
        isFlagged && "bg-amber-500/5 hover:bg-amber-500/10"
      )}
    >
      <TableCell className="py-2.5 pl-3.5 pr-2 align-middle relative">
        <span
          className={cn(
            "absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r",
            isLoadingActive && "bg-primary",
            (isReady || trip.status === "dispatched") &&
              "bg-emerald-600 dark:bg-emerald-500",
            isFlagged && "bg-amber-600 dark:bg-amber-500"
          )}
        />
        <Badge
          variant="secondary"
          className="font-heading font-black text-xs px-2 py-0.5 rounded-lg border border-border bg-accent text-foreground shrink-0"
        >
          {trip.dockBay}
        </Badge>
      </TableCell>

      <TableCell className="py-2.5 align-middle">
        <span
          className="font-heading font-black text-xs sm:text-sm text-foreground truncate block"
          title={trip.tripCode}
        >
          {trip.tripCode}
        </span>
      </TableCell>

      <TableCell className="py-2.5 align-middle">
        <div className="flex flex-col min-w-0">
          <span className="font-heading font-bold text-xs text-foreground truncate">
            #{trip.regNumber}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground truncate">
            {trip.driver.name}
          </span>
        </div>
      </TableCell>

      <TableCell className="py-2.5 align-middle">
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-xs font-bold text-foreground">
            <ClockIcon className="size-3.5 text-primary" weight="bold" />
            <span>{formattedPlannedTime}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground mt-0.5">
            <CalendarBlankIcon className="size-3 text-muted-foreground shrink-0" />
            <span>{formattedDate || "Today"}</span>
          </div>
        </div>
      </TableCell>

      <TableCell className="py-2.5 align-middle">
        <ManifestRowStatus trip={trip} />
      </TableCell>

      <TableCell className="py-2.5 align-middle text-right">
        <Button
          variant={isLoadingActive ? "default" : "secondary"}
          size="sm"
          onClick={() => onOpenBay(trip.id)}
          className="h-8 px-3 rounded-xl text-xs font-bold cursor-pointer shadow-xs"
        >
          {isLoadingActive ? "Open Bay" : "View"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
