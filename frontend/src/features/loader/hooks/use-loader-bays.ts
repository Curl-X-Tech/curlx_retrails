import * as React from "react";
import {
  useBays,
  useConfirmDeparture,
  useSealWaypoint,
  useTripChecklist,
  useVerifyItem,
} from "@/api/loader";
import { useAuth } from "@/context/auth-context";
import type { DiscrepancyType, LoaderOrderItem, LoaderVehicleTrip } from "../types";

export function useLoaderBays(urlTripId: string | null) {
  const { user } = useAuth();
  const userDepotId = user?.depotId || "depot-pel";

  const { data: bays = [], isLoading: isBaysLoading } = useBays(userDepotId);

  const [selectedTripIdState, setSelectedTripId] = React.useState<string>("");

  const selectedTripId = React.useMemo(() => {
    if (selectedTripIdState) return selectedTripIdState;
    if (urlTripId && bays.some((b) => b.trip.id === urlTripId)) return urlTripId;
    return bays[0]?.trip.id ?? "trip-01";
  }, [selectedTripIdState, urlTripId, bays]);

  const { data: activeChecklist, isLoading: isChecklistLoading } =
    useTripChecklist(selectedTripId);

  const verifyItemMutation = useVerifyItem();
  const sealWaypointMutation = useSealWaypoint();
  const confirmDepartureMutation = useConfirmDeparture();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedStopSeq, setExpandedStopSeq] = React.useState<number>(1);
  const [isVehicleDrawerOpen, setIsVehicleDrawerOpen] = React.useState<boolean>(false);
  const [shakingWaypointSeq, setShakingWaypointSeq] = React.useState<number | null>(null);
  const [lockedWaypoints, setLockedWaypoints] = React.useState<Set<number>>(new Set());

  const [reportingItem, setReportingItem] = React.useState<{
    stopSeq: number;
    item: LoaderOrderItem;
  } | null>(null);
  const [discrepancyType, setDiscrepancyType] =
    React.useState<DiscrepancyType>("shortage");
  const [discrepancyNotes, setDiscrepancyNotes] = React.useState("");

  const activeTrip: LoaderVehicleTrip = React.useMemo(() => {
    const activeBay = bays.find((b) => b.trip.id === selectedTripId);

    const waypoints =
      activeChecklist?.waypoints.map((wp) => ({
        seq: wp.seq,
        outletId: wp.outlet_id,
        outletCode: wp.outlet_code,
        outletName: wp.outlet_name,
        dockType: (wp.dock_type as any) || "rear_dock",
        deliveryWindow: wp.delivery_window,
        parkingConstraint: (wp.parking_constraint as any) || "normal",
        items: wp.items.map((i) => ({
          id: i.id,
          orderRef: i.package_code,
          packageCode: i.package_code,
          sku: i.sku,
          itemTitle: i.item_title,
          category: i.category,
          crateCount: i.crate_count,
          weightKg: i.gross_weight_kg,
          volumeM3: i.gross_volume_m3,
          temperature: i.temperature_req || "chilled",
          isReefer: i.is_reefer,
          specialHandlingCode: (i.special_handling_code as any) || "COL",
          bayCoordinates: { bayX: 4, bayY: 2, bayZ: 1 },
          stagingBay: i.staging_bay,
          status: (i.verification_status === "flagged_shortfall"
            ? "flagged"
            : i.verification_status) as "pending" | "verified" | "flagged",
          notes: i.note,
        })),
      })) || [];

    const totalItems = waypoints.reduce((acc, wp) => acc + wp.items.length, 0);
    const verifiedItems = waypoints.reduce(
      (acc, wp) => acc + wp.items.filter((i) => i.status === "verified").length,
      0
    );

    return {
      id: selectedTripId,
      tripCode: activeChecklist?.trip.trip_code || activeBay?.trip.trip_code || "RT-14",
      tripSequence: 1,
      sealNumber: activeChecklist?.trip.seal_number || "SL-90821-B",
      vehicleId: activeBay?.vehicle.vehicle_id || "VEH001",
      regNumber: activeBay?.vehicle.reg_number || "NP-4811",
      modelName: activeBay?.vehicle.model_name || "Isuzu ELF NPR",
      type: activeBay?.vehicle.type || "truck",
      temp: activeBay?.vehicle.temp || "reefer",
      weightCapKg: activeBay?.vehicle.weight_cap_kg || 4200,
      volumeCapM3: activeBay?.vehicle.volume_cap_m3 || 28.0,
      imagePath: "/vehicle-images/freeze.png",
      depotName: userDepotId === "depot-kandy" ? "Kandy Depot" : "Peliyagoda Depot",
      stopsCount: waypoints.length,
      nextStopName: waypoints[0]?.outletName || "Waypoint Fresh Wattala",
      plannedDepartureTime: activeBay?.trip.planned_departure_time || "05:30 AM",
      departureCountdownMinutes: 35,
      status: (activeBay?.trip.status as any) || "loading",
      dockBay: activeBay?.bay.bay_number || "Bay 4C",
      verifiedItemsCount: verifiedItems,
      totalItemsCount: totalItems,
      driver: {
        name: activeBay?.driver.name || "Saman Perera",
        designation: "Heavy Vehicle Pilot",
        licenseId: activeBay?.driver.license_number || "DL-90821-WP-89",
        phone: activeBay?.driver.phone || "+94 77 123 4567",
        avatarInitials: (activeBay?.driver.name || "Saman Perera")
          .split(" ")
          .map((n) => n[0])
          .join(""),
      },
      payload: {
        currentKg: activeBay?.progress.payload_kg || 3360,
        maxKg: activeBay?.progress.max_payload_kg || 4200,
        percentage: activeBay?.progress.payload_percentage || 80,
        secondaryMetric: "2,650 kg s.m",
        currentVolumeM3: activeBay?.progress.volume_m3 || 22.4,
        maxVolumeM3: activeBay?.progress.max_volume_m3 || 28.0,
      },
      waypoints,
    };
  }, [bays, activeChecklist, selectedTripId, userDepotId]);

  const trips: LoaderVehicleTrip[] = React.useMemo(() => {
    return bays.map((b) => ({
      id: b.trip.id,
      tripCode: b.trip.trip_code,
      tripSequence: 1,
      sealNumber: "SL-90821-B",
      vehicleId: b.vehicle.vehicle_id,
      regNumber: b.vehicle.reg_number,
      modelName: b.vehicle.model_name,
      type: b.vehicle.type,
      temp: b.vehicle.temp,
      weightCapKg: b.vehicle.weight_cap_kg,
      volumeCapM3: b.vehicle.volume_cap_m3,
      imagePath:
        b.vehicle.temp === "reefer"
          ? "/vehicle-images/freeze.png"
          : "/vehicle-images/dry.png",
      depotName: b.bay.depot_id === "depot-kandy" ? "Kandy Depot" : "Peliyagoda Depot",
      stopsCount: b.trip.stops_count,
      nextStopName: b.trip.next_stop_name,
      plannedDepartureTime: b.trip.planned_departure_time,
      departureCountdownMinutes: 45,
      status: b.trip.status as any,
      dockBay: b.bay.bay_number,
      verifiedItemsCount: b.progress.verified_items_count,
      totalItemsCount: b.progress.total_items_count,
      driver: {
        name: b.driver.name,
        designation: "Fleet Pilot",
        licenseId: b.driver.license_number || "DL-90821-WP-89",
        phone: b.driver.phone,
        avatarInitials: b.driver.name
          .split(" ")
          .map((n) => n[0])
          .join(""),
      },
      payload: {
        currentKg: b.progress.payload_kg,
        maxKg: b.progress.max_payload_kg,
        percentage: b.progress.payload_percentage,
        secondaryMetric: "Payload",
        currentVolumeM3: b.progress.volume_m3,
        maxVolumeM3: b.progress.max_volume_m3,
      },
      waypoints: [],
    }));
  }, [bays]);

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

  const handleUnlockWaypoint = React.useCallback((seq: number) => {
    setLockedWaypoints((prev) => {
      const next = new Set(prev);
      next.delete(seq);
      return next;
    });
  }, []);

  const handleToggleExpandWaypoint = React.useCallback((seq: number) => {
    setExpandedStopSeq((curr) => (curr === seq ? 0 : seq));
  }, []);

  const handleToggleItemStatus = React.useCallback(
    (stopSeq: number, itemId: string) => {
      const wp = activeTrip.waypoints.find((w) => w.seq === stopSeq);
      const item = wp?.items.find((i) => i.id === itemId);
      const nextStatus = item?.status === "verified" ? "pending" : "verified";

      verifyItemMutation.mutate({
        itemId,
        payload: { status: nextStatus },
      });
    },
    [activeTrip, verifyItemMutation]
  );

  const handleConfirmDiscrepancy = React.useCallback(() => {
    if (!reportingItem) return;
    verifyItemMutation.mutate({
      itemId: reportingItem.item.id,
      payload: {
        status: "flagged_shortfall",
        note: discrepancyNotes || `Reported ${discrepancyType}`,
      },
    });
    setReportingItem(null);
    setDiscrepancyNotes("");
  }, [reportingItem, discrepancyNotes, discrepancyType, verifyItemMutation]);

  const handleSealWaypoint = React.useCallback(
    (seq: number) => {
      sealWaypointMutation.mutate({
        tripId: selectedTripId,
        seq,
      });
    },
    [selectedTripId, sealWaypointMutation]
  );

  const handleConfirmDeparture = React.useCallback(
    (sealNumber: string) => {
      confirmDepartureMutation.mutate({
        tripId: selectedTripId,
        payload: { seal_number: sealNumber },
      });
    },
    [selectedTripId, confirmDepartureMutation]
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
    lockedWaypoints,
    shakingWaypointSeq,
    isLoading: isBaysLoading || isChecklistLoading,
    activeTrip,
    filteredTrips,
    handleLockedAttempt,
    handleUnlockWaypoint,
    handleToggleExpandWaypoint,
    handleToggleItemStatus,
    handleConfirmDiscrepancy,
    handleSealWaypoint,
    handleConfirmDeparture,
    isVerifying: verifyItemMutation.isPending,
    isSealing: sealWaypointMutation.isPending,
    isDeparting: confirmDepartureMutation.isPending,
  };
}
