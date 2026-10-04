import {
  BoxArrowDownIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import type { LoaderVehicleTrip } from "../types";

export function ManifestRowStatus({ trip }: { trip: LoaderVehicleTrip }) {
  const isInTransit = trip.status === "in_transit";
  const isCompleted = trip.status === "completed";
  const isDispatched = trip.status === "dispatched";
  const isReady = trip.status === "ready";
  const isFlagged = trip.status === "flagged";

  return (
    <div className="flex flex-col gap-0.5">
      {isCompleted ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
          <CheckCircleIcon className="size-3.5" weight="fill" />
          Completed
        </span>
      ) : isInTransit ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400">
          <CheckCircleIcon className="size-3.5" weight="fill" />
          In Transit
        </span>
      ) : isDispatched ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircleIcon className="size-3.5" weight="fill" />
          Loaded
        </span>
      ) : isReady ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircleIcon className="size-3.5" weight="fill" />
          Ready ({trip.verifiedItemsCount ?? 0}/{trip.totalItemsCount ?? 0})
        </span>
      ) : isFlagged ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
          <WarningCircleIcon className="size-3.5" weight="fill" />
          Flagged
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
          <BoxArrowDownIcon className="size-3.5" weight="bold" />
          Loading ({trip.verifiedItemsCount ?? 0}/{trip.totalItemsCount ?? 0})
        </span>
      )}
      <span className="text-[11px] text-muted-foreground font-medium">
        {trip.payload.currentKg} kg · {trip.stopsCount} Drops
      </span>
    </div>
  );
}
