// ============================================================
// ReTrails (Team CurlX) - Dynamic Database Views & Aggregation DTOs
// Mirrors PostgreSQL views: v_active_price_list, v_customer_order_summary, v_trip_payload_summary
// ============================================================

import type { OrderStatus, TempRequirement } from "./domain";

export interface ActivePriceItem {
  priceListId: string;
  itemId: string;
  costPrice: number;
  unitPrice: number;
  currency: "LKR" | string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  priceChangeReason?: string;
}

export interface CustomerOrderSummary {
  id: string;
  orderRef: string;
  outletId: string;
  createdByStaffId?: string;
  orderDate: string;
  requiredDate: string;
  tempRequirement: TempRequirement;
  status: OrderStatus;
  isUrgent: boolean;
  deferredYesterday: 0 | 1;
  daysSinceLastServed: number;
  totalItems: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalOrderValueLkr: number;
  loadedWeightKg: number;
  loadedVolumeM3: number;
}

export interface TripPayloadSummary {
  tripId: string;
  tripCode: string;
  dispatchDate: string;
  vehicleId: string;
  driverId: string;
  weightCapKg: number;
  volumeCapM3: number;
  totalOrders: number;
  totalPackages: number;
  totalPayloadKg: number;
  totalVolumeM3: number;
  totalCargoValueLkr: number;
  weightUtilizationPct: number;
  volumeUtilizationPct: number;
}
