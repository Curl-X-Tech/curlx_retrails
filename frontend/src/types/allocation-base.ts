import type {
  BrandName,
  SpecialHandlingCode,
  StaffRole,
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
