// ============================================================
// ReTrails (Team CurlX) - Dispatcher Allocation Workspace & UI Types
// ============================================================

import type {
  BrandName,
  DockType,
  ParkingConstraint,
  SpecialHandlingCode,
  StaffRole,
  TripStatus,
  VehicleTemp,
  VehicleType,
  WaypointStatus,
} from "./domain";

export interface CargoItem {
  id: string;
  code: string;
  weightKg: number;
  store: string;
  stopSeq: number;
  stopName: string;
  destination: string;
  shc: SpecialHandlingCode;
}

export interface AllocationDriverDetails {
  employeeCode?: string;
  name: string;
  email?: string;
  role: StaffRole | string;
  designation?: string;
  licenseId: string;
  licenseClass?: string;
  licenseExpiryDate?: string;
  phone: string;
  avatarText: string;
  bloodGroup?: string;
  rating?: number;
  deliveriesCompleted?: number;
  shiftStatus?: string;
  dutyStartTime?: string;
  shiftHoursWorked?: number;
  maxShiftHours?: number;
}

export interface AllocationVehicleSpec {
  unitId: string;
  vehicleId?: string;
  model: string;
  regNumber: string;
  sealNumber: string;
  type?: VehicleType;
  temp?: VehicleTemp;
  maxPayloadKg: number;
  boxVolumeCbm: number;
  weeklyFuelQuotaL?: number;
  consumedFuelL?: number;
}

export interface AllocationWaypoint {
  seq: number;
  outletId?: string;
  name: string;
  lat: number;
  lng: number;
  crates: number;
  eta: string;
  status: WaypointStatus;
}

export interface AllocationVehiclePosition {
  lat: number;
  lng: number;
  heading?: number;
  speedKmH?: number;
  reeferTempCelsius?: number;
  ambientTempCelsius?: number;
  lastUpdated?: string;
}

export interface AllocationManifestDetail {
  id: string;
  manifestCode: string;
  allocationId: string;
  tripCode?: string;
  tripSequence?: 1 | 2;
  brand?: BrandName;
  district?: string;
  depot?: "Peliyagoda" | "Kandy" | string;
  driver: AllocationDriverDetails;
  specs: AllocationVehicleSpec;
  payloadKg: number;
  maxPayloadKg: number;
  payloadPercentage: number;
  volumeCbm: number;
  maxVolumeCbm: number;
  volumePercentage: number;
  vehiclePosition?: AllocationVehiclePosition;
  waypoints: AllocationWaypoint[];
  cargoList: CargoItem[];
}

export interface AllocatedStoreStop {
  id: string;
  outletId?: string;
  name: string;
  chain: string;
  address: string;
  crates: number;
  deliveryWindow: string;
  sequence: number;
}

export type AssignedStop = AllocatedStoreStop;

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
