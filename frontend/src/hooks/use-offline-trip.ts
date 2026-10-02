import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  type LocalTripSummary,
  type LocalTripStop,
  type LocalStopItem,
} from "@/lib/dexie-db";
import { syncEngine, type SyncState } from "@/lib/sync-engine";
import { mockDriverTrip, type DriverTrip } from "@/data/mock-driver-trips";
import { prefetchTripMapTiles } from "@/lib/map-tile-prefetch";

/**
 * Hook providing real-time online/offline and sync queue status.
 */
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

/**
 * Hook managing Driver trips list, checking today's assigned trips, and downloading to IndexedDB.
 */
export function useDriverTripsList() {
  const trips = useLiveQuery(() => db.trips.toArray(), []);

  // Initialize trips table if first run
  React.useEffect(() => {
    async function initTrips() {
      const count = await db.trips.count();
      if (count === 0) {
        // Seed initial assigned trip for driver
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
        await db.trips.put(initialTrip);
      }
    }
    initTrips();
  }, []);

  /**
   * Downloads and caches a full trip with all stops, packages, and manifests in local IndexedDB.
   */
  const downloadTrip = React.useCallback(async (tripId: string): Promise<boolean> => {
    try {
      // 1. In real mode: Fetch full trip from GET /api/v1/trips/{tripId}
      // Fallback to mockDriverTrip if backend endpoint in progress
      const tripData: DriverTrip = mockDriverTrip;

      await db.transaction(
        "rw",
        [db.trips, db.tripDetails, db.tripStops, db.stopItems],
        async () => {
          // Save full trip payload
          await db.tripDetails.put({
            id: tripId,
            data: tripData,
            lastSyncedAt: new Date().toISOString(),
          });

          // Save individual stops for fast queries
          for (const wp of tripData.waypoints) {
            const stopRecord: LocalTripStop = {
              id: `${tripId}_wp_${wp.seq}`,
              tripId,
              seq: wp.seq,
              outletId: wp.outletId,
              outletCode: wp.outletCode,
              outletName: wp.outletName,
              address: wp.address,
              lat: wp.lat,
              lng: wp.lng,
              status: wp.status,
              stagingLocation: wp.stagingLocation,
              deliveryWindow: wp.deliveryWindow,
              storeManagerName: wp.storeManagerName,
              storeManagerPhone: wp.storeManagerPhone,
              totalWeightKg: wp.totalWeightKg,
              totalCrateCount: wp.totalCrateCount,
              arrivedAt: wp.arrivedAt,
              departedAt: wp.departedAt,
            };
            await db.tripStops.put(stopRecord);

            // Save items for each stop
            for (const item of wp.items) {
              const itemRecord: LocalStopItem = {
                id: `${tripId}_${item.packageCode}`,
                tripId,
                stopSeq: wp.seq,
                packageCode: item.packageCode,
                orderRef: item.orderRef,
                sku: item.sku,
                itemTitle: item.itemTitle,
                category: item.category,
                crateCount: item.crateCount,
                weightKg: item.weightKg,
                volumeM3: item.volumeM3,
                isReefer: item.isReefer,
                status: item.status,
                specialHandlingCode: item.specialHandlingCode,
              };
              await db.stopItems.put(itemRecord);
            }
          }

          // Update trip summary status
          await db.trips.update(tripId, {
            isDownloaded: true,
            downloadedAt: new Date().toISOString(),
            status: "in_transit",
            updatedAt: new Date().toISOString(),
          });
        }
      );

      // Pre-cache route map tiles in background for offline navigation
      void prefetchTripMapTiles(
        tripData.waypoints.map((w) => ({ lat: w.lat, lng: w.lng }))
      );

      return true;
    } catch (err) {
      console.error("Failed to download trip:", err);
      return false;
    }
  }, []);

  return {
    trips: trips ?? [],
    isLoading: trips === undefined,
    downloadTrip,
  };
}

/**
 * Hook providing reactive live query of an active trip and its stops/items with offline mutation helpers.
 */
export function useOfflineActiveTrip(tripId: string = mockDriverTrip.id) {
  const tripSummary = useLiveQuery(() => db.trips.get(tripId), [tripId]);
  const tripDetail = useLiveQuery(() => db.tripDetails.get(tripId), [tripId]);
  const stops = useLiveQuery(
    () => db.tripStops.where("tripId").equals(tripId).sortBy("seq"),
    [tripId]
  );
  const items = useLiveQuery(
    () => db.stopItems.where("tripId").equals(tripId).toArray(),
    [tripId]
  );

  /**
   * Arrive at Stop: Updates local stop status and queues mutation.
   */
  const arriveAtStop = React.useCallback(
    async (seq: number) => {
      const arrivedAt = new Date().toISOString();
      const stopId = `${tripId}_wp_${seq}`;

      await db.tripStops.update(stopId, {
        status: "active",
        arrivedAt,
      });

      await syncEngine.queueMutation(tripId, "stop", "ARRIVE_STOP", {
        tripId,
        seq,
        arrivedAt,
      });
    },
    [tripId]
  );

  /**
   * Complete Stop: Updates local stop status to completed and queues mutation.
   */
  const completeStop = React.useCallback(
    async (seq: number) => {
      const departedAt = new Date().toISOString();
      const stopId = `${tripId}_wp_${seq}`;

      await db.tripStops.update(stopId, {
        status: "completed",
        departedAt,
      });

      // Advance next stop to active if exists
      const nextStopId = `${tripId}_wp_${seq + 1}`;
      const nextStop = await db.tripStops.get(nextStopId);
      if (nextStop) {
        await db.tripStops.update(nextStopId, { status: "active" });
      }

      await syncEngine.queueMutation(tripId, "stop", "COMPLETE_STOP", {
        tripId,
        seq,
        departedAt,
      });
    },
    [tripId]
  );

  /**
   * Verify Package: Updates package unload verification status and queues mutation.
   */
  const verifyPackage = React.useCallback(
    async (
      packageCode: string,
      status: "delivered" | "discrepancy",
      discrepancyReason?: string
    ) => {
      const verifiedAt = new Date().toISOString();
      const itemId = `${tripId}_${packageCode}`;

      await db.stopItems.update(itemId, {
        status,
        verifiedAt,
        discrepancyReason,
      });

      await syncEngine.queueMutation(tripId, "item", "VERIFY_ITEM", {
        tripId,
        packageCode,
        status,
        discrepancyReason,
        verifiedAt,
      });
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
