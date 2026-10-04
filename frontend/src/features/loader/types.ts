import type {
  SpecialHandlingCode,
  DockType,
  ParkingConstraint,
  BayCoordinates,
} from "@/types/domain";

export type { SpecialHandlingCode, DockType, ParkingConstraint };
export type { BayCoordinates };

export interface LoaderOrderItem {
  id: string;
  orderRef: string;
  packageCode: string;
  sku: string;
  itemTitle: string;
  category: string;
  crateCount: number;
  weightKg: number;
  volumeM3: number;
  unitPriceLkr?: number;
  totalPriceLkr?: number;
  temperature: string;
  isReefer: boolean;
  specialHandlingCode?: SpecialHandlingCode | null;
  bayCoordinates: BayCoordinates;
  stagingBay: string;
  status: "pending" | "scanned" | "verified" | "flagged";
  notes?: string;
}

export interface LoaderWaypoint {
  seq: number;
  loadOrder?: number;
  outletId: string;
  outletCode: string;
  outletName: string;
  dockType: DockType;
  deliveryWindow: string;
  parkingConstraint?: ParkingConstraint;
  isSealed?: boolean;
  sealedAt?: string | null;
  items: LoaderOrderItem[];
}

export interface LoaderVehicleTrip {
  id: string;
  tripCode: string;
  tripSequence: number;
  sealNumber: string;
  vehicleId: string;
  regNumber: string;
  modelName: string;
  type: "truck" | "van";
  temp: "reefer" | "ambient";
  weightCapKg: number;
  volumeCapM3: number;
  imagePath: string;
  depotName: string;
  stopsCount: number;
  nextStopName: string;
  dispatchDate?: string;
  plannedDepartureTime: string;
  departureCountdownMinutes: number;
  status:
    | "scheduled"
    | "loading"
    | "ready"
    | "dispatched"
    | "in_transit"
    | "completed"
    | "flagged";
  dockBay: string;
  dispatchedAt?: string;
  verifiedItemsCount?: number;
  totalItemsCount?: number;
  flagReason?: string;
  driver: {
    name: string;
    designation: string;
    licenseId: string;
    phone: string;
    avatarInitials: string;
  };
  payload: {
    currentKg: number;
    maxKg: number;
    percentage: number;
    secondaryMetric: string;
    currentVolumeM3: number;
    maxVolumeM3: number;
  };
  waypoints: LoaderWaypoint[];
}

export type ManifestStatusFilter =
  | "scheduled"
  | "loading"
  | "ready"
  | "dispatched"
  | "in_transit"
  | "completed"
  | "flagged"
  | "all";

export type VehicleTypeFilter = "all" | "truck" | "van";
export type TempFilter = "all" | "reefer" | "ambient";
export type ManifestViewMode = "table" | "grid";

export type DiscrepancyType = "shortage" | "damaged" | "temp_breach" | "wrong_barcode";
