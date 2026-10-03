import type { OrderStatus, SpecialHandlingCode, TempRequirement } from "@/types/domain";

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: "Fresh" | "Style" | "Tech";
  unit: "Crate" | "Box" | "Nos" | "Pack" | "Kg";
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

export interface StoreOutletOption {
  id: string;
  code: string;
  name: string;
  address: string;
  district: string;
  depot: string;
  dockType: "rear_dock" | "street" | "mall_bay";
}
