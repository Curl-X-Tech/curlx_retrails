// ============================================================
// ReTrails (Team CurlX) - Domain Entities & Core Database Types
// Strictly mirrors PostgreSQL 15+ Master Schema in docs/schema/schema.sql
// ============================================================

// ------------------------------------------------------------
// 1. Enums & Status Literals
// ------------------------------------------------------------

export type StaffRole =
  "system_admin" | "dispatcher" | "loader" | "driver" | "store_manager";

export type VehicleType = "truck" | "van";
export type VehicleTemp = "reefer" | "ambient";
export type VehicleStatus =
  "available" | "loading" | "in_transit" | "in_workshop" | "breakdown";

export type DockType = "rear_dock" | "street" | "mall_bay";
export type ParkingConstraint = "normal" | "van_only" | "mall_dock";

export type BrandCode = "FRESH" | "STYLE" | "TECH";
export type BrandName = "Fresh" | "Style" | "Tech";

export type TempRequirement = "chilled" | "ambient";
export type SpecialHandlingCode = "COL" | "FRG" | "MAL" | "HAZ" | "GEN";

export type OrderStatus = "pending" | "served" | "deferred" | "cancelled";

export type TripStatus =
  "scheduled" | "loading" | "dispatched" | "in_transit" | "completed" | "cancelled";

export type WaypointStatus =
  | "pending"
  | "in_transit"
  | "arrived"
  | "completed"
  | "skipped"
  | "newly_added"
  | "upcoming"
  | "current";

export type ChecklistStatus = "pending" | "scanned" | "verified" | "flagged";

export type DiscrepancyType =
  "damaged" | "shortage" | "rejected" | "temp_breach" | "delayed_window";

export type ResolutionStatus = "open" | "under_investigation" | "resolved" | "waived";

export type SyncBatchStatus = "processing" | "success" | "partial_error" | "failed";

export type SyncMutationStatus =
  "applied" | "duplicate_ignored" | "conflict_resolved" | "failed";

// ------------------------------------------------------------
// 2. Master Domain Entities
// ------------------------------------------------------------

export interface Depot {
  id: string;
  code: string;
  name: "Peliyagoda" | "Kandy" | string;
  latitude: number;
  longitude: number;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface District {
  id: string;
  name: string;
  province: "Western" | "Central" | string;
  assignedDepotId: string;
  createdAt: string;
}

export interface Brand {
  id: string;
  code: BrandCode;
  name: BrandName;
  deliveryWindowType: string;
  requiresColdChain: boolean;
  dailyTimeBudgetMin: number; // Fresh: 270, Style/Tech: 480
  createdAt: string;
  updatedAt: string;
}

export interface CalendarDay {
  date: string; // 'YYYY-MM-DD'
  dow: number; // 0 = Monday
  dowName: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  isWeekend: boolean;
  isoYear: number;
  isoWeek: number;
  isPayday: boolean;
  festival?: string;
  festivalRamp: number; // 0.0 to 1.0
  isHoliday: boolean;
  monsoon: boolean;
  isOperating: boolean;
  createdAt: string;
}

export interface Outlet {
  id: string;
  outletId: string; // 'OUT001' - 'OUT120'
  brandId: string;
  districtId: string;
  depotId: string;
  name: string;
  dockType: DockType;
  parkingConstraint: ParkingConstraint;
  mallWindow?: string;
  windowOpenTime: string; // 'HH:MM:SS'
  windowCloseTime: string; // 'HH:MM:SS'
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  sku: string;
  brandId: string;
  name: string;
  category: string;
  unitWeightKg: number;
  unitVolumeM3: number;
  requiresColdChain: boolean;
  specialHandlingCode?: SpecialHandlingCode;
  createdAt: string;
  updatedAt: string;
}

export interface PriceList {
  id: string;
  itemId: string;
  costPrice: number;
  unitPrice: number;
  currency: "LKR" | string;
  effectiveFrom: string; // 'YYYY-MM-DD'
  effectiveTo?: string | null;
  priceChangeReason?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffProfile {
  id: string;
  employeeCode: string; // 'ADM-001', 'DSP-101', 'DRV-301'
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  depotId?: string;
  outletId?: string;
  bloodGroup?: string;
  licenseNumber?: string;
  licenseClass?: string;
  licenseExpiry?: string;
  safetyRating?: number;
  totalCompletedTrips?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  vehicleId: string; // 'VEH001' - 'VEH060'
  regNumber: string; // 'NP-4811'
  modelName: string; // 'Isuzu ELF NPR'
  type: VehicleType;
  temp: VehicleTemp;
  weightCapKg: number;
  volumeCapM3: number;
  fuelType: "diesel" | string;
  kmPerL: number;
  weeklyFuelQuotaL: number;
  consumedFuelL: number;
  depotId: string;
  assignedDriverId?: string;
  status: VehicleStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrder {
  id: string;
  orderRef: string; // 'S1-000', 'ORD-2024-88491'
  outletId: string;
  createdByStaffId?: string;
  orderDate: string;
  requiredDate: string;
  tempRequirement: TempRequirement;
  status: OrderStatus;
  isUrgent: boolean;
  deferredYesterday: 0 | 1;
  daysSinceLastServed: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  itemId: string;
  packageCode: string; // 'PKG-90412-A'
  requestedQty: number;
  loadedQty: number;
  deliveredQty: number;
  unitWeightKg: number;
  unitVolumeM3: number;
  unitPrice: number;
  specialHandlingCode?: SpecialHandlingCode;
  createdAt: string;
}

export interface DeferralAuditLog {
  id: string;
  orderId: string;
  outletId: string;
  dispatchDate: string;
  deferralReason: string;
  limitingResource:
    "weight_cap" | "volume_cap" | "time_budget" | "fleet_downtime" | string;
  decisionMakerStaffId: string;
  notes?: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  tripCode: string; // 'RT-14', 'TRP-8820'
  dispatchDate: string;
  tripSequence: 1 | 2; // Max 2 trips per vehicle per day
  vehicleId: string;
  driverId: string;
  depotId: string;
  brandId: string; // Feasibility Rule 1: Single Brand
  districtId: string; // Feasibility Rule 1: Single District
  sealNumber?: string;
  status: TripStatus;
  plannedStartTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  outboundTravelMin: number;
  interStopTravelMin: number;
  totalHandlingMin: number;
  totalTripDurationMin: number;
  totalDistanceKm: number;
  createdAt: string;
  updatedAt: string;
}

export interface RouteLeg {
  id: string;
  legId: string;
  tripId: string;
  seq: number;
  fromPoint: string; // 'DEPOT' or previous outlet
  toOutletId: string;
  orderId?: string;
  distanceKm: number;
  plannedDepartTime: string;
  plannedTravelDurationMin: number;
  plannedArrivalTime: string;
  actualDepartTime?: string;
  actualTravelDurationMin?: number;
  arrivalTime?: string;
  leaveOutletTime?: string;
  status: WaypointStatus;
  isPostDispatchAdded: boolean;
  createdAt: string;
}

export interface CargoBayAllocation {
  id: string;
  tripId: string;
  orderItemId: string;
  bayX: number; // 1 to 4
  bayY: number; // 1 to 6
  bayZ: number; // 1 (floor) to 2 (stacked)
  isLoaded: boolean;
  createdAt: string;
}

export interface LoadingChecklistItem {
  id: string;
  tripId: string;
  orderItemId: string;
  status: ChecklistStatus;
  scannedBarcode?: string;
  verifiedByStaffId?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProofOfDelivery {
  id: string;
  tripId: string;
  orderId: string;
  outletId: string;
  recipientName: string;
  recipientPhone?: string;
  signatureSvg: string;
  deliveredAt: string;
  deliveryLat: number;
  deliveryLng: number;
  temperatureReading?: number;
  photoEvidenceUrl?: string;
  isOfflineSynced: boolean;
  createdAt: string;
}

export interface DiscrepancyReport {
  id: string;
  tripId: string;
  orderId: string;
  orderItemId?: string;
  discrepancyType: DiscrepancyType;
  reportedQty?: number;
  reportedByStaffId: string;
  reportedAt: string;
  description: string;
  photoUrl?: string;
  resolutionStatus: ResolutionStatus;
  resolvedByStaffId?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface VehicleTelemetry {
  id: number;
  vehicleId: string;
  tripId?: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  headingDeg: number;
  reeferTempCelsius?: number;
  ambientTempCelsius?: number;
  fuelLevelPct?: number;
  batteryPct?: number;
}

export interface SyncBatchLog {
  id: string;
  batchId: string;
  clientId: string;
  staffId?: string;
  totalMutations: number;
  processedCount: number;
  failedCount: number;
  clientStartedAt: string;
  clientCompletedAt: string;
  serverReceivedAt: string;
  status: SyncBatchStatus;
  errorSummary?: string;
}

export interface SyncMutationAuditLog {
  id: string;
  batchId: string;
  idempotencyKey: string;
  entityName: string;
  entityId: string;
  action: "insert" | "update" | "delete";
  payloadJson: Record<string, unknown>;
  beforeSnapshot?: Record<string, unknown>;
  clientTimestamp: string;
  serverTimestamp: string;
  status: SyncMutationStatus;
  errorMessage?: string;
}
