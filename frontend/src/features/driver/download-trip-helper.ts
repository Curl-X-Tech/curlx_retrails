import { db, type LocalTripStop, type LocalStopItem } from "@/lib/dexie-db";
import { prefetchTripMapTiles } from "@/lib/map-tile-prefetch";

export async function executeDownloadTrip(
  tripId: string,
  tripData: unknown
): Promise<boolean> {
  try {
    const data = tripData as {
      waypoints: Array<{
        seq: number;
        outletId?: string;
        outlet_id?: string;
        outletCode?: string;
        outletName?: string;
        outlet_name?: string;
        address: string;
        lat: number;
        lng: number;
        status: string;
        stagingLocation?: string;
        deliveryWindow?: string;
        delivery_window?: string;
        storeManagerName?: string;
        contact_name?: string;
        storeManagerPhone?: string;
        contact_number?: string;
        totalWeightKg?: number;
        totalCrateCount?: number;
        arrivedAt?: string;
        arrived_at?: string;
        departedAt?: string;
        order_summary?: {
          total_weight_kg: number;
          total_crate_count: number;
          items: Array<{
            id: string;
            package_code: string;
            order_ref: string;
            sku: string;
            item_title: string;
            category: string;
            crate_count: number;
            weight_kg: number;
            volume_m3: number;
            status: string;
            special_handling_code?: string | null;
          }>;
        };
        items?: Array<{
          packageCode: string;
          orderRef: string;
          sku: string;
          itemTitle: string;
          category: string;
          crateCount: number;
          weightKg: number;
          volumeM3: number;
          isReefer: boolean;
          status: string;
          specialHandlingCode?: string | null;
        }>;
      }>;
    };

    const waypoints = data.waypoints || [];

    await db.transaction(
      "rw",
      [db.trips, db.tripDetails, db.tripStops, db.stopItems],
      async () => {
        await db.tripDetails.put({
          id: tripId,
          data: tripData as any,
          lastSyncedAt: new Date().toISOString(),
        });

        for (const wp of waypoints) {
          const outletId = wp.outletId || wp.outlet_id || "OUT001";
          const outletName = wp.outletName || wp.outlet_name || "Outlet";
          const deliveryWindow = wp.deliveryWindow || wp.delivery_window || "08:00 AM";
          const storeManagerName =
            wp.storeManagerName || wp.contact_name || "Store Manager";
          const storeManagerPhone =
            wp.storeManagerPhone || wp.contact_number || "+94 77 000 0000";
          const totalWeightKg =
            wp.totalWeightKg ?? wp.order_summary?.total_weight_kg ?? 0;
          const totalCrateCount =
            wp.totalCrateCount ?? wp.order_summary?.total_crate_count ?? 0;

          const wpStatus = (
            wp.status === "completed"
              ? "completed"
              : wp.status === "active"
                ? "active"
                : "upcoming"
          ) as "completed" | "active" | "upcoming";

          const stopRecord: LocalTripStop = {
            id: `${tripId}_wp_${wp.seq}`,
            tripId,
            seq: wp.seq,
            outletId,
            outletCode: wp.outletCode || outletId,
            outletName,
            address: wp.address,
            lat: wp.lat,
            lng: wp.lng,
            status: wpStatus,
            stagingLocation: wp.stagingLocation || `Bay #${wp.seq}`,
            deliveryWindow,
            storeManagerName,
            storeManagerPhone,
            totalWeightKg,
            totalCrateCount,
            arrivedAt: wp.arrivedAt || wp.arrived_at || undefined,
            departedAt: wp.departedAt,
          };
          await db.tripStops.put(stopRecord);

          const itemsList =
            wp.items ||
            (wp.order_summary?.items
              ? wp.order_summary.items.map((i) => ({
                  packageCode: i.package_code,
                  orderRef: i.order_ref,
                  sku: i.sku,
                  itemTitle: i.item_title,
                  category: i.category,
                  crateCount: i.crate_count,
                  weightKg: i.weight_kg,
                  volumeM3: i.volume_m3,
                  isReefer: i.special_handling_code === "COL",
                  status: i.status,
                  specialHandlingCode: i.special_handling_code,
                }))
              : []);

          for (const item of itemsList) {
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
              status:
                item.status === "delivered"
                  ? "delivered"
                  : item.status === "discrepancy"
                    ? "discrepancy"
                    : "pending",
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

    void prefetchTripMapTiles(waypoints.map((w) => ({ lat: w.lat, lng: w.lng })));
    return true;
  } catch {
    return false;
  }
}
