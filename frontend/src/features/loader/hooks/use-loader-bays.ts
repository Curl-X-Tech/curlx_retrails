import * as React from "react";
import {
  useBays,
  useConfirmDeparture,
  useSealWaypoint,
  useStartLoading,
  useTripChecklist,
  useVerifyItem,
} from "@/api/loader";
import { useAuth } from "@/context/auth-context";
import { getDefaultTrip, mapBayToTrip, mapChecklistToWaypoints } from "./bay-mappers";
import type {
  DiscrepancyType,
  LoaderOrderItem,
  LoaderVehicleTrip,
  LoaderWaypoint,
} from "../types";

export function useLoaderBays(urlTripId: string | null) {
  const { user } = useAuth();
  const userDepotId = user?.depotId || "depot-pel";

  const { data: bays = [], isLoading: isBaysLoading } = useBays(userDepotId);
  const [selectedTripIdState, setSelectedTripId] = React.useState<string>("");

  const selectedTripId = React.useMemo(() => {
    if (selectedTripIdState) return selectedTripIdState;
    if (urlTripId && bays.some((b) => b.trip.id === urlTripId)) return urlTripId;
    const activeFirst = bays.find(
      (b) => b.bay.dock_status === "docked_loading" || b.trip.status === "loading"
    );
    return activeFirst?.trip.id ?? bays[0]?.trip.id ?? "trip-01";
  }, [selectedTripIdState, urlTripId, bays]);

  const { data: activeChecklist, isLoading: isChecklistLoading } =
    useTripChecklist(selectedTripId);

  const verifyItemMutation = useVerifyItem();
  const sealWaypointMutation = useSealWaypoint();
  const confirmDepartureMutation = useConfirmDeparture();
  const startLoadingMutation = useStartLoading();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedStopSeq, setExpandedStopSeq] = React.useState<number>(1);
  const [isVehicleDrawerOpen, setIsVehicleDrawerOpen] = React.useState<boolean>(false);
  const [shakingWaypointSeq, setShakingWaypointSeq] = React.useState<number | null>(null);
  const [unlockedWaypoints, setUnlockedWaypoints] = React.useState<Set<number>>(
    new Set()
  );
  const [isDepartureDialogOpen, setIsDepartureDialogOpen] =
    React.useState<boolean>(false);

  const [reportingItem, setReportingItem] = React.useState<{
    stopSeq: number;
    item: LoaderOrderItem;
  } | null>(null);
  const [discrepancyType, setDiscrepancyType] =
    React.useState<DiscrepancyType>("shortage");
  const [discrepancyNotes, setDiscrepancyNotes] = React.useState("");

  const activeTrip: LoaderVehicleTrip = React.useMemo(() => {
    const activeBay = bays.find((b) => b.trip.id === selectedTripId);
    const waypoints = mapChecklistToWaypoints(activeChecklist);
    if (!activeBay) {
      return getDefaultTrip(selectedTripId, waypoints);
    }
    return mapBayToTrip(
      activeBay,
      userDepotId,
      waypoints,
      activeChecklist?.trip.seal_number
    );
  }, [bays, activeChecklist, selectedTripId, userDepotId]);

  const trips: LoaderVehicleTrip[] = React.useMemo(() => {
    return bays
      .filter((b) => b.bay.dock_status === "docked_loading")
      .map((b) => mapBayToTrip(b, userDepotId));
  }, [bays, userDepotId]);

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

  const isCompleted =
    activeTrip.status === "dispatched" ||
    activeTrip.status === "in_transit" ||
    activeTrip.status === "completed";

  const isWaypointLocked = React.useCallback(
    (wp: LoaderWaypoint) => {
      if (isCompleted) return true;
      if (unlockedWaypoints.has(wp.seq)) return false;
      if (wp.isSealed) return true;
      return (
        wp.items.length > 0 &&
        wp.items.every((i: LoaderOrderItem) => i.status === "verified")
      );
    },
    [unlockedWaypoints, isCompleted]
  );

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

  const handleUnlockWaypoint = React.useCallback(
    (seq: number) => {
      if (isCompleted) return;
      setUnlockedWaypoints((prev) => {
        const next = new Set(prev);
        next.add(seq);
        return next;
      });
    },
    [isCompleted]
  );

  const handleToggleExpandWaypoint = React.useCallback((seq: number) => {
    setExpandedStopSeq((curr) => (curr === seq ? 0 : seq));
  }, []);

  const handleToggleItemStatus = React.useCallback(
    (stopSeq: number, itemId: string) => {
      if (isCompleted) return;
      const wp = activeTrip.waypoints.find((w) => w.seq === stopSeq);
      const item = wp?.items.find((i) => i.id === itemId);
      const nextStatus = item?.status === "verified" ? "pending" : "verified";
      verifyItemMutation.mutate({ itemId, payload: { status: nextStatus } });
    },
    [activeTrip, isCompleted, verifyItemMutation]
  );

  const handleConfirmDiscrepancy = React.useCallback(() => {
    if (!reportingItem || isCompleted) return;
    verifyItemMutation.mutate({
      itemId: reportingItem.item.id,
      payload: {
        status: "flagged_shortfall",
        note: discrepancyNotes || `Reported ${discrepancyType}`,
      },
    });
    setReportingItem(null);
    setDiscrepancyNotes("");
  }, [reportingItem, isCompleted, discrepancyNotes, discrepancyType, verifyItemMutation]);

  const handleSealWaypoint = React.useCallback(
    (seq: number) => {
      sealWaypointMutation.mutate({ tripId: selectedTripId, seq });
    },
    [selectedTripId, sealWaypointMutation]
  );

  const handleConfirmDeparture = React.useCallback(
    (sealNumber?: string) => {
      const seal = sealNumber || activeTrip.sealNumber || `SL-${activeTrip.tripCode}`;
      confirmDepartureMutation.mutate({
        tripId: selectedTripId,
        payload: { seal_number: seal },
      });
    },
    [selectedTripId, activeTrip, confirmDepartureMutation]
  );

  return {
    trips,
    selectedTripId,
    setSelectedTripId,
    searchQuery,
    setSearchQuery,
    expandedStopSeq,
    setExpandedStopSeq,
    isVehicleDrawerOpen,
    setIsVehicleDrawerOpen,
    reportingItem,
    setReportingItem,
    discrepancyType,
    setDiscrepancyType,
    discrepancyNotes,
    setDiscrepancyNotes,
    shakingWaypointSeq,
    isWaypointLocked,
    unlockedWaypoints,
    isLoading: isBaysLoading || isChecklistLoading,
    isCompleted,
    activeTrip,
    filteredTrips,
    handleLockedAttempt,
    handleUnlockWaypoint,
    handleToggleExpandWaypoint,
    handleToggleItemStatus,
    handleConfirmDiscrepancy,
    handleSealWaypoint,
    handleConfirmDeparture,
    handleStartLoading: () => startLoadingMutation.mutate(selectedTripId),
    isDepartureDialogOpen,
    setIsDepartureDialogOpen,
    isReadyForDeparture: Boolean(
      isCompleted ||
      activeChecklist?.summary?.is_ready_for_departure ||
      (activeTrip.waypoints.length > 0 &&
        activeTrip.waypoints.every((w) => isWaypointLocked(w)))
    ),
    isVerifying: verifyItemMutation.isPending,
    isSealing: sealWaypointMutation.isPending,
    isDeparting: confirmDepartureMutation.isPending,
    isStartingLoading: startLoadingMutation.isPending,
  };
}
