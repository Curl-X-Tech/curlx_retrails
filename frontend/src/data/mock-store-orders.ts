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

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: "prod-01",
    sku: "SKU-MLK-01",
    name: "Farm Fresh Chilled Full Cream Milk (1L x 24)",
    category: "Dairy & Chilled",
    brand: "Fresh",
    unit: "Crate",
    unitWeightKg: 25.5,
    unitVolumeM3: 0.18,
    unitPriceLkr: 11500,
    requiresColdChain: true,
    specialHandlingCode: "COL",
  },
  {
    id: "prod-02",
    sku: "SKU-BTR-02",
    name: "Highland Butter Blocks Salted (250g x 40)",
    category: "Dairy & Chilled",
    brand: "Fresh",
    unit: "Box",
    unitWeightKg: 10.5,
    unitVolumeM3: 0.07,
    unitPriceLkr: 14200,
    requiresColdChain: true,
    specialHandlingCode: "COL",
  },
  {
    id: "prod-03",
    sku: "SKU-YGT-03",
    name: "Low-Fat Set Yoghurt Cups (80g x 48)",
    category: "Dairy & Chilled",
    brand: "Fresh",
    unit: "Crate",
    unitWeightKg: 4.5,
    unitVolumeM3: 0.04,
    unitPriceLkr: 4800,
    requiresColdChain: true,
    specialHandlingCode: "COL",
  },
  {
    id: "prod-04",
    sku: "SKU-STR-04",
    name: "Peradeniya Organic Strawberries (500g Crates x 12)",
    category: "Fresh Produce",
    brand: "Fresh",
    unit: "Crate",
    unitWeightKg: 9.05,
    unitVolumeM3: 0.054,
    unitPriceLkr: 6300,
    requiresColdChain: true,
    specialHandlingCode: "FRG",
  },
  {
    id: "prod-05",
    sku: "SKU-TOM-05",
    name: "Hydroponic Cluster Tomatoes (1kg x 10 Packs)",
    category: "Fresh Produce",
    brand: "Fresh",
    unit: "Box",
    unitWeightKg: 10.8,
    unitVolumeM3: 0.065,
    unitPriceLkr: 5200,
    requiresColdChain: false,
    specialHandlingCode: "FRG",
  },
  {
    id: "prod-06",
    sku: "SKU-APP-06",
    name: "Crisp Royal Gala Apples (18kg Master Carton)",
    category: "Fresh Produce",
    brand: "Fresh",
    unit: "Box",
    unitWeightKg: 18.5,
    unitVolumeM3: 0.082,
    unitPriceLkr: 18400,
    requiresColdChain: false,
  },
  {
    id: "prod-07",
    sku: "SKU-CHK-07",
    name: "Prime Cut Skinless Chicken Breast (1kg x 12)",
    category: "Poultry & Meat",
    brand: "Fresh",
    unit: "Box",
    unitWeightKg: 12.8,
    unitVolumeM3: 0.09,
    unitPriceLkr: 22600,
    requiresColdChain: true,
    specialHandlingCode: "COL",
  },
  {
    id: "prod-08",
    sku: "SKU-SAL-08",
    name: "Norwegian Atlantic Salmon Portions (200g x 20)",
    category: "Seafood",
    brand: "Fresh",
    unit: "Box",
    unitWeightKg: 4.4,
    unitVolumeM3: 0.035,
    unitPriceLkr: 38500,
    requiresColdChain: true,
    specialHandlingCode: "COL",
  },
  {
    id: "prod-09",
    sku: "SKU-BRD-09",
    name: "Whole Wheat Artisanal Toast Bread (450g x 16)",
    category: "Bakery",
    brand: "Fresh",
    unit: "Crate",
    unitWeightKg: 7.8,
    unitVolumeM3: 0.11,
    unitPriceLkr: 6400,
    requiresColdChain: false,
    specialHandlingCode: "FRG",
  },
  {
    id: "prod-10",
    sku: "SKU-OIL-10",
    name: "Pure Virgin Coconut Oil Bottle (500ml x 12)",
    category: "Grocery & Ambient",
    brand: "Fresh",
    unit: "Box",
    unitWeightKg: 6.8,
    unitVolumeM3: 0.045,
    unitPriceLkr: 12800,
    requiresColdChain: false,
  },
  {
    id: "prod-11",
    sku: "SKU-TEA-11",
    name: "Single Origin Ceylon Black Tea (200g x 24)",
    category: "Grocery & Ambient",
    brand: "Fresh",
    unit: "Box",
    unitWeightKg: 5.6,
    unitVolumeM3: 0.038,
    unitPriceLkr: 16200,
    requiresColdChain: false,
  },
  {
    id: "prod-12",
    sku: "SKU-WTR-12",
    name: "Spring Mineral Water (1.5L x 12 Pack)",
    category: "Beverages",
    brand: "Fresh",
    unit: "Pack",
    unitWeightKg: 18.2,
    unitVolumeM3: 0.06,
    unitPriceLkr: 2400,
    requiresColdChain: false,
  },
];

export interface StoreOutletOption {
  id: string;
  code: string;
  name: string;
  address: string;
  district: string;
  depot: string;
  dockType: "rear_dock" | "street" | "mall_bay";
}

export const STORE_OUTLETS: StoreOutletOption[] = [
  {
    id: "OUT001",
    code: "OUT001",
    name: "Waypoint Fresh - Fort Dock",
    address: "York Street, Colombo 01",
    district: "Colombo",
    depot: "Peliyagoda",
    dockType: "rear_dock",
  },
  {
    id: "OUT002",
    code: "OUT002",
    name: "Waypoint Fresh - Colpetty",
    address: "Galle Road, Colombo 03",
    district: "Colombo",
    depot: "Peliyagoda",
    dockType: "street",
  },
  {
    id: "OUT003",
    code: "OUT003",
    name: "Waypoint Fresh - Bambalapitiya",
    address: "Duplication Road, Colombo 04",
    district: "Colombo",
    depot: "Peliyagoda",
    dockType: "rear_dock",
  },
  {
    id: "OUT004",
    code: "OUT004",
    name: "Waypoint Fresh - Wattala Super",
    address: "Negombo Road, Wattala",
    district: "Gampaha",
    depot: "Peliyagoda",
    dockType: "rear_dock",
  },
  {
    id: "OUT005",
    code: "OUT005",
    name: "Waypoint Fresh - Mount Lavinia",
    address: "Hotel Road, Mount Lavinia",
    district: "Colombo",
    depot: "Peliyagoda",
    dockType: "street",
  },
  {
    id: "OUT006",
    code: "OUT006",
    name: "Waypoint Fresh - Negombo Bay",
    address: "Main Street, Negombo",
    district: "Gampaha",
    depot: "Peliyagoda",
    dockType: "rear_dock",
  },
  {
    id: "OUT007",
    code: "OUT007",
    name: "Waypoint Fresh - Kandy City Centre",
    address: "Dalada Veediya, Kandy",
    district: "Kandy",
    depot: "Kandy",
    dockType: "mall_bay",
  },
];

export const INITIAL_STORE_ORDERS: StoreOrderRecord[] = [
  {
    id: "ord-rec-01",
    orderRef: "ORD-2026-081",
    tripId: "TRP-0928-COL",
    outletId: "OUT001",
    outletName: "Waypoint Fresh - Fort Dock",
    outletAddress: "York Street, Colombo 01",
    district: "Colombo",
    depot: "Peliyagoda",
    orderDate: "2026-10-01",
    requiredDate: "2026-10-01",
    eta: "06:30 AM",
    tempRequirement: "chilled",
    status: "in_transit",
    isUrgent: true,
    totalItems: 3,
    totalUnits: 27,
    totalWeightKg: 420.5,
    totalVolumeM3: 2.85,
    totalOrderValueLkr: 285400,
    createdAt: "2026-10-01T04:15:00Z",
    items: [
      {
        id: "soi-01",
        productId: "prod-01",
        sku: "SKU-MLK-01",
        name: "Farm Fresh Chilled Full Cream Milk (1L x 24)",
        category: "Dairy & Chilled",
        unit: "Crate",
        quantity: 10,
        unitWeightKg: 25.5,
        unitVolumeM3: 0.18,
        unitPriceLkr: 11500,
        totalWeightKg: 255.0,
        totalVolumeM3: 1.8,
        totalPriceLkr: 115000,
        specialHandlingCode: "COL",
      },
      {
        id: "soi-02",
        productId: "prod-02",
        sku: "SKU-BTR-02",
        name: "Highland Butter Blocks Salted (250g x 40)",
        category: "Dairy & Chilled",
        unit: "Box",
        quantity: 8,
        unitWeightKg: 10.5,
        unitVolumeM3: 0.07,
        unitPriceLkr: 14200,
        totalWeightKg: 84.0,
        totalVolumeM3: 0.56,
        totalPriceLkr: 113600,
        specialHandlingCode: "COL",
      },
      {
        id: "soi-03",
        productId: "prod-04",
        sku: "SKU-STR-04",
        name: "Peradeniya Organic Strawberries (500g Crates x 12)",
        category: "Fresh Produce",
        unit: "Crate",
        quantity: 9,
        unitWeightKg: 9.05,
        unitVolumeM3: 0.054,
        unitPriceLkr: 6300,
        totalWeightKg: 81.5,
        totalVolumeM3: 0.49,
        totalPriceLkr: 56700,
        specialHandlingCode: "FRG",
      },
    ],
  },
  {
    id: "ord-rec-02",
    orderRef: "ORD-2026-082",
    tripId: "TRP-0931-WTL",
    outletId: "OUT004",
    outletName: "Waypoint Fresh - Wattala Super",
    outletAddress: "Negombo Road, Wattala",
    district: "Gampaha",
    depot: "Peliyagoda",
    orderDate: "2026-10-01",
    requiredDate: "2026-10-01",
    eta: "07:15 AM",
    tempRequirement: "chilled",
    status: "loading",
    isUrgent: false,
    totalItems: 3,
    totalUnits: 34,
    totalWeightKg: 512.4,
    totalVolumeM3: 3.42,
    totalOrderValueLkr: 412800,
    createdAt: "2026-10-01T04:40:00Z",
    items: [
      {
        id: "soi-04",
        productId: "prod-01",
        sku: "SKU-MLK-01",
        name: "Farm Fresh Chilled Full Cream Milk (1L x 24)",
        category: "Dairy & Chilled",
        unit: "Crate",
        quantity: 14,
        unitWeightKg: 25.5,
        unitVolumeM3: 0.18,
        unitPriceLkr: 11500,
        totalWeightKg: 357.0,
        totalVolumeM3: 2.52,
        totalPriceLkr: 161000,
        specialHandlingCode: "COL",
      },
      {
        id: "soi-05",
        productId: "prod-07",
        sku: "SKU-CHK-07",
        name: "Prime Cut Skinless Chicken Breast (1kg x 12)",
        category: "Poultry & Meat",
        unit: "Box",
        quantity: 10,
        unitWeightKg: 12.8,
        unitVolumeM3: 0.09,
        unitPriceLkr: 22600,
        totalWeightKg: 128.0,
        totalVolumeM3: 0.9,
        totalPriceLkr: 226000,
        specialHandlingCode: "COL",
      },
      {
        id: "soi-06",
        productId: "prod-09",
        sku: "SKU-BRD-09",
        name: "Whole Wheat Artisanal Toast Bread (450g x 16)",
        category: "Bakery",
        unit: "Crate",
        quantity: 10,
        unitWeightKg: 7.8,
        unitVolumeM3: 0.11,
        unitPriceLkr: 6400,
        totalWeightKg: 78.0,
        totalVolumeM3: 1.1,
        totalPriceLkr: 64000,
        specialHandlingCode: "FRG",
      },
    ],
  },
  {
    id: "ord-rec-03",
    orderRef: "ORD-2026-083",
    tripId: "TRP-0940-CLP",
    outletId: "OUT002",
    outletName: "Waypoint Fresh - Colpetty",
    outletAddress: "Galle Road, Colombo 03",
    district: "Colombo",
    depot: "Peliyagoda",
    orderDate: "2026-10-01",
    requiredDate: "2026-10-01",
    eta: "08:00 AM",
    tempRequirement: "ambient",
    status: "pending",
    isUrgent: false,
    totalItems: 4,
    totalUnits: 45,
    totalWeightKg: 620.0,
    totalVolumeM3: 2.95,
    totalOrderValueLkr: 342000,
    createdAt: "2026-10-01T05:05:00Z",
    items: [
      {
        id: "soi-07",
        productId: "prod-05",
        sku: "SKU-TOM-05",
        name: "Hydroponic Cluster Tomatoes (1kg x 10 Packs)",
        category: "Fresh Produce",
        unit: "Box",
        quantity: 15,
        unitWeightKg: 10.8,
        unitVolumeM3: 0.065,
        unitPriceLkr: 5200,
        totalWeightKg: 162.0,
        totalVolumeM3: 0.975,
        totalPriceLkr: 78000,
        specialHandlingCode: "FRG",
      },
      {
        id: "soi-08",
        productId: "prod-06",
        sku: "SKU-APP-06",
        name: "Crisp Royal Gala Apples (18kg Master Carton)",
        category: "Fresh Produce",
        unit: "Box",
        quantity: 10,
        unitWeightKg: 18.5,
        unitVolumeM3: 0.082,
        unitPriceLkr: 18400,
        totalWeightKg: 185.0,
        totalVolumeM3: 0.82,
        totalPriceLkr: 184000,
      },
      {
        id: "soi-09",
        productId: "prod-12",
        sku: "SKU-WTR-12",
        name: "Spring Mineral Water (1.5L x 12 Pack)",
        category: "Beverages",
        unit: "Pack",
        quantity: 20,
        unitWeightKg: 18.2,
        unitVolumeM3: 0.06,
        unitPriceLkr: 2400,
        totalWeightKg: 364.0,
        totalVolumeM3: 1.2,
        totalPriceLkr: 48000,
      },
    ],
  },
  {
    id: "ord-rec-04",
    orderRef: "ORD-2026-084",
    tripId: "TRP-0945-BAM",
    outletId: "OUT003",
    outletName: "Waypoint Fresh - Bambalapitiya",
    outletAddress: "Duplication Road, Colombo 04",
    district: "Colombo",
    depot: "Peliyagoda",
    orderDate: "2026-10-01",
    requiredDate: "2026-10-01",
    eta: "08:45 AM",
    tempRequirement: "chilled",
    status: "served",
    isUrgent: false,
    totalItems: 2,
    totalUnits: 18,
    totalWeightKg: 280.0,
    totalVolumeM3: 1.9,
    totalOrderValueLkr: 198000,
    createdAt: "2026-10-01T03:30:00Z",
    items: [
      {
        id: "soi-10",
        productId: "prod-01",
        sku: "SKU-MLK-01",
        name: "Farm Fresh Chilled Full Cream Milk (1L x 24)",
        category: "Dairy & Chilled",
        unit: "Crate",
        quantity: 10,
        unitWeightKg: 25.5,
        unitVolumeM3: 0.18,
        unitPriceLkr: 11500,
        totalWeightKg: 255.0,
        totalVolumeM3: 1.8,
        totalPriceLkr: 115000,
        specialHandlingCode: "COL",
      },
      {
        id: "soi-11",
        productId: "prod-08",
        sku: "SKU-SAL-08",
        name: "Norwegian Atlantic Salmon Portions (200g x 20)",
        category: "Seafood",
        unit: "Box",
        quantity: 8,
        unitWeightKg: 4.4,
        unitVolumeM3: 0.035,
        unitPriceLkr: 38500,
        totalWeightKg: 35.2,
        totalVolumeM3: 0.28,
        totalPriceLkr: 308000,
        specialHandlingCode: "COL",
      },
    ],
  },
  {
    id: "ord-rec-05",
    orderRef: "ORD-2026-085",
    tripId: "TRP-0950-NEG",
    outletId: "OUT006",
    outletName: "Waypoint Fresh - Negombo Bay",
    outletAddress: "Main Street, Negombo",
    district: "Gampaha",
    depot: "Peliyagoda",
    orderDate: "2026-10-01",
    requiredDate: "2026-10-01",
    eta: "09:30 AM",
    tempRequirement: "ambient",
    status: "deferred",
    isUrgent: true,
    totalItems: 3,
    totalUnits: 30,
    totalWeightKg: 390.0,
    totalVolumeM3: 2.15,
    totalOrderValueLkr: 275000,
    createdAt: "2026-10-01T04:00:00Z",
    items: [
      {
        id: "soi-12",
        productId: "prod-10",
        sku: "SKU-OIL-10",
        name: "Pure Virgin Coconut Oil Bottle (500ml x 12)",
        category: "Grocery & Ambient",
        unit: "Box",
        quantity: 15,
        unitWeightKg: 6.8,
        unitVolumeM3: 0.045,
        unitPriceLkr: 12800,
        totalWeightKg: 102.0,
        totalVolumeM3: 0.675,
        totalPriceLkr: 192000,
      },
      {
        id: "soi-13",
        productId: "prod-11",
        sku: "SKU-TEA-11",
        name: "Single Origin Ceylon Black Tea (200g x 24)",
        category: "Grocery & Ambient",
        unit: "Box",
        quantity: 15,
        unitWeightKg: 5.6,
        unitVolumeM3: 0.038,
        unitPriceLkr: 16200,
        totalWeightKg: 84.0,
        totalVolumeM3: 0.57,
        totalPriceLkr: 243000,
      },
    ],
  },
  {
    id: "ord-rec-06",
    orderRef: "ORD-2026-086",
    tripId: "TRP-0955-KDY",
    outletId: "OUT007",
    outletName: "Waypoint Fresh - Kandy City Centre",
    outletAddress: "Dalada Veediya, Kandy",
    district: "Kandy",
    depot: "Kandy",
    orderDate: "2026-10-01",
    requiredDate: "2026-10-01",
    eta: "10:15 AM",
    tempRequirement: "chilled",
    status: "pending",
    isUrgent: false,
    totalItems: 3,
    totalUnits: 25,
    totalWeightKg: 340.5,
    totalVolumeM3: 2.1,
    totalOrderValueLkr: 215000,
    createdAt: "2026-10-01T05:30:00Z",
    items: [
      {
        id: "soi-14",
        productId: "prod-03",
        sku: "SKU-YGT-03",
        name: "Low-Fat Set Yoghurt Cups (80g x 48)",
        category: "Dairy & Chilled",
        unit: "Crate",
        quantity: 15,
        unitWeightKg: 4.5,
        unitVolumeM3: 0.04,
        unitPriceLkr: 4800,
        totalWeightKg: 67.5,
        totalVolumeM3: 0.6,
        totalPriceLkr: 72000,
        specialHandlingCode: "COL",
      },
      {
        id: "soi-15",
        productId: "prod-04",
        sku: "SKU-STR-04",
        name: "Peradeniya Organic Strawberries (500g Crates x 12)",
        category: "Fresh Produce",
        unit: "Crate",
        quantity: 10,
        unitWeightKg: 9.05,
        unitVolumeM3: 0.054,
        unitPriceLkr: 6300,
        totalWeightKg: 90.5,
        totalVolumeM3: 0.54,
        totalPriceLkr: 63000,
        specialHandlingCode: "FRG",
      },
    ],
  },
];

let activeStoreOrdersState: StoreOrderRecord[] = [...INITIAL_STORE_ORDERS];

export function getStoreOrders(): StoreOrderRecord[] {
  return activeStoreOrdersState;
}

export function createStoreOrder(
  newOrder: Omit<StoreOrderRecord, "id" | "createdAt">
): StoreOrderRecord {
  const created: StoreOrderRecord = {
    ...newOrder,
    id: `ord-rec-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  activeStoreOrdersState = [created, ...activeStoreOrdersState];
  return created;
}

export function getStoreOrderById(id: string): StoreOrderRecord | undefined {
  return activeStoreOrdersState.find((o) => o.id === id || o.orderRef === id);
}
