export type SpecialHandlingCode = "COL" | "FRG" | "MAL" | "HAZ";
export type DockType = "rear_dock" | "street" | "mall_bay";
export type ParkingConstraint = "normal" | "van_only" | "mall_dock";

export interface BayCoordinates {
  bayX: number;
  bayY: number;
  bayZ: number;
}

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
  outletId: string;
  outletCode: string;
  outletName: string;
  dockType: DockType;
  deliveryWindow: string;
  parkingConstraint?: ParkingConstraint;
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
  plannedDepartureTime: string;
  departureCountdownMinutes: number;
  status: "loading" | "ready" | "dispatched" | "flagged";
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

export type ManifestStatusFilter = "loading" | "ready" | "dispatched" | "flagged" | "all";
export type VehicleTypeFilter = "all" | "truck" | "van";
export type TempFilter = "all" | "reefer" | "ambient";
export type ManifestViewMode = "table" | "grid";

export type DiscrepancyType = "shortage" | "damaged" | "temp_breach" | "wrong_barcode";
