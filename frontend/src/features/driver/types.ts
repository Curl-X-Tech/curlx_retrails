import type {
  SpecialHandlingCode,
  DockType,
  ParkingConstraint,
} from "@/data/mock-loader-bays";
import type {
  LocalTripSummary,
  LocalTripDetail,
  LocalTripStop,
  LocalStopItem,
  MutationRecord,
  LocalTelemetryRecord,
} from "@/lib/dexie-db";

export interface DriverOrderItem {
  id: string;
  orderRef: string;
  packageCode: string;
  sku: string;
  itemTitle: string;
  category: string;
  crateCount: number;
  weightKg: number;
  volumeM3: number;
  temperature: string;
  isReefer: boolean;
  specialHandlingCode?: SpecialHandlingCode | null;
  status: "pending" | "delivered" | "discrepancy";
}

export interface DriverWaypoint {
  seq: number;
  outletId: string;
  outletCode: string;
  outletName: string;
  address: string;
  lat: number;
  lng: number;
  dockType: DockType;
  parkingConstraint?: ParkingConstraint;
  stagingLocation: string;
  deliveryWindow: string;
  storeManagerName: string;
  storeManagerPhone: string;
  totalWeightKg: number;
  totalCrateCount: number;
  status: "completed" | "active" | "upcoming";
  arrivedAt?: string;
  departedAt?: string;
  items: DriverOrderItem[];
}

export interface DriverTrip {
  id: string;
  tripCode: string;
  sealNumber: string;
  vehicleId: string;
  regNumber: string;
  modelName: string;
  type: "truck" | "van";
  temp: "reefer" | "ambient";
  weightCapKg: number;
  volumeCapM3: number;
  reeferCurrentTempC?: number;
  reeferTargetTempC?: number;
  fuelType: "diesel" | "petrol" | "electric";
  kmPerL: number;
  weeklyFuelQuotaL: number;
  fuelRemainingL: number;
  currentOdometerKm: number;
  depotName: string;
  depotLat: number;
  depotLng: number;
  driver: {
    id: string;
    name: string;
    designation: string;
    licenseId: string;
    phone: string;
    avatarInitials: string;
  };
  status: "in_transit" | "paused" | "completed";
  activeWaypointSeq: number;
  plannedDepartureTime: string;
  estimatedReturnTime: string;
  breakDurationMinutes: number;
  onBreak: boolean;
  waypoints: DriverWaypoint[];
}

export type {
  LocalTripSummary,
  LocalTripDetail,
  LocalTripStop,
  LocalStopItem,
  MutationRecord,
  LocalTelemetryRecord,
};
