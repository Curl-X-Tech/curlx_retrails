import type {
  BrandName,
  DockType,
  ParkingConstraint,
  TripStatus,
  VehicleTemp,
  VehicleType,
} from "./domain";
import type { AllocatedStoreStop } from "./allocation-base";

export * from "./allocation-base";

export interface VehicleAllocation {
  id: string;
  code: string;
  vehicleId?: string;
  plateNumber: string;
  vehicleModel: string;
  vehicleCategory: "van" | "dry_lorry" | "freeze_lorry";
  vehicleType: string;
  type?: VehicleType;
  temp?: VehicleTemp;
  brand?: BrandName;
  depot?: "Peliyagoda" | "Kandy" | string;
  tripSequence?: 1 | 2;
  weeklyFuelQuotaL?: number;
  consumedFuelL?: number;
  imageUrl: string;
  driverName: string;
  driverPhone: string;
  status: TripStatus | "allocated" | "delayed";
  temperatureZone: "ambient" | "chilled" | "frozen" | "multi_temp";
  routeCode: string;
  routeName: string;
  hubName: string;
  departureTime: string;
  estimatedReturnTime: string;
  allocatedWeightKg: number;
  maxWeightKg: number;
  weightPercentage: number;
  allocatedVolumeCbm: number;
  maxVolumeCbm: number;
  volumePercentage: number;
  cratesAllocated: number;
  assignedStops: AllocatedStoreStop[];
}

export interface AllocationSummaryKPIs {
  totalVehicles: number;
  activeAllocations: number;
  totalCratesAllocated: number;
  totalWeightKg: number;
  totalVolumeCbm: number;
  averageCapacityPercentage: number;
  fullyLoadedVehicles: number;
}

export interface StoreLocation {
  id: string;
  code: string;
  outletId?: string;
  name: string;
  brand: BrandName;
  district?: string;
  dockType: DockType;
  parkingConstraint: ParkingConstraint;
  address: string;
  lat: number;
  lng: number;
  contactPhone: string;
  todayStatus: "delivered" | "in_transit" | "scheduled";
  cratesScheduled: number;
  assignedVehicle?: string;
  deliveryWindow: string;
}

export interface VehicleTrackingData {
  id: string;
  code: string;
  vehicleId?: string;
  vehicleType: string;
  vehicleCategory: VehicleType;
  temp?: VehicleTemp;
  reeferTempCelsius?: number;
  brand?: BrandName;
  depot?: "Peliyagoda" | "Kandy" | string;
  imageUrl: string;
  driverName: string;
  driverPhone: string;
  status: "en_route" | "at_stop" | "delayed";
  currentLocation: [number, number];
  heading: number;
  weightPercentage: number;
  weightKg: number;
  maxWeightKg: number;
  volumePercentage: number;
  volumeCbm: number;
  maxVolumeCbm: number;
  cratesCount: number;
  nextStop: string;
  nextStopEta: string;
  stopsTotal: number;
  stopsCompleted: number;
}

export interface MapThemePreset {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}
