export type SpecialHandlingCode = "COL" | "FRG" | "MAL" | "HAZ";
export type DockType = "rear_dock" | "street" | "mall_bay";
export type ParkingConstraint = "normal" | "van_only" | "mall_dock";

export interface BayCoordinates {
  bayX: number;
  bayY: number;
  bayZ: number;
}

export interface LoaderOrderItem {
  id: string;
  orderRef: string;
  packageCode: string;
  sku: string;
  itemTitle: string;
  category: string;
  crateCount: number;
  weightKg: number;
  volumeM3: number;
  unitPriceLkr?: number;
  totalPriceLkr?: number;
  temperature: string;
  isReefer: boolean;
  specialHandlingCode?: SpecialHandlingCode | null;
  bayCoordinates: BayCoordinates;
  stagingBay: string;
  status: "pending" | "scanned" | "verified" | "flagged";
  notes?: string;
}

export interface LoaderWaypoint {
  seq: number;
  outletId: string;
  outletCode: string;
  outletName: string;
  dockType: DockType;
  deliveryWindow: string;
  parkingConstraint?: ParkingConstraint;
  items: LoaderOrderItem[];
}

export interface LoaderVehicleTrip {
  id: string;
  tripCode: string;
  tripSequence: number;
  sealNumber: string;
  vehicleId: string;
  regNumber: string;
  modelName: string;
  type: "truck" | "van";
  temp: "reefer" | "ambient";
  weightCapKg: number;
  volumeCapM3: number;
  imagePath: string;
  depotName: string;
  stopsCount: number;
  nextStopName: string;
  plannedDepartureTime: string;
  departureCountdownMinutes: number;
  status: "loading" | "ready" | "dispatched" | "flagged";
  dockBay: string;
  dispatchedAt?: string;
  verifiedItemsCount?: number;
  totalItemsCount?: number;
  flagReason?: string;
  driver: {
    name: string;
    designation: string;
    licenseId: string;
    phone: string;
    avatarInitials: string;
  };
  payload: {
    currentKg: number;
    maxKg: number;
    percentage: number;
    secondaryMetric: string;
    currentVolumeM3: number;
    maxVolumeM3: number;
  };
  waypoints: LoaderWaypoint[];
}

export const mockLoaderTrips: LoaderVehicleTrip[] = [
  {
    id: "trip-4811",
    tripCode: "RT-14",
    tripSequence: 1,
    sealNumber: "SL-90821-B",
    vehicleId: "VEH001",
    regNumber: "NP-4811",
    modelName: "Isuzu ELF NPR",
    type: "truck",
    temp: "reefer",
    weightCapKg: 4200,
    volumeCapM3: 28.0,
    imagePath: "/vehicle-images/freeze.png",
    depotName: "Peliyagoda Depot",
    stopsCount: 3,
    nextStopName: "Waypoint Fresh Wattala",
    plannedDepartureTime: "05:30 AM",
    departureCountdownMinutes: 38,
    status: "loading",
    dockBay: "Bay 4C",
    verifiedItemsCount: 2,
    totalItemsCount: 4,
    driver: {
      name: "Saman Perera",
      designation: "Heavy Vehicle Pilot",
      licenseId: "DL-90821-WP-89",
      phone: "+94 77 123 4567",
      avatarInitials: "SP",
    },
    payload: {
      currentKg: 3360,
      maxKg: 4200,
      percentage: 80,
      secondaryMetric: "2,650 kg s.m",
      currentVolumeM3: 22.4,
      maxVolumeM3: 28.0,
    },
    waypoints: [
      {
        seq: 10,
        outletId: "OUT010",
        outletCode: "OUT010",
        outletName: "Waypoint Fresh - Colpetty",
        dockType: "rear_dock",
        deliveryWindow: "05:00 - 08:00",
        parkingConstraint: "normal",
        items: [
          {
            id: "item-10-1",
            orderRef: "ORD-0890-A",
            packageCode: "PKG-88192-A",
            sku: "SKU-SEA-101",
            itemTitle: "Atlantic Salmon Fillets & Chilled Poultry",
            category: "Seafood & Poultry",
            crateCount: 14,
            weightKg: 210,
            volumeM3: 1.4,
            temperature: "-18.0°C",
            isReefer: true,
            specialHandlingCode: "COL",
            bayCoordinates: { bayX: 4, bayY: 2, bayZ: 1 },
            stagingBay: "Bay 4B",
            status: "verified",
          },
          {
            id: "item-10-2",
            orderRef: "ORD-0890-B",
            packageCode: "PKG-88192-B",
            sku: "SKU-DAI-204",
            itemTitle: "Imported Butter & Dairy Blocks",
            category: "Dairy & Butter",
            crateCount: 10,
            weightKg: 150,
            volumeM3: 1.0,
            temperature: "-4.0°C",
            isReefer: true,
            specialHandlingCode: "COL",
            bayCoordinates: { bayX: 4, bayY: 2, bayZ: 2 },
            stagingBay: "Bay 4B",
            status: "verified",
          },
        ],
      },
      {
        seq: 9,
        outletId: "OUT009",
        outletCode: "OUT009",
        outletName: "Waypoint Fresh - Wattala",
        dockType: "rear_dock",
        deliveryWindow: "05:30 - 08:30",
        parkingConstraint: "normal",
        items: [
          {
            id: "item-9-1",
            orderRef: "ORD-0891-A",
            packageCode: "PKG-90412-A",
            sku: "SKU-SEA-309",
            itemTitle: "Yellowfin Tuna Loins & Prime Seafood",
            category: "Seafood",
            crateCount: 18,
            weightKg: 260,
            volumeM3: 1.8,
            temperature: "-18.2°C",
            isReefer: true,
            specialHandlingCode: "COL",
            bayCoordinates: { bayX: 4, bayY: 3, bayZ: 1 },
            stagingBay: "Bay 4C",
            status: "verified",
          },
          {
            id: "item-9-2",
            orderRef: "ORD-0891-B",
            packageCode: "PKG-90412-B",
            sku: "SKU-MEA-412",
            itemTitle: "Frozen Organic Beef Cuts & Ground Meat",
            category: "Meat & Poultry",
            crateCount: 18,
            weightKg: 240,
            volumeM3: 1.8,
            temperature: "-19.0°C",
            isReefer: true,
            specialHandlingCode: "COL",
            bayCoordinates: { bayX: 4, bayY: 3, bayZ: 2 },
            stagingBay: "Bay 4C",
            status: "verified",
          },
          {
            id: "item-9-3",
            orderRef: "ORD-0891-C",
            packageCode: "PKG-90412-C",
            sku: "SKU-BEV-108",
            itemTitle: "Chilled Farm Milk Crates (1L x 12)",
            category: "Dairy & Beverages",
            crateCount: 18,
            weightKg: 220,
            volumeM3: 1.6,
            temperature: "2.0°C",
            isReefer: true,
            specialHandlingCode: "COL",
            bayCoordinates: { bayX: 3, bayY: 3, bayZ: 1 },
            stagingBay: "Bay 3C",
            status: "pending",
          },
        ],
      },
      {
        seq: 8,
        outletId: "OUT008",
        outletCode: "OUT008",
        outletName: "Waypoint Fresh - Ja-Ela",
        dockType: "street",
        deliveryWindow: "06:00 - 09:00",
        parkingConstraint: "normal",
        items: [
          {
            id: "item-8-1",
            orderRef: "ORD-0892-A",
            packageCode: "PKG-91204-A",
            sku: "SKU-AGR-501",
            itemTitle: "Fresh Iceberg Lettuce & Garden Produce",
            category: "Fresh Produce",
            crateCount: 22,
            weightKg: 180,
            volumeM3: 2.2,
            temperature: "4.0°C",
            isReefer: true,
            specialHandlingCode: "FRG",
            bayCoordinates: { bayX: 4, bayY: 1, bayZ: 1 },
            stagingBay: "Bay 4A",
            status: "pending",
          },
        ],
      },
    ],
  },
  {
    id: "trip-2294",
    tripCode: "RT-15",
    tripSequence: 1,
    sealNumber: "SL-88412-C",
    vehicleId: "VEH002",
    regNumber: "WP-3021",
    modelName: "Mitsubishi Fuso Canter",
    type: "truck",
    temp: "ambient",
    weightCapKg: 3800,
    volumeCapM3: 25.0,
    imagePath: "/vehicle-images/dry.png",
    depotName: "Peliyagoda Depot",
    stopsCount: 3,
    nextStopName: "Style Studio Negombo",
    plannedDepartureTime: "06:15 AM",
    departureCountdownMinutes: 83,
    status: "ready",
    dockBay: "Bay 2A",
    verifiedItemsCount: 3,
    totalItemsCount: 3,
    driver: {
      name: "Dinesh Gunawardena",
      designation: "Commercial Fleet Pilot",
      licenseId: "DL-44821-WP-02",
      phone: "+94 71 884 9912",
      avatarInitials: "DG",
    },
    payload: {
      currentKg: 2850,
      maxKg: 3800,
      percentage: 75,
      secondaryMetric: "2,100 kg s.m",
      currentVolumeM3: 19.5,
      maxVolumeM3: 25.0,
    },
    waypoints: [
      {
        seq: 12,
        outletId: "OUT012",
        outletCode: "OUT012",
        outletName: "Style Studio - Negombo",
        dockType: "mall_bay",
        deliveryWindow: "09:00 - 11:00",
        parkingConstraint: "mall_dock",
        items: [
          {
            id: "item-12-1",
            orderRef: "ORD-0711-A",
            packageCode: "PKG-77412-A",
            sku: "SKU-TEX-901",
            itemTitle: "Cotton Apparel Cartons & Hangers",
            category: "Apparel & Textiles",
            crateCount: 24,
            weightKg: 320,
            volumeM3: 3.2,
            temperature: "Ambient 26°C",
            isReefer: false,
            specialHandlingCode: "MAL",
            bayCoordinates: { bayX: 2, bayY: 1, bayZ: 1 },
            stagingBay: "Bay 2A",
            status: "verified",
          },
        ],
      },
    ],
  },
  {
    id: "trip-7721",
    tripCode: "RT-16",
    tripSequence: 1,
    sealNumber: "SL-67104-A",
    vehicleId: "VEH003",
    regNumber: "CP-1192",
    modelName: "Nissan Urvan",
    type: "van",
    temp: "reefer",
    weightCapKg: 1500,
    volumeCapM3: 10.0,
    imagePath: "/vehicle-images/van.png",
    depotName: "Kandy Depot",
    stopsCount: 2,
    nextStopName: "Waypoint Fresh Kandy Central",
    plannedDepartureTime: "05:45 AM",
    departureCountdownMinutes: 53,
    status: "loading",
    dockBay: "Bay 1C",
    verifiedItemsCount: 0,
    totalItemsCount: 2,
    driver: {
      name: "Roshan Bandara",
      designation: "Express Delivery Pilot",
      licenseId: "DL-11928-CP-44",
      phone: "+94 70 334 5511",
      avatarInitials: "RB",
    },
    payload: {
      currentKg: 1100,
      maxKg: 1500,
      percentage: 73,
      secondaryMetric: "920 kg s.m",
      currentVolumeM3: 7.2,
      maxVolumeM3: 10.0,
    },
    waypoints: [
      {
        seq: 5,
        outletId: "OUT005",
        outletCode: "OUT005",
        outletName: "Waypoint Fresh - Kandy City",
        dockType: "street",
        deliveryWindow: "06:30 - 08:30",
        parkingConstraint: "van_only",
        items: [
          {
            id: "item-5-1",
            orderRef: "ORD-0512-A",
            packageCode: "PKG-55102-A",
            sku: "SKU-DAI-880",
            itemTitle: "Artisanal Cheese & Chilled Pastries",
            category: "Dairy & Bakery",
            crateCount: 8,
            weightKg: 95,
            volumeM3: 0.8,
            temperature: "2.5°C",
            isReefer: true,
            specialHandlingCode: "COL",
            bayCoordinates: { bayX: 1, bayY: 3, bayZ: 1 },
            stagingBay: "Bay 1C",
            status: "pending",
          },
        ],
      },
    ],
  },
  {
    id: "trip-3104",
    tripCode: "RT-12",
    tripSequence: 1,
    sealNumber: "SL-78012-A",
    vehicleId: "VEH004",
    regNumber: "WP-8801",
    modelName: "Isuzu Forward Lorry",
    type: "truck",
    temp: "reefer",
    weightCapKg: 5000,
    volumeCapM3: 32.0,
    imagePath: "/vehicle-images/freeze.png",
    depotName: "Peliyagoda Depot",
    stopsCount: 4,
    nextStopName: "Waypoint Fresh Gampaha",
    plannedDepartureTime: "04:15 AM",
    departureCountdownMinutes: 0,
    status: "dispatched",
    dockBay: "Bay 5A",
    dispatchedAt: "04:18 AM",
    verifiedItemsCount: 8,
    totalItemsCount: 8,
    driver: {
      name: "Anura Kumara",
      designation: "Senior Pilot",
      licenseId: "DL-90112-WP-01",
      phone: "+94 77 112 3344",
      avatarInitials: "AK",
    },
    payload: {
      currentKg: 4800,
      maxKg: 5000,
      percentage: 96,
      secondaryMetric: "3,900 kg s.m",
      currentVolumeM3: 30.5,
      maxVolumeM3: 32.0,
    },
    waypoints: [
      {
        seq: 1,
        outletId: "OUT001",
        outletCode: "OUT001",
        outletName: "Waypoint Fresh - Gampaha",
        dockType: "rear_dock",
        deliveryWindow: "05:00 - 06:30",
        items: [],
      },
    ],
  },
  {
    id: "trip-5591",
    tripCode: "RT-13",
    tripSequence: 1,
    sealNumber: "SL-55190-C",
    vehicleId: "VEH005",
    regNumber: "WP-4412",
    modelName: "Toyota Hilux Cargo",
    type: "van",
    temp: "ambient",
    weightCapKg: 1800,
    volumeCapM3: 12.0,
    imagePath: "/vehicle-images/van.png",
    depotName: "Kelaniya Depot",
    stopsCount: 3,
    nextStopName: "Style Studio Kiribathgoda",
    plannedDepartureTime: "04:45 AM",
    departureCountdownMinutes: 0,
    status: "dispatched",
    dockBay: "Bay 3B",
    dispatchedAt: "04:47 AM",
    verifiedItemsCount: 5,
    totalItemsCount: 5,
    driver: {
      name: "Kasun Silva",
      designation: "Delivery Associate",
      licenseId: "DL-33412-WP-08",
      phone: "+94 71 556 7788",
      avatarInitials: "KS",
    },
    payload: {
      currentKg: 1450,
      maxKg: 1800,
      percentage: 80,
      secondaryMetric: "1,200 kg s.m",
      currentVolumeM3: 9.8,
      maxVolumeM3: 12.0,
    },
    waypoints: [
      {
        seq: 1,
        outletId: "OUT002",
        outletCode: "OUT002",
        outletName: "Style Studio - Kiribathgoda",
        dockType: "street",
        deliveryWindow: "05:30 - 07:00",
        items: [],
      },
    ],
  },
  {
    id: "trip-1109",
    tripCode: "RT-11",
    tripSequence: 1,
    sealNumber: "SL-11092-D",
    vehicleId: "VEH006",
    regNumber: "WP-9921",
    modelName: "Isuzu ELF NPR",
    type: "truck",
    temp: "reefer",
    weightCapKg: 4200,
    volumeCapM3: 28.0,
    imagePath: "/vehicle-images/freeze.png",
    depotName: "Peliyagoda Depot",
    stopsCount: 3,
    nextStopName: "Waypoint Fresh Kelaniya",
    plannedDepartureTime: "05:00 AM",
    departureCountdownMinutes: 0,
    status: "flagged",
    dockBay: "Bay 3A",
    flagReason: "Seal tamper detected & 2 crates shortfall reported",
    verifiedItemsCount: 3,
    totalItemsCount: 6,
    driver: {
      name: "Nalin Wickramasinghe",
      designation: "Heavy Vehicle Pilot",
      licenseId: "DL-77123-WP-04",
      phone: "+94 76 998 1122",
      avatarInitials: "NW",
    },
    payload: {
      currentKg: 3100,
      maxKg: 4200,
      percentage: 74,
      secondaryMetric: "2,400 kg s.m",
      currentVolumeM3: 21.0,
      maxVolumeM3: 28.0,
    },
    waypoints: [
      {
        seq: 1,
        outletId: "OUT003",
        outletCode: "OUT003",
        outletName: "Waypoint Fresh - Kelaniya",
        dockType: "rear_dock",
        deliveryWindow: "06:00 - 07:30",
        items: [],
      },
    ],
  },
];
