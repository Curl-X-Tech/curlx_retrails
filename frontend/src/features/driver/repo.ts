import {
  db,
  type LocalTripSummary,
  type LocalTripDetail,
  type LocalTripStop,
  type LocalStopItem,
} from "@/lib/dexie-db";
import { syncEngine } from "@/lib/sync-engine";
import { prefetchTripMapTiles } from "@/lib/map-tile-prefetch";
import type { DriverTrip } from "./types";

export const driverRepo = {
  async getTrips(): Promise<LocalTripSummary[]> {
    return db.trips.toArray();
  },

  async getTripCount(): Promise<number> {
    return db.trips.count();
  },

  async putTrip(trip: LocalTripSummary): Promise<string> {
    return db.trips.put(trip);
  },

  async getTripSummary(tripId: string): Promise<LocalTripSummary | undefined> {
    return db.trips.get(tripId);
  },

  async getTripDetail(tripId: string): Promise<LocalTripDetail | undefined> {
    return db.tripDetails.get(tripId);
  },

  async getStopsByTrip(tripId: string): Promise<LocalTripStop[]> {
    return db.tripStops.where("tripId").equals(tripId).sortBy("seq");
  },

  async getItemsByTrip(tripId: string): Promise<LocalStopItem[]> {
    return db.stopItems.where("tripId").equals(tripId).toArray();
  },

  async downloadTrip(tripId: string, tripData: DriverTrip): Promise<boolean> {
    try {
      await db.transaction(
        "rw",
        [db.trips, db.tripDetails, db.tripStops, db.stopItems],
        async () => {
          await db.tripDetails.put({
            id: tripId,
            data: tripData,
            lastSyncedAt: new Date().toISOString(),
          });

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

          await db.trips.update(tripId, {
            isDownloaded: true,
            downloadedAt: new Date().toISOString(),
            status: "in_transit",
            updatedAt: new Date().toISOString(),
          });
        }
      );

      void prefetchTripMapTiles(
        tripData.waypoints.map((w) => ({ lat: w.lat, lng: w.lng }))
      );

      return true;
    } catch {
      return false;
    }
  },

  async arriveAtStop(tripId: string, seq: number): Promise<void> {
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

  async completeStop(tripId: string, seq: number): Promise<void> {
    const departedAt = new Date().toISOString();
    const stopId = `${tripId}_wp_${seq}`;

    await db.tripStops.update(stopId, {
      status: "completed",
      departedAt,
    });

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

  async verifyPackage(
    tripId: string,
    packageCode: string,
    status: "delivered" | "discrepancy",
    discrepancyReason?: string
  ): Promise<void> {
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
};
