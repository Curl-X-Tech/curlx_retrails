import {
  ClockIcon,
  BoxArrowDownIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  EyeIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { LoaderVehicleTrip } from "../types";

interface ManifestTableRowProps {
  trip: LoaderVehicleTrip;
  onInspectTrip: (trip: LoaderVehicleTrip) => void;
  onOpenBay: (tripId: string) => void;
}

export function ManifestTableRow({
  trip,
  onInspectTrip,
  onOpenBay,
}: ManifestTableRowProps) {
  const isDispatched = trip.status === "dispatched";
  const isReady = trip.status === "ready";
  const isFlagged = trip.status === "flagged";
  const isLoadingActive = trip.status === "loading";

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
            isReady && "bg-emerald-600 dark:bg-emerald-500",
            isFlagged && "bg-amber-600 dark:bg-amber-500",
            isDispatched && "bg-muted-foreground/40"
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
        <div className="flex flex-col min-w-0">
          <span className="font-heading font-black text-sm text-foreground leading-tight">
            {trip.tripCode}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground truncate">
            Seal #{trip.sealNumber}
          </span>
        </div>
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
        {isDispatched ? (
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">
              Departed {trip.dispatchedAt || trip.plannedDepartureTime}
            </span>
            <span className="text-[10px] text-muted-foreground">Completed Run</span>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs font-bold text-foreground">
              <ClockIcon className="size-3.5 text-primary" weight="bold" />
              <span>{trip.plannedDepartureTime}</span>
            </div>
            <span
              className={cn(
                "text-[11px] font-semibold",
                trip.departureCountdownMinutes < 15
                  ? "text-rose-600 dark:text-rose-400 font-bold"
                  : "text-muted-foreground"
              )}
            >
              {trip.departureCountdownMinutes}m remaining
            </span>
          </div>
        )}
      </TableCell>

      <TableCell className="py-2.5 align-middle">
        <div className="flex flex-col gap-1">
          {isDispatched ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <CheckCircleIcon className="size-3.5 text-muted-foreground" weight="bold" />
              Dispatched (All Verified)
            </span>
          ) : isReady ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon className="size-3.5 text-emerald-600" weight="fill" />
              Ready for Rollout ({trip.verifiedItemsCount ?? 0}/
              {trip.totalItemsCount ?? 0})
            </span>
          ) : isFlagged ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <WarningCircleIcon className="size-3.5 text-amber-600" weight="fill" />
              Issue Flagged
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
              <BoxArrowDownIcon className="size-3.5 text-primary" weight="bold" />
              Loading ({trip.verifiedItemsCount ?? 0}/{trip.totalItemsCount ?? 0})
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            {trip.payload.currentKg} kg ({trip.payload.percentage}%) · {trip.stopsCount}{" "}
            Stops
          </span>
        </div>
      </TableCell>

      <TableCell className="py-2.5 align-middle text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onInspectTrip(trip)}
            className="size-7.5 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            title="Inspect Manifest Details"
            aria-label="Inspect Manifest Details"
          >
            <EyeIcon className="size-4" />
          </Button>
          <Button
            variant={isLoadingActive ? "default" : "secondary"}
            size="sm"
            onClick={() => onOpenBay(trip.id)}
            className="h-7.5 px-2.5 rounded-lg text-xs font-bold cursor-pointer"
          >
            {isLoadingActive ? "Open Bay" : "View"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
