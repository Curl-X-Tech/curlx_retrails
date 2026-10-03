import type {
  BrandName,
  DockType,
  ParkingConstraint,
  TempRequirement,
} from "@/types/domain";
import type {
  AllocationDriverDetails,
  AllocationManifestDetail,
  AllocationSummaryKPIs,
  AllocationVehiclePosition,
  AllocationVehicleSpec,
  AllocationWaypoint,
  AssignedStop,
  CargoItem,
  OrderQueueKPIs,
  QueuedOrder,
  VehicleAllocation,
} from "@/types";
import type { StoreOrderGroup } from "@/types";
import type {
  DeferralAuditLog,
  DeferralReason,
  DeferralSummary,
  DeferredOrder,
  LimitingResource,
} from "@/api/deferrals";

export interface CarryoverOrder {
  id: string;
  orderRef: string;
  outletId: string;
  outletName: string;
  brand: BrandName;
  district: string;
  dockType: DockType;
  parkingConstraint: ParkingConstraint;
  tempRequirement: TempRequirement;
  totalItems: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalValueLkr: number;
  deferredYesterday: 0 | 1;
  daysSinceLastServed: number;
  deferralReason: string;
  limitingResource: string;
  suggestedVehicleCategory: string;
  notes?: string;
}

export interface DeferralAuditRecord {
  id: string;
  orderId: string;
  orderRef: string;
  outletId: string;
  outletName: string;
  brand: BrandName;
  district: string;
  dispatchDate: string;
  deferralReason: string;
  limitingResource: string;
  decisionMakerStaffId: string;
  decisionMakerName: string;
  decisionMakerRole: string;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalValueLkr: number;
  tempRequirement: TempRequirement;
  dockType: DockType;
  notes?: string;
  createdAt: string;
}

export interface CarryoverSummaryKPIs {
  totalCarryoverOrders: number;
  criticalEscalationCount: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalValueLkr: number;
  chilledOrdersCount: number;
  ambientOrdersCount: number;
  vanRestrictedCount: number;
}

export type {
  BrandName,
  DockType,
  ParkingConstraint,
  TempRequirement,
  AllocationDriverDetails,
  AllocationManifestDetail,
  AllocationSummaryKPIs,
  AllocationVehiclePosition,
  AllocationVehicleSpec,
  AllocationWaypoint,
  AssignedStop,
  CargoItem,
  OrderQueueKPIs,
  QueuedOrder,
  StoreOrderGroup,
  VehicleAllocation,
  DeferralAuditLog,
  DeferralReason,
  DeferralSummary,
  DeferredOrder,
  LimitingResource,
};

export type QueueViewMode = "table" | "grid";
export type QueueSortKey =
  "orderRef" | "outlet" | "weight" | "volume" | "value" | "window";

export type DeferralsViewMode = "carryover" | "deferral-log" | "audit-log";
export type CarryoverGroupBy = "none" | "action" | "reason";
export type AuditGroupBy = "none" | "action" | "reason";
export type AuditSortKey =
  "orderRef" | "outlet" | "date" | "reason" | "resource" | "weight" | "volume" | "value";

export type AllocationViewMode = "grid" | "table";
export type AllocationSortKey =
  "plateNumber" | "crates" | "weight" | "volume" | "departure" | "status";
export type AllocationCategoryFilter = "all" | "van" | "lorry";
export type AllocationStatusFilter =
  "all" | "dispatched" | "loading" | "allocated" | "completed";
