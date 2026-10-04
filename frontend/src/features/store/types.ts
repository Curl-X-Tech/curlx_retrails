import type { OrderStatus, SpecialHandlingCode, TempRequirement } from "@/types/domain";

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: "Fresh" | "Style" | "Tech";
  unit: "Crate" | "Box" | "Nos" | "Pack" | "Kg" | "Carton";
  unitWeightKg: number;
  unitVolumeM3: number;
  unitPriceLkr: number;
  requiresColdChain: boolean;
  specialHandlingCode?: SpecialHandlingCode;
}

export interface StoreOrderItemRow {
  id: string;
  productId: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  unitWeightKg: number;
  unitVolumeM3: number;
  unitPriceLkr: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalPriceLkr: number;
  specialHandlingCode?: SpecialHandlingCode;
}

export interface StoreOrderRecord {
  id: string;
  orderRef: string;
  tripId?: string;
  outletId: string;
  outletName: string;
  outletAddress: string;
  district: string;
  depot: string;
  orderDate: string;
  requiredDate: string;
  eta?: string;
  tempRequirement: TempRequirement;
  status: OrderStatus | "in_transit" | "loading";
  isUrgent: boolean;
  totalItems: number;
  totalUnits: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalOrderValueLkr: number;
  items: StoreOrderItemRow[];
  createdAt: string;
}

export interface StoreOrderKPIs {
  totalOrders: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalValueLkr: number;
  pendingCount: number;
  inTransitCount: number;
  urgentCount: number;
  deferredCount: number;
}

export interface StoreOutletOption {
  id: string;
  code: string;
  name: string;
  address: string;
  district: string;
  depot: string;
  dockType: "rear_dock" | "street" | "mall_bay";
}

export type StoreViewMode = "table" | "grid";

export interface InboundShipment {
  id: string;
  orderId: string;
  waypointId: string;
  orderRef: string;
  tripId: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  outletName: string;
  outletAddress: string;
  tempRequirement: TempRequirement;
  reeferTempC?: number;
  eta: string;
  status: "in_transit" | "docked" | "delivered" | "discrepancy";
  totalPackages: number;
  totalWeightKg: number;
  totalValueLkr: number;
  items: StoreOrderItemRow[];
  deliveredAt?: string;
  cratesReturned?: number;
}

export interface ReceivingCheckItem {
  itemId: string;
  name: string;
  sku: string;
  requestedQty: number;
  receivedQty: number;
  issueType?:
    "damaged_in_transit" | "missing_crate" | "rejected_by_store" | "temp_spoilage";
  notes?: string;
  specialHandlingCode?: SpecialHandlingCode;
}

export interface ReceivingKPIs {
  inboundTrucksCount: number;
  pendingReceivalCount: number;
  coldChainRunsCount: number;
  discrepanciesCount: number;
  cratesReturnedTotal: number;
}
