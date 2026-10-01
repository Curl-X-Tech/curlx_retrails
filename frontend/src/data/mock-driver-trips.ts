import type {
  SpecialHandlingCode,
  DockType,
  ParkingConstraint,
} from "./mock-loader-bays";

export interface DriverOrderItem {
  id: string;
  orderRef: string;
  packageCode: string;
  sku: string;
  itemTitle: string;
  category: string;
  crateCount: number;
  weightKg: number;
  volumeM3: number;
  temperature: string;
  isReefer: boolean;
  specialHandlingCode?: SpecialHandlingCode | null;
  status: "pending" | "delivered" | "discrepancy";
}

export interface DriverWaypoint {
  seq: number;
  outletId: string;
  outletCode: string;
  outletName: string;
  address: string;
  lat: number;
  lng: number;
  dockType: DockType;
  parkingConstraint?: ParkingConstraint;
  stagingLocation: string;
  deliveryWindow: string;
  storeManagerName: string;
  storeManagerPhone: string;
  totalWeightKg: number;
  totalCrateCount: number;
  status: "completed" | "active" | "upcoming";
  arrivedAt?: string;
  departedAt?: string;
  items: DriverOrderItem[];
}

export interface DriverTrip {
  id: string;
  tripCode: string;
  sealNumber: string;
  vehicleId: string;
  regNumber: string;
  modelName: string;
  type: "truck" | "van";
  temp: "reefer" | "ambient";
  weightCapKg: number;
  volumeCapM3: number;
  reeferCurrentTempC?: number;
  reeferTargetTempC?: number;
  fuelType: "diesel" | "petrol" | "electric";
  kmPerL: number;
  weeklyFuelQuotaL: number;
  fuelRemainingL: number;
  currentOdometerKm: number;
  depotName: string;
  depotLat: number;
  depotLng: number;
  driver: {
    id: string;
    name: string;
    designation: string;
    licenseId: string;
    phone: string;
    avatarInitials: string;
  };
  status: "in_transit" | "paused" | "completed";
  activeWaypointSeq: number;
  plannedDepartureTime: string;
  estimatedReturnTime: string;
  breakDurationMinutes: number;
  onBreak: boolean;
  waypoints: DriverWaypoint[];
}

export const mockDriverTrip: DriverTrip = {
  id: "trip-4811",
  tripCode: "RT-14",
  sealNumber: "SL-90821-B",
  vehicleId: "VEH001",
  regNumber: "NP-4811",
  modelName: "Isuzu ELF NPR Reefer",
  type: "truck",
  temp: "reefer",
  weightCapKg: 4200,
  volumeCapM3: 28.0,
  reeferCurrentTempC: -18.2,
  reeferTargetTempC: -18.0,
  fuelType: "diesel",
  kmPerL: 6.8,
  weeklyFuelQuotaL: 120,
  fuelRemainingL: 84.5,
  currentOdometerKm: 142850,
  depotName: "Peliyagoda Depot",
  depotLat: 6.9654,
  depotLng: 79.8872,
  driver: {
    id: "drv-01",
    name: "Saman Perera",
    designation: "Senior Heavy Vehicle Pilot",
    licenseId: "DL-90821-WP-89",
    phone: "+94 77 123 4567",
    avatarInitials: "SP",
  },
  status: "in_transit",
  activeWaypointSeq: 4,
  plannedDepartureTime: "05:30 AM",
  estimatedReturnTime: "11:45 AM",
  breakDurationMinutes: 0,
  onBreak: false,
  waypoints: [
    {
      seq: 1,
      outletId: "OUT001",
      outletCode: "OUT001",
      outletName: "Waypoint Fresh - Colpetty",
      address: "284 Galle Road, Colpetty, Colombo 03",
      lat: 6.9022,
      lng: 79.8519,
      dockType: "rear_dock",
      parkingConstraint: "normal",
      stagingLocation: "Dock A",
      deliveryWindow: "05:45 - 06:45 AM",
      storeManagerName: "Rohan Silva",
      storeManagerPhone: "+94 77 234 5678",
      totalWeightKg: 420,
      totalCrateCount: 6,
      status: "completed",
      arrivedAt: "05:50 AM",
      departedAt: "06:18 AM",
      items: [
        {
          id: "item-1-1",
          orderRef: "ORD-0890-A",
          packageCode: "PKG-88192-A",
          sku: "SKU-SEA-101",
          itemTitle: "Atlantic Salmon Fillets & Chilled Poultry",
          category: "Seafood & Poultry",
          crateCount: 3,
          weightKg: 210,
          volumeM3: 1.4,
          temperature: "-18.0°C",
          isReefer: true,
          specialHandlingCode: "COL",
          status: "delivered",
        },
        {
          id: "item-1-2",
          orderRef: "ORD-0890-B",
          packageCode: "PKG-88192-B",
          sku: "SKU-DAI-204",
          itemTitle: "Imported Butter & Dairy Blocks",
          category: "Dairy & Butter",
          crateCount: 3,
          weightKg: 210,
          volumeM3: 1.4,
          temperature: "-4.0°C",
          isReefer: true,
          specialHandlingCode: "COL",
          status: "delivered",
        },
      ],
    },
    {
      seq: 2,
      outletId: "OUT002",
      outletCode: "OUT002",
      outletName: "Waypoint Fresh - Bambalapitiya",
      address: "142 Havelock Road, Cold Vault 2, Colombo 05",
      lat: 6.8856,
      lng: 79.8612,
      dockType: "street",
      parkingConstraint: "normal",
      stagingLocation: "Side Bay",
      deliveryWindow: "06:30 - 07:30 AM",
      storeManagerName: "Nimal Fernando",
      storeManagerPhone: "+94 71 889 2211",
      totalWeightKg: 310,
      totalCrateCount: 5,
      status: "completed",
      arrivedAt: "06:40 AM",
      departedAt: "07:05 AM",
      items: [
        {
          id: "item-2-1",
          orderRef: "ORD-0891-A",
          packageCode: "PKG-90412-A",
          sku: "SKU-SEA-309",
          itemTitle: "Yellowfin Tuna Loins",
          category: "Seafood",
          crateCount: 5,
          weightKg: 310,
          volumeM3: 1.8,
          temperature: "-18.2°C",
          isReefer: true,
          specialHandlingCode: "COL",
          status: "delivered",
        },
      ],
    },
    {
      seq: 3,
      outletId: "OUT003",
      outletCode: "OUT003",
      outletName: "Waypoint Fresh - Dehiwala",
      address: "88 Galle Road, Dehiwala Junction",
      lat: 6.8524,
      lng: 79.8654,
      dockType: "rear_dock",
      parkingConstraint: "normal",
      stagingLocation: "Dock 1",
      deliveryWindow: "07:15 - 08:15 AM",
      storeManagerName: "Sunil Gunawardena",
      storeManagerPhone: "+94 76 554 9900",
      totalWeightKg: 540,
      totalCrateCount: 8,
      status: "completed",
      arrivedAt: "07:22 AM",
      departedAt: "07:54 AM",
      items: [
        {
          id: "item-3-1",
          orderRef: "ORD-0892-A",
          packageCode: "PKG-91204-A",
          sku: "SKU-MEA-412",
          itemTitle: "Frozen Organic Beef Cuts",
          category: "Meat & Poultry",
          crateCount: 8,
          weightKg: 540,
          volumeM3: 3.2,
          temperature: "-19.0°C",
          isReefer: true,
          specialHandlingCode: "COL",
          status: "delivered",
        },
      ],
    },
    {
      seq: 4,
      outletId: "OUT004",
      outletCode: "OUT004",
      outletName: "Waypoint Fresh - Havelock City",
      address: "284 Havelock Rd, Cold Vault 3",
      lat: 6.8791,
      lng: 79.8732,
      dockType: "mall_bay",
      parkingConstraint: "mall_dock",
      stagingLocation: "Dock B",
      deliveryWindow: "08:00 - 09:30 AM",
      storeManagerName: "Priyantha Kumara",
      storeManagerPhone: "+94 77 990 1144",
      totalWeightKg: 260,
      totalCrateCount: 4,
      status: "active",
      items: [
        {
          id: "item-4-1",
          orderRef: "ORD-0893-A",
          packageCode: "PKG-92011-A",
          sku: "SKU-DAI-880",
          itemTitle: "Artisanal Cheese & Gourmet Dairy",
          category: "Dairy & Bakery",
          crateCount: 2,
          weightKg: 130,
          volumeM3: 0.9,
          temperature: "2.5°C",
          isReefer: true,
          specialHandlingCode: "MAL",
          status: "pending",
        },
        {
          id: "item-4-2",
          orderRef: "ORD-0893-B",
          packageCode: "PKG-92011-B",
          sku: "SKU-BEV-108",
          itemTitle: "Chilled Farm Milk Crates (1L x 12)",
          category: "Dairy & Beverages",
          crateCount: 2,
          weightKg: 130,
          volumeM3: 0.9,
          temperature: "2.0°C",
          isReefer: true,
          specialHandlingCode: "COL",
          status: "pending",
        },
      ],
    },
    {
      seq: 5,
      outletId: "OUT005",
      outletCode: "OUT005",
      outletName: "Waypoint Fresh - Wattala",
      address: "412 Negombo Road, Wattala Central",
      lat: 6.9892,
      lng: 79.8912,
      dockType: "rear_dock",
      parkingConstraint: "normal",
      stagingLocation: "Dock C",
      deliveryWindow: "09:45 - 11:00 AM",
      storeManagerName: "Chaminda Rathnayake",
      storeManagerPhone: "+94 72 331 4455",
      totalWeightKg: 380,
      totalCrateCount: 6,
      status: "upcoming",
      items: [
        {
          id: "item-5-1",
          orderRef: "ORD-0894-A",
          packageCode: "PKG-93401-A",
          sku: "SKU-AGR-501",
          itemTitle: "Fresh Iceberg Lettuce & Garden Produce",
          category: "Fresh Produce",
          crateCount: 6,
          weightKg: 380,
          volumeM3: 2.4,
          temperature: "4.0°C",
          isReefer: true,
          specialHandlingCode: "COL",
          status: "pending",
        },
      ],
    },
  ],
};
