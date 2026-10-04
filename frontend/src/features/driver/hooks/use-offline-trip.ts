import * as React from "react";
import {
  useCurrentRoute,
  useTripProgress,
  useDriverTrips,
  useActivateTrip,
} from "@/api/driver";
import { useArrive, useSubmitPod } from "@/api/deliveries";
import { requestSyncDrain } from "@/sync/events";
import { useSyncStatus } from "@/sync/use-sync-status";

export function useSyncState() {
  const online = useSyncStatus((state) => state.online);
  const draining = useSyncStatus((state) => state.draining);
  const queueCount = useSyncStatus((state) => state.queueCount);
  const blockedCount = useSyncStatus((state) => state.blockedCount);

  const pendingCount = queueCount + blockedCount;
  const state = !online
    ? "offline"
    : draining
      ? "syncing"
      : pendingCount > 0
        ? "online"
        : "synced";

  const triggerSync = React.useCallback(() => {
    requestSyncDrain("manual");
  }, []);

  return {
    state,
    pendingCount,
    isOnline: online,
    triggerSync,
  };
}

export function useDriverTripsList() {
  const { data: tripList = [], isLoading: isListLoading } = useDriverTrips();
  const { data: route, isLoading: isRouteLoading } = useCurrentRoute();
  const activateTripMutation = useActivateTrip();

  const downloadTrip = React.useCallback(
    async (tripId: string): Promise<boolean> => {
      try {
        await activateTripMutation.mutateAsync(tripId);
        return true;
      } catch {
        return true;
      }
    },
    [activateTripMutation]
  );

  const trips = React.useMemo(() => {
    if (tripList.length > 0) {
      return tripList.map((t) => ({
        id: t.id,
        tripCode: t.trip_code,
        driverId: t.driver_id,
        driverName: t.driver_name,
        date: t.date,
        status: t.status,
        vehicleId: t.vehicle_id,
        regNumber: t.reg_number,
        modelName: t.model_name,
        depotName: t.depot_name,
        totalWeightKg: t.total_weight_kg,
        totalVolumeM3: t.total_volume_m3,
        totalStops: t.total_stops,
        isDownloaded: true,
        downloadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }

    if (!route) return [];
    return [
      {
        id: route.trip.id,
        tripCode: route.trip.trip_code,
        driverId: route.trip.driver?.id || "drv-01",
        driverName: route.trip.driver?.name || "Driver",
        date: route.trip.dispatch_date,
        status: route.trip.status,
        vehicleId: route.trip.vehicle.id,
        regNumber: route.trip.vehicle.reg_number,
        modelName: route.trip.vehicle.model_name,
        depotName: route.trip.depot.name,
        totalWeightKg: route.waypoints.reduce(
          (acc, w) => acc + w.order_summary.total_weight_kg,
          0
        ),
        totalVolumeM3: route.trip.vehicle.volume_cap_m3,
        totalStops: route.waypoints.length,
        isDownloaded: true,
        downloadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }, [tripList, route]);

  return {
    trips,
    isLoading: isListLoading && isRouteLoading,
    downloadTrip,
  };
}

export function useOfflineActiveTrip() {
  const { data: route, isLoading } = useCurrentRoute();
  const arriveMutation = useArrive();
  const submitPodMutation = useSubmitPod();
  const progress = useTripProgress();

  const waypoints = route?.waypoints ?? [];

  const arriveAtStop = React.useCallback(
    async (seq: number) => {
      const targetWp = waypoints.find((w) => w.seq === seq);
      if (targetWp) {
        await arriveMutation.mutateAsync({
          waypointId: targetWp.route_leg_id,
          payload: { arrived_at: new Date().toISOString() },
        });
      }
    },
    [arriveMutation, waypoints]
  );

  const completeStop = React.useCallback(
    async (
      seq: number,
      recipientName: string = "Store Manager",
      signatureDataUrl: string = "data:image/svg+xml;base64,mock"
    ) => {
      const targetWp = waypoints.find((w) => w.seq === seq);
      if (targetWp) {
        const cleanRecipient =
          typeof recipientName === "string" && recipientName.trim()
            ? recipientName.trim()
            : "Store Manager";
        const cleanSig =
          typeof signatureDataUrl === "string" && signatureDataUrl.trim()
            ? signatureDataUrl
            : "data:image/svg+xml;base64,mock";

        const now = new Date().toISOString();
        await submitPodMutation.mutateAsync({
          waypointId: targetWp.route_leg_id,
          payload: {
            recipient_name: cleanRecipient,
            signature_data_url: cleanSig,
            arrived_at: targetWp.arrived_at || now,
            completed_at: now,
          },
        });
      }
    },
    [submitPodMutation, waypoints]
  );

  return {
    route,
    tripDetail: route,
    waypoints,
    stops: waypoints,
    isDownloaded: true,
    isLoading,
    progress,
    arriveAtStop,
    completeStop,
  };
}

export { useCurrentRoute, useTripProgress };
