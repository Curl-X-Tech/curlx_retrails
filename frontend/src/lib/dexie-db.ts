import Dexie, { type Table } from "dexie";
import type { DriverTrip } from "@/data/mock-driver-trips";

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

export interface MutationRecord {
  id?: number; // Auto-incremented
  tripId: string;
  entityType: "trip" | "stop" | "item" | "telemetry" | "break";
  actionType: string; // e.g., 'ARRIVE_STOP', 'COMPLETE_STOP', 'VERIFY_ITEM', 'RECORD_BREAK'
  payload: Record<string, unknown>;
  timestamp: string; // ISO UTC string
  syncStatus: "pending" | "syncing" | "synced" | "failed";
  retryCount: number;
  errorMessage?: string;
}

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

export class RetrailsDriverDatabase extends Dexie {
  trips!: Table<LocalTripSummary, string>;
  tripDetails!: Table<LocalTripDetail, string>;
  tripStops!: Table<LocalTripStop, string>;
  stopItems!: Table<LocalStopItem, string>;
  mutationQueue!: Table<MutationRecord, number>;
  driverTelemetry!: Table<LocalTelemetryRecord, number>;
  userSessions!: Table<UserSessionRecord, string>;

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
  }
}

export const db = new RetrailsDriverDatabase();
