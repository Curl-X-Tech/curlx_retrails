import * as React from "react";
import type { LoaderVehicleTrip, LoaderOrderItem, DiscrepancyType } from "../types";

export function useLoaderBayMutations(
  selectedTripId: string,
  setTrips: React.Dispatch<React.SetStateAction<LoaderVehicleTrip[]>>,
  setLockedWaypoints: React.Dispatch<React.SetStateAction<Set<number>>>
) {
  const [reportingItem, setReportingItem] = React.useState<{
    stopSeq: number;
    item: LoaderOrderItem;
  } | null>(null);
  const [discrepancyType, setDiscrepancyType] =
    React.useState<DiscrepancyType>("shortage");
  const [discrepancyNotes, setDiscrepancyNotes] = React.useState("");

  const handleToggleItemStatus = React.useCallback(
    (stopSeq: number, itemId: string) => {
      setTrips((prevTrips) =>
        prevTrips.map((trip) => {
          if (trip.id !== selectedTripId) return trip;
          const updatedWaypoints = trip.waypoints.map((wp) => {
            if (wp.seq !== stopSeq) return wp;
            const updatedItems = wp.items.map((item) => {
              if (item.id !== itemId) return item;
              return {
                ...item,
                status: (item.status === "verified" ? "pending" : "verified") as
                  "pending" | "verified",
              };
            });
            const allVerified =
              updatedItems.length > 0 &&
              updatedItems.every((i) => i.status === "verified");
            setLockedWaypoints((prev) => {
              const next = new Set(prev);
              if (allVerified) next.add(stopSeq);
              else next.delete(stopSeq);
              return next;
            });
            return { ...wp, items: updatedItems };
          });
          return { ...trip, waypoints: updatedWaypoints };
        })
      );
    },
    [selectedTripId, setTrips, setLockedWaypoints]
  );

  const handleUnlockWaypoint = React.useCallback(
    (stopSeq: number) => {
      setLockedWaypoints((prev) => {
        const next = new Set(prev);
        next.delete(stopSeq);
        return next;
      });
    },
    [setLockedWaypoints]
  );

  const handleConfirmDiscrepancy = React.useCallback(() => {
    if (!reportingItem) return;
    const { stopSeq, item } = reportingItem;
    setTrips((prevTrips) =>
      prevTrips.map((trip) => {
        if (trip.id !== selectedTripId) return trip;
        const updatedWaypoints = trip.waypoints.map((wp) => {
          if (wp.seq !== stopSeq) return wp;
          const updatedItems = wp.items.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "flagged" as const,
                  notes: discrepancyNotes || `Reported ${discrepancyType}`,
                }
              : i
          );
          return { ...wp, items: updatedItems };
        });
        return { ...trip, waypoints: updatedWaypoints };
      })
    );
    setReportingItem(null);
    setDiscrepancyNotes("");
  }, [reportingItem, selectedTripId, discrepancyNotes, discrepancyType, setTrips]);

  return {
    reportingItem,
    setReportingItem,
    discrepancyType,
    setDiscrepancyType,
    discrepancyNotes,
    setDiscrepancyNotes,
    handleToggleItemStatus,
    handleUnlockWaypoint,
    handleConfirmDiscrepancy,
  };
}
