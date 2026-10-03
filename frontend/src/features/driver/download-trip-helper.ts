import { db, type LocalTripStop, type LocalStopItem } from "@/lib/dexie-db";
import { prefetchTripMapTiles } from "@/lib/map-tile-prefetch";
import type { DriverTrip } from "./types";

export async function executeDownloadTrip(
  tripId: string,
  tripData: DriverTrip
): Promise<boolean> {
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
}
