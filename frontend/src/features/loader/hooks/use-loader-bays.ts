import * as React from "react";
import { mockLoaderTrips } from "@/data/mock-loader-bays";
import { useSimulatedLoading } from "@/lib/simulated-delay";
import type { LoaderVehicleTrip, LoaderOrderItem, DiscrepancyType } from "../types";

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
  const [reportingItem, setReportingItem] = React.useState<{ stopSeq: number; item: LoaderOrderItem } | null>(null);
  const [discrepancyType, setDiscrepancyType] = React.useState<DiscrepancyType>("shortage");
  const [discrepancyNotes, setDiscrepancyNotes] = React.useState("");
  const [shakingWaypointSeq, setShakingWaypointSeq] = React.useState<number | null>(null);

  const [lockedWaypoints, setLockedWaypoints] = React.useState<Set<number>>(() => {
    const initialLocked = new Set<number>();
    mockLoaderTrips[0]?.waypoints.forEach((wp) => {
      if (wp.items.length > 0 && wp.items.every((i) => i.status === "verified")) initialLocked.add(wp.seq);
    });
    return initialLocked;
  });

  const handleLockedAttempt = React.useCallback((seq: number) => {
    setShakingWaypointSeq(seq);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate([40, 50, 40]); } catch { /* ignore */ }
    }
    setTimeout(() => setShakingWaypointSeq((curr) => (curr === seq ? null : curr)), 550);
  }, []);

  const isLoading = useSimulatedLoading([selectedTripId]);
  const activeTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  const filteredTrips = React.useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const q = searchQuery.toLowerCase();
    return trips.filter((t) =>
      t.regNumber.toLowerCase().includes(q) || t.modelName.toLowerCase().includes(q) || t.depotName.toLowerCase().includes(q)
    );
  }, [trips, searchQuery]);

  const handleToggleItemStatus = React.useCallback((stopSeq: number, itemId: string) => {
    setTrips((prevTrips) =>
      prevTrips.map((trip) => {
        if (trip.id !== selectedTripId) return trip;
        const updatedWaypoints = trip.waypoints.map((wp) => {
          if (wp.seq !== stopSeq) return wp;
          const updatedItems = wp.items.map((item) => {
            if (item.id !== itemId) return item;
            return { ...item, status: (item.status === "verified" ? "pending" : "verified") as "pending" | "verified" };
          });
          const allVerified = updatedItems.length > 0 && updatedItems.every((i) => i.status === "verified");
          setLockedWaypoints((prev) => {
            const next = new Set(prev);
            if (allVerified) next.add(stopSeq); else next.delete(stopSeq);
            return next;
          });
          return { ...wp, items: updatedItems };
        });
        return { ...trip, waypoints: updatedWaypoints };
      })
    );
  }, [selectedTripId]);

  const handleUnlockWaypoint = React.useCallback((stopSeq: number) => {
    setLockedWaypoints((prev) => {
      const next = new Set(prev);
      next.delete(stopSeq);
      return next;
    });
  }, []);

  const handleConfirmDiscrepancy = React.useCallback(() => {
    if (!reportingItem) return;
    const { stopSeq, item } = reportingItem;
    setTrips((prevTrips) =>
      prevTrips.map((trip) => {
        if (trip.id !== selectedTripId) return trip;
        const updatedWaypoints = trip.waypoints.map((wp) => {
          if (wp.seq !== stopSeq) return wp;
          const updatedItems = wp.items.map((i) =>
            i.id === item.id ? { ...i, status: "flagged" as const, notes: discrepancyNotes || `Reported ${discrepancyType}` } : i
          );
          return { ...wp, items: updatedItems };
        });
        return { ...trip, waypoints: updatedWaypoints };
      })
    );
    setReportingItem(null);
    setDiscrepancyNotes("");
  }, [reportingItem, selectedTripId, discrepancyNotes, discrepancyType]);

  const handleToggleExpandWaypoint = React.useCallback((seq: number) => {
    setExpandedStopSeq((currentSeq) => {
      const nextSeq = currentSeq === seq ? 0 : seq;
      setLockedWaypoints((prev) => {
        const next = new Set(prev);
        activeTrip.waypoints.forEach((wp) => {
          if (wp.items.length > 0 && wp.items.every((i) => i.status === "verified") && wp.seq !== nextSeq) {
            next.add(wp.seq);
          }
        });
        return next;
      });
      return nextSeq;
    });
  }, [activeTrip]);

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
