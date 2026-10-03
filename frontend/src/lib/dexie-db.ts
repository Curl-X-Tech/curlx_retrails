import Dexie, { type Table } from "dexie";
import type { DriverTrip } from "@/data/mock-driver-trips";
import type { QueuedMutation } from "@/api/sync/types";

export interface LocalTripSummary {
  id: string; // tripId e.g. "trip-4811"
  tripCode: string; // e.g. "RT-14"
  driverId: string;
  driverName: string;
  date: string; // YYYY-MM-DD
  status: "pending" | "dispatched" | "in_transit" | "completed";
  vehicleId: string;
  regNumber: string;
  modelName: string;
  depotName: string;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalStops: number;
  isDownloaded: boolean;
  downloadedAt: string | null;
  updatedAt: string;
}

export interface LocalTripDetail {
  id: string; // tripId
  data: DriverTrip;
  lastSyncedAt: string;
}

export interface LocalTripStop {
  id: string; // `${tripId}_wp_${seq}`
  tripId: string;
  seq: number;
  outletId: string;
  outletCode: string;
  outletName: string;
  address: string;
  lat: number;
  lng: number;
  status: "upcoming" | "active" | "completed";
  stagingLocation: string;
  deliveryWindow: string;
  storeManagerName: string;
  storeManagerPhone: string;
  totalWeightKg: number;
  totalCrateCount: number;
  arrivedAt?: string;
  departedAt?: string;
}

export interface LocalStopItem {
  id: string; // `${tripId}_${packageCode}`
  tripId: string;
  stopSeq: number;
  packageCode: string;
  orderRef: string;
  sku: string;
  itemTitle: string;
  category: string;
  crateCount: number;
  weightKg: number;
  volumeM3: number;
  isReefer: boolean;
  status: "pending" | "delivered" | "discrepancy";
  specialHandlingCode?: string | null;
  verifiedAt?: string;
  discrepancyReason?: string;
}

export type MutationRecord = QueuedMutation;

export interface LocalTelemetryRecord {
  id?: number;
  tripId: string;
  vehicleId: string;
  lat: number;
  lng: number;
  speedKmh: number;
  reeferTempC?: number;
  fuelRemainingL: number;
  recordedAt: string;
  syncStatus: "pending" | "synced";
}

export interface UserSessionRecord {
  id: string;
  email: string;
  name: string;
  role: "system_admin" | "dispatcher" | "loader" | "driver" | "store_manager";
  depotId?: string;
  depotName?: string;
  userType?: string;
  isActive?: boolean;
  isVerified?: boolean;
  cachedAt: string;
}

export interface MasterCacheEntry {
  key: string;
  data: unknown;
  cachedAt: string;
}

export class RetrailsDriverDatabase extends Dexie {
  trips!: Table<LocalTripSummary, string>;
  tripDetails!: Table<LocalTripDetail, string>;
  tripStops!: Table<LocalTripStop, string>;
  stopItems!: Table<LocalStopItem, string>;
  mutationQueue!: Table<QueuedMutation, number>;
  driverTelemetry!: Table<LocalTelemetryRecord, number>;
  userSessions!: Table<UserSessionRecord, string>;
  masterCache!: Table<MasterCacheEntry, string>;

  constructor() {
    super("curlx_retrails_driver_db");

    this.version(1).stores({
      trips: "id, tripCode, driverId, date, status, isDownloaded",
      tripDetails: "id",
      tripStops: "id, tripId, seq, status",
      stopItems: "id, tripId, stopSeq, packageCode, status",
      mutationQueue: "++id, tripId, syncStatus, timestamp, actionType",
      driverTelemetry: "++id, tripId, syncStatus, recordedAt",
    });

    this.version(2).stores({
      userSessions: "id, email, role",
    });

    this.version(3).stores({
      masterCache: "key, cachedAt",
    });

    this.version(4)
      .stores({
        mutationQueue:
          "++created_seq, idempotency_key, entity_type, status, client_timestamp, user_id",
      })
      .upgrade((tx) => {
        return tx
          .table("mutationQueue")
          .toCollection()
          .modify((record: Record<string, unknown>) => {
            if (!record.idempotency_key) {
              record.idempotency_key =
                (record.idempotencyKey as string) || crypto.randomUUID();
            }
            if (!record.entity_type) {
              const legacyEntity = record.entityType as string;
              record.entity_type =
                legacyEntity === "order"
                  ? "order"
                  : legacyEntity === "telemetry"
                    ? "telemetry"
                    : legacyEntity === "item"
                      ? "loading_checklist"
                      : "route_leg";
            }
            if (!record.action) {
              const actionType = record.actionType as string;
              record.action =
                actionType === "CREATE_ORDER" || actionType === "TELEMETRY_PING"
                  ? "create"
                  : actionType === "VERIFY_ITEM"
                    ? "verify"
                    : "update";
            }
            if (!record.status) {
              const syncStatus = record.syncStatus as string;
              record.status =
                syncStatus === "syncing"
                  ? "sending"
                  : syncStatus === "failed"
                    ? "failed"
                    : "queued";
            }
            if (record.client_timestamp === undefined) {
              record.client_timestamp =
                (record.timestamp as string) || new Date().toISOString();
            }
            if (record.user_id === undefined) {
              record.user_id = (record.userId as string) || "";
            }
            if (record.attempts === undefined) {
              record.attempts = (record.retryCount as number) || 0;
            }
            if (record.last_error === undefined) {
              record.last_error = (record.errorMessage as string) || null;
            }
            if (record.created_seq === undefined && typeof record.id === "number") {
              record.created_seq = record.id;
            }
          });
      });
  }
}

export const db = new RetrailsDriverDatabase();
