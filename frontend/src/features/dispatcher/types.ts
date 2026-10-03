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
import type {
  CarryoverOrder,
  CarryoverSummaryKPIs,
  DeferralAuditRecord,
} from "@/data/mock-deferrals";
import type { getStoreGroupedOrders } from "@/data/mock-orders";

export type StoreOrderGroup = ReturnType<typeof getStoreGroupedOrders>[number];

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
  CarryoverOrder,
  CarryoverSummaryKPIs,
  DeferralAuditRecord,
  OrderQueueKPIs,
  QueuedOrder,
  VehicleAllocation,
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
