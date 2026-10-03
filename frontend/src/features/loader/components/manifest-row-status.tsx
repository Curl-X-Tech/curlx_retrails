import {
  BoxArrowDownIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import type { LoaderVehicleTrip } from "../types";

export function ManifestRowStatus({ trip }: { trip: LoaderVehicleTrip }) {
  const isDispatched = trip.status === "dispatched";
  const isReady = trip.status === "ready";
  const isFlagged = trip.status === "flagged";

  return (
    <div className="flex flex-col gap-1">
      {isDispatched ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
          <CheckCircleIcon className="size-3.5 text-muted-foreground" weight="bold" />
          Dispatched (All Verified)
        </span>
      ) : isReady ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircleIcon className="size-3.5 text-emerald-600" weight="fill" />
          Ready for Rollout ({trip.verifiedItemsCount ?? 0}/{trip.totalItemsCount ?? 0})
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
        {trip.payload.currentKg} kg ({trip.payload.percentage}%) · {trip.stopsCount} Stops
      </span>
    </div>
  );
}
