import type {
  BrandName,
  DockType,
  ParkingConstraint,
  TempRequirement,
} from "@/types/domain";

export interface DeferralAuditRecord {
  id: string;
  orderId: string;
  orderRef: string;
  outletId: string;
  outletName: string;
  brand: BrandName;
  district: string;
  dispatchDate: string;
  deferralReason:
    | "insufficient_reefer_capacity"
    | "van_access_shortage"
    | "time_budget_limit"
    | "fuel_quota_exceeded";
  limitingResource: "weight_cap" | "volume_cap" | "time_budget" | "fleet_downtime";
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

export interface CarryoverSummaryKPIs {
  totalCarryoverOrders: number;
  criticalEscalationCount: number; // deferredYesterday === 1 (Cannot skip tomorrow)
  totalWeightKg: number;
  totalVolumeM3: number;
  totalValueLkr: number;
  chilledOrdersCount: number;
  ambientOrdersCount: number;
  vanRestrictedCount: number;
}

export const mockCarryoverOrders: CarryoverOrder[] = [
  {
    id: "ord-cov-01",
    orderRef: "S1-004",
    outletId: "OUT004",
    outletName: "Waypoint Fresh - Wattala",
    brand: "Fresh",
    district: "Gampaha",
    dockType: "street",
    parkingConstraint: "van_only",
    tempRequirement: "chilled",
    totalItems: 4,
    totalWeightKg: 540.0,
    totalVolumeM3: 3.2,
    totalValueLkr: 345000,
    deferredYesterday: 1,
    daysSinceLastServed: 2,
    deferralReason: "van_access_shortage",
    limitingResource: "volume_cap",
    suggestedVehicleCategory: "Reefer Van (4.5 m³)",
    notes:
      "Street parking allows van-only access. Reefer vans were fully saturated in Wave 1. Mandatory dispatch tomorrow morning.",
  },
  {
    id: "ord-cov-02",
    orderRef: "S1-018",
    outletId: "OUT018",
    outletName: "Waypoint Fresh - Kandy City Centre",
    brand: "Fresh",
    district: "Kandy",
    dockType: "mall_bay",
    parkingConstraint: "mall_dock",
    tempRequirement: "chilled",
    totalItems: 5,
    totalWeightKg: 620.0,
    totalVolumeM3: 4.1,
    totalValueLkr: 412000,
    deferredYesterday: 1,
    daysSinceLastServed: 2,
    deferralReason: "insufficient_reefer_capacity",
    limitingResource: "time_budget",
    suggestedVehicleCategory: "Reefer Van / Light Truck",
    notes:
      "Strict Mall Bay delivery window (09:00 - 11:00 AM) exceeded regional driver time budget. Auto-locked into Priority 1 for tomorrow.",
  },
  {
    id: "ord-cov-03",
    orderRef: "S1-032",
    outletId: "OUT032",
    outletName: "Waypoint Style - Havelock Town",
    brand: "Style",
    district: "Colombo",
    dockType: "rear_dock",
    parkingConstraint: "normal",
    tempRequirement: "ambient",
    totalItems: 3,
    totalWeightKg: 380.0,
    totalVolumeM3: 4.8,
    totalValueLkr: 680000,
    deferredYesterday: 0,
    daysSinceLastServed: 1,
    deferralReason: "time_budget_limit",
    limitingResource: "time_budget",
    suggestedVehicleCategory: "14ft Dry Lorry (12.0 m³)",
    notes:
      "Route exceeded daily driver 480 min budget due to evening traffic along Galle Road. Shifted to tomorrow morning Wave 1.",
  },
  {
    id: "ord-cov-04",
    orderRef: "S1-045",
    outletId: "OUT045",
    outletName: "Waypoint Tech - Negombo Retail Hub",
    brand: "Tech",
    district: "Gampaha",
    dockType: "rear_dock",
    parkingConstraint: "normal",
    tempRequirement: "ambient",
    totalItems: 2,
    totalWeightKg: 210.0,
    totalVolumeM3: 2.4,
    totalValueLkr: 1450000,
    deferredYesterday: 0,
    daysSinceLastServed: 1,
    deferralReason: "fuel_quota_exceeded",
    limitingResource: "fleet_downtime",
    suggestedVehicleCategory: "14ft Dry Lorry / Ambient Van",
    notes:
      "Assigned vehicle underwent scheduled 5000km workshop maintenance. Vehicle returning to active fleet tomorrow at 04:00 AM.",
  },
];

export const mockCarryoverKPIs: CarryoverSummaryKPIs = {
  totalCarryoverOrders: 4,
  criticalEscalationCount: 2,
  totalWeightKg: 1750.0,
  totalVolumeM3: 14.5,
  totalValueLkr: 2887000,
  chilledOrdersCount: 2,
  ambientOrdersCount: 2,
  vanRestrictedCount: 2,
};

export const mockDeferralAuditLogs: DeferralAuditRecord[] = [
  {
    id: "def-01",
    orderId: "ord-cov-01",
    orderRef: "S1-004",
    outletId: "OUT004",
    outletName: "Waypoint Fresh - Wattala",
    brand: "Fresh",
    district: "Gampaha",
    dispatchDate: "2026-10-01",
    deferralReason: "van_access_shortage",
    limitingResource: "volume_cap",
    decisionMakerStaffId: "EMP-001",
    decisionMakerName: "K. Jayawardena",
    decisionMakerRole: "Lead Dispatcher",
    totalWeightKg: 540.0,
    totalVolumeM3: 3.2,
    totalValueLkr: 345000,
    tempRequirement: "chilled",
    dockType: "street",
    notes:
      "Street parking in Wattala constrained to van access only. 4 reefer vans already allocated to Wave 1. Deferred with mandatory escalation.",
    createdAt: "2026-10-01T04:15:22+05:30",
  },
  {
    id: "def-02",
    orderId: "ord-cov-02",
    orderRef: "S1-018",
    outletId: "OUT018",
    outletName: "Waypoint Fresh - Kandy City Centre",
    brand: "Fresh",
    district: "Kandy",
    dispatchDate: "2026-10-01",
    deferralReason: "insufficient_reefer_capacity",
    limitingResource: "time_budget",
    decisionMakerStaffId: "EMP-001",
    decisionMakerName: "K. Jayawardena",
    decisionMakerRole: "Lead Dispatcher",
    totalWeightKg: 620.0,
    totalVolumeM3: 4.1,
    totalValueLkr: 412000,
    tempRequirement: "chilled",
    dockType: "mall_bay",
    notes:
      "Mall delivery window 09:00 - 11:00 AM caused driver shift to exceed 270 min morning budget. Priority 1 lock-in tomorrow.",
    createdAt: "2026-10-01T04:22:10+05:30",
  },
  {
    id: "def-03",
    orderId: "ord-cov-03",
    orderRef: "S1-032",
    outletId: "OUT032",
    outletName: "Waypoint Style - Havelock Town",
    brand: "Style",
    district: "Colombo",
    dispatchDate: "2026-10-01",
    deferralReason: "time_budget_limit",
    limitingResource: "time_budget",
    decisionMakerStaffId: "EMP-004",
    decisionMakerName: "S. Fernando",
    decisionMakerRole: "Senior Dispatcher",
    totalWeightKg: 380.0,
    totalVolumeM3: 4.8,
    totalValueLkr: 680000,
    tempRequirement: "ambient",
    dockType: "rear_dock",
    notes:
      "Heavy congestion along baseline corridor would cause driver timeout. Reallocated to tomorrow 06:00 AM departure.",
    createdAt: "2026-10-01T05:01:45+05:30",
  },
  {
    id: "def-04",
    orderId: "ord-cov-04",
    orderRef: "S1-045",
    outletId: "OUT045",
    outletName: "Waypoint Tech - Negombo Retail Hub",
    brand: "Tech",
    district: "Gampaha",
    dispatchDate: "2026-10-01",
    deferralReason: "fuel_quota_exceeded",
    limitingResource: "fleet_downtime",
    decisionMakerStaffId: "EMP-001",
    decisionMakerName: "K. Jayawardena",
    decisionMakerRole: "Lead Dispatcher",
    totalWeightKg: 210.0,
    totalVolumeM3: 2.4,
    totalValueLkr: 1450000,
    tempRequirement: "ambient",
    dockType: "rear_dock",
    notes:
      "Assigned vehicle NP-4811 placed in Peliyagoda workshop for scheduled brake pad overhaul. Released tomorrow 04:00 AM.",
    createdAt: "2026-10-01T05:18:00+05:30",
  },
  {
    id: "def-05",
    orderId: "ord-cov-05",
    orderRef: "S1-089",
    outletId: "OUT089",
    outletName: "Waypoint Fresh - Panadura Central",
    brand: "Fresh",
    district: "Kalutara",
    dispatchDate: "2026-09-30",
    deferralReason: "insufficient_reefer_capacity",
    limitingResource: "weight_cap",
    decisionMakerStaffId: "EMP-004",
    decisionMakerName: "S. Fernando",
    decisionMakerRole: "Senior Dispatcher",
    totalWeightKg: 780.0,
    totalVolumeM3: 4.9,
    totalValueLkr: 520000,
    tempRequirement: "chilled",
    dockType: "rear_dock",
    notes:
      "Kalutara reefer truck filled to 99.2% capacity. Order deferred yesterday, successfully dispatched today on Trip 1.",
    createdAt: "2026-09-30T04:30:10+05:30",
  },
  {
    id: "def-06",
    orderId: "ord-cov-06",
    orderRef: "S1-102",
    outletId: "OUT102",
    outletName: "Waypoint Style - Kandy Mall Dock",
    brand: "Style",
    district: "Kandy",
    dispatchDate: "2026-09-30",
    deferralReason: "van_access_shortage",
    limitingResource: "volume_cap",
    decisionMakerStaffId: "EMP-001",
    decisionMakerName: "K. Jayawardena",
    decisionMakerRole: "Lead Dispatcher",
    totalWeightKg: 310.0,
    totalVolumeM3: 3.8,
    totalValueLkr: 720000,
    tempRequirement: "ambient",
    dockType: "mall_bay",
    notes:
      "Kandy Mall access requires van-only clearance. Dispatched on secondary afternoon wave.",
    createdAt: "2026-09-30T05:40:00+05:30",
  },
];
