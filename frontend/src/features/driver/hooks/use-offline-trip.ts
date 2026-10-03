import * as React from "react";
import { useCurrentRoute, useTripProgress } from "@/api/driver";
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
  const { data: route, isLoading } = useCurrentRoute();

  const downloadTrip = React.useCallback(async (_tripId: string): Promise<boolean> => {
    return true;
  }, []);

  const trips = React.useMemo(() => {
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
  }, [route]);

  return {
    trips,
    isLoading,
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
        const now = new Date().toISOString();
        await submitPodMutation.mutateAsync({
          waypointId: targetWp.route_leg_id,
          payload: {
            recipient_name: recipientName,
            signature_data_url: signatureDataUrl,
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
