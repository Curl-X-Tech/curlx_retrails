import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { syncEngine, type SyncState } from "@/lib/sync-engine";
import { mockDriverTrip } from "@/data/mock-driver-trips";
import { driverRepo } from "../repo";
import type { LocalTripSummary } from "../types";

export function useSyncState() {
  const [syncStatus, setSyncStatus] = React.useState<{
    state: SyncState;
    pendingCount: number;
  }>({
    state: syncEngine.isOnline ? "synced" : "offline",
    pendingCount: 0,
  });

  React.useEffect(() => {
    return syncEngine.subscribe((state, pendingCount) => {
      setSyncStatus({ state, pendingCount });
    });
  }, []);

  const triggerSync = React.useCallback(() => {
    syncEngine.drainMutationQueue();
  }, []);

  return {
    ...syncStatus,
    isOnline: syncEngine.isOnline,
    triggerSync,
  };
}

export function useDriverTripsList() {
  const trips = useLiveQuery(() => driverRepo.getTrips(), []);

  React.useEffect(() => {
    async function initTrips() {
      const count = await driverRepo.getTripCount();
      if (count === 0) {
        const today = new Date().toISOString().split("T")[0];
        const initialTrip: LocalTripSummary = {
          id: mockDriverTrip.id,
          tripCode: mockDriverTrip.tripCode,
          driverId: mockDriverTrip.driver.id,
          driverName: mockDriverTrip.driver.name,
          date: today,
          status: "dispatched",
          vehicleId: mockDriverTrip.vehicleId,
          regNumber: mockDriverTrip.regNumber,
          modelName: mockDriverTrip.modelName,
          depotName: mockDriverTrip.depotName,
          totalWeightKg: mockDriverTrip.waypoints.reduce(
            (acc, w) => acc + w.totalWeightKg,
            0
          ),
          totalVolumeM3: mockDriverTrip.volumeCapM3,
          totalStops: mockDriverTrip.waypoints.length,
          isDownloaded: false,
          downloadedAt: null,
          updatedAt: new Date().toISOString(),
        };
        await driverRepo.putTrip(initialTrip);
      }
    }
    void initTrips();
  }, []);

  const downloadTrip = React.useCallback(async (tripId: string): Promise<boolean> => {
    return driverRepo.downloadTrip(tripId, mockDriverTrip);
  }, []);

  return {
    trips: trips ?? [],
    isLoading: trips === undefined,
    downloadTrip,
  };
}

export function useOfflineActiveTrip(tripId: string = mockDriverTrip.id) {
  const tripSummary = useLiveQuery(() => driverRepo.getTripSummary(tripId), [tripId]);
  const tripDetail = useLiveQuery(() => driverRepo.getTripDetail(tripId), [tripId]);
  const stops = useLiveQuery(() => driverRepo.getStopsByTrip(tripId), [tripId]);
  const items = useLiveQuery(() => driverRepo.getItemsByTrip(tripId), [tripId]);

  const arriveAtStop = React.useCallback(
    async (seq: number) => {
      await driverRepo.arriveAtStop(tripId, seq);
    },
    [tripId]
  );

  const completeStop = React.useCallback(
    async (seq: number) => {
      await driverRepo.completeStop(tripId, seq);
    },
    [tripId]
  );

  const verifyPackage = React.useCallback(
    async (
      packageCode: string,
      status: "delivered" | "discrepancy",
      discrepancyReason?: string
    ) => {
      await driverRepo.verifyPackage(tripId, packageCode, status, discrepancyReason);
    },
    [tripId]
  );

  return {
    tripSummary,
    tripDetail: tripDetail?.data ?? mockDriverTrip,
    stops: stops ?? [],
    items: items ?? [],
    isDownloaded: tripSummary?.isDownloaded ?? false,
    arriveAtStop,
    completeStop,
    verifyPackage,
  };
}
