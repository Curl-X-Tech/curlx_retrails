import {
  db,
  type LocalTripSummary,
  type LocalTripDetail,
  type LocalTripStop,
  type LocalStopItem,
} from "@/lib/dexie-db";
import { syncEngine } from "@/lib/sync-engine";
import { executeDownloadTrip } from "./download-trip-helper";
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
    return executeDownloadTrip(tripId, tripData);
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
