import type {
  BrandName,
  DockType,
  OrderStatus,
  ParkingConstraint,
  SpecialHandlingCode,
  TempRequirement,
} from "./domain";

export interface QueuedOrderItem {
  id: string;
  orderId: string;
  itemId: string;
  packageCode: string;
  itemName: string;
  category: string;
  requestedQty: number;
  unitWeightKg: number;
  unitVolumeM3: number;
  unitPrice: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalPriceLkr: number;
  specialHandlingCode: SpecialHandlingCode;
}

export interface QueuedOrder {
  id: string;
  orderRef: string;
  outletId: string;
  outletName: string;
  outletAddress: string;
  brand: BrandName;
  district: string;
  depot: "Peliyagoda" | "Kandy" | string;
  dockType: DockType;
  parkingConstraint: ParkingConstraint;
  deliveryWindow: string;
  mallWindow?: string;
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
  items: QueuedOrderItem[];
}

export interface StoreOrderGroup {
  outletId: string;
  outletName: string;
  outletAddress: string;
  brand: BrandName;
  district: string;
  dockType: DockType;
  parkingConstraint: ParkingConstraint;
  deliveryWindow: string;
  contactPhone: string;
  orders: QueuedOrder[];
  totalOrders: number;
  totalPackages: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalValueLkr: number;
  hasUrgent: boolean;
  hasDeferred: boolean;
  maxDaysSinceLastServed: number;
}

export interface OrderQueueKPIs {
  totalOrders: number;
  totalStores: number;
  urgentOrders: number;
  deferredYesterdayOrders: number;
  totalWeightKg: number;
  totalVolumeCbm: number;
  totalValueLkr: number;
  chilledOrdersCount: number;
  ambientOrdersCount: number;
}
