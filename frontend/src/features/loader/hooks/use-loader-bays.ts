import * as React from "react";
import { mockLoaderTrips } from "@/data/mock-loader-bays";
import { useSimulatedLoading } from "@/lib/simulated-delay";
import type { LoaderVehicleTrip } from "../types";
import { useLoaderBayMutations } from "./use-loader-bay-mutations";

export function useLoaderBays(urlTripId: string | null) {
  const [trips, setTrips] = React.useState<LoaderVehicleTrip[]>(mockLoaderTrips);
  const [selectedTripId, setSelectedTripId] = React.useState<string>(() => {
    if (urlTripId && mockLoaderTrips.some((t) => t.id === urlTripId)) return urlTripId;
    return mockLoaderTrips[0]?.id ?? "";
  });

  React.useEffect(() => {
    if (urlTripId && mockLoaderTrips.some((t) => t.id === urlTripId)) {
      setSelectedTripId(urlTripId);
    }
  }, [urlTripId]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedStopSeq, setExpandedStopSeq] = React.useState<number>(9);
  const [isVehicleDrawerOpen, setIsVehicleDrawerOpen] = React.useState<boolean>(false);
  const [shakingWaypointSeq, setShakingWaypointSeq] = React.useState<number | null>(null);

  const [lockedWaypoints, setLockedWaypoints] = React.useState<Set<number>>(() => {
    const initialLocked = new Set<number>();
    mockLoaderTrips[0]?.waypoints.forEach((wp) => {
      if (wp.items.length > 0 && wp.items.every((i) => i.status === "verified"))
        initialLocked.add(wp.seq);
    });
    return initialLocked;
  });

  const {
    reportingItem,
    setReportingItem,
    discrepancyType,
    setDiscrepancyType,
    discrepancyNotes,
    setDiscrepancyNotes,
    handleToggleItemStatus,
    handleUnlockWaypoint,
    handleConfirmDiscrepancy,
  } = useLoaderBayMutations(selectedTripId, setTrips, setLockedWaypoints);

  const handleLockedAttempt = React.useCallback((seq: number) => {
    setShakingWaypointSeq(seq);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([40, 50, 40]);
      } catch {
        /* ignore */
      }
    }
    setTimeout(() => setShakingWaypointSeq((curr) => (curr === seq ? null : curr)), 550);
  }, []);

  const isLoading = useSimulatedLoading([selectedTripId]);
  const activeTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  const filteredTrips = React.useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const q = searchQuery.toLowerCase();
    return trips.filter(
      (t) =>
        t.regNumber.toLowerCase().includes(q) ||
        t.modelName.toLowerCase().includes(q) ||
        t.depotName.toLowerCase().includes(q)
    );
  }, [trips, searchQuery]);

  const handleToggleExpandWaypoint = React.useCallback(
    (seq: number) => {
      setExpandedStopSeq((currentSeq) => {
        const nextSeq = currentSeq === seq ? 0 : seq;
        setLockedWaypoints((prev) => {
          const next = new Set(prev);
          activeTrip.waypoints.forEach((wp) => {
            if (
              wp.items.length > 0 &&
              wp.items.every((i) => i.status === "verified") &&
              wp.seq !== nextSeq
            ) {
              next.add(wp.seq);
            }
          });
          return next;
        });
        return nextSeq;
      });
    },
    [activeTrip]
  );

  return {
    trips,
    selectedTripId,
    setSelectedTripId,
    searchQuery,
    setSearchQuery,
    expandedStopSeq,
    isVehicleDrawerOpen,
    setIsVehicleDrawerOpen,
    reportingItem,
    setReportingItem,
    discrepancyType,
    setDiscrepancyType,
    discrepancyNotes,
    setDiscrepancyNotes,
    lockedWaypoints,
    shakingWaypointSeq,
    isLoading,
    activeTrip,
    filteredTrips,
    handleLockedAttempt,
    handleToggleItemStatus,
    handleUnlockWaypoint,
    handleConfirmDiscrepancy,
    handleToggleExpandWaypoint,
  };
}
