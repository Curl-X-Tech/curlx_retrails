export interface LoaderOrderItem {
  id: string;
  orderRef: string;
  itemTitle: string;
  crateCount: number;
  weightKg: number;
  temperature: string;
  stagingBay: string;
  isReefer: boolean;
  isFragile?: boolean;
  status: "pending" | "verified" | "flagged";
  barcode: string;
}

export interface LoaderWaypoint {
  seq: number;
  outletName: string;
  outletCode: string;
  items: LoaderOrderItem[];
}

export interface LoaderVehicleTrip {
  id: string;
  tripCode: string;
  vehicleId: string;
  regNumber: string;
  modelName: string;
  type: "truck" | "van";
  temp: "reefer" | "ambient";
  imagePath: string;
  depotName: string;
  stopsCount: number;
  nextStopName: string;
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
  };
  waypoints: LoaderWaypoint[];
}

export const mockLoaderTrips: LoaderVehicleTrip[] = [
  {
    id: "trip-4811",
    tripCode: "RT-14",
    vehicleId: "VEH001",
    regNumber: "NP-4811",
    modelName: "Isuzu ELF NPR",
    type: "truck",
    temp: "reefer",
    imagePath: "/vehicle-images/freeze.png",
    depotName: "Peliyagoda Depot",
    stopsCount: 3,
    nextStopName: "Waypoint Fresh Wattala",
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
    },
    waypoints: [
      {
        seq: 10,
        outletName: "Waypoint Fresh - Colpetty",
        outletCode: "OUT010",
        items: [
          {
            id: "item-10-1",
            orderRef: "#ORD-0890-A",
            itemTitle: "Atlantic Salmon Fillets & Chilled Poultry",
            crateCount: 14,
            weightKg: 210,
            temperature: "-18.0°C",
            stagingBay: "Bay 4B",
            isReefer: true,
            status: "verified",
            barcode: "PKG-88192-A",
          },
          {
            id: "item-10-2",
            orderRef: "#ORD-0890-B",
            itemTitle: "Imported Butter & Dairy Blocks",
            crateCount: 10,
            weightKg: 150,
            temperature: "-4.0°C",
            stagingBay: "Bay 4B",
            isReefer: true,
            status: "verified",
            barcode: "PKG-88192-B",
          },
        ],
      },
      {
        seq: 9,
        outletName: "Waypoint Fresh - Wattala",
        outletCode: "OUT009",
        items: [
          {
            id: "item-9-1",
            orderRef: "#ORD-0891-A",
            itemTitle: "Yellowfin Tuna Loins & Prime Seafood",
            crateCount: 18,
            weightKg: 260,
            temperature: "-18.2°C",
            stagingBay: "Bay 4C",
            isReefer: true,
            status: "verified",
            barcode: "PKG-90412-A",
          },
          {
            id: "item-9-2",
            orderRef: "#ORD-0891-B",
            itemTitle: "Frozen Organic Beef Cuts & Ground Meat",
            crateCount: 18,
            weightKg: 240,
            temperature: "-19.0°C",
            stagingBay: "Bay 4C",
            isReefer: true,
            status: "verified",
            barcode: "PKG-90412-B",
          },
          {
            id: "item-9-3",
            orderRef: "#ORD-0891-C",
            itemTitle: "Chilled Farm Milk Crates (1L x 12)",
            crateCount: 18,
            weightKg: 220,
            temperature: "2.0°C",
            stagingBay: "Bay 4C",
            isReefer: true,
            status: "pending",
            barcode: "PKG-90412-C",
          },
        ],
      },
      {
        seq: 8,
        outletName: "Waypoint Fresh - Ja-Ela",
        outletCode: "OUT008",
        items: [
          {
            id: "item-8-1",
            orderRef: "#ORD-0892-A",
            itemTitle: "Fresh Iceberg Lettuce & Garden Produce",
            crateCount: 22,
            weightKg: 180,
            temperature: "4.0°C",
            stagingBay: "Bay 4A",
            isReefer: true,
            status: "pending",
            barcode: "PKG-91204-A",
          },
        ],
      },
    ],
  },
  {
    id: "trip-2294",
    tripCode: "RT-15",
    vehicleId: "VEH002",
    regNumber: "NP-4811",
    modelName: "Mitsubishi Fuso Canter",
    type: "truck",
    temp: "ambient",
    imagePath: "/vehicle-images/dry.png",
    depotName: "Peliyagoda Depot",
    stopsCount: 3,
    nextStopName: "Waypoint Fresh Negombo",
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
    },
    waypoints: [
      {
        seq: 12,
        outletName: "Style Studio - Negombo",
        outletCode: "OUT012",
        items: [
          {
            id: "item-12-1",
            orderRef: "#ORD-0711-A",
            itemTitle: "Cotton Apparel Cartons & Hangers",
            crateCount: 24,
            weightKg: 320,
            temperature: "Ambient 26°C",
            stagingBay: "Bay 2A",
            isReefer: false,
            status: "pending",
            barcode: "PKG-77412-A",
          },
        ],
      },
    ],
  },
  {
    id: "trip-7721",
    tripCode: "RT-16",
    vehicleId: "VEH003",
    regNumber: "NP-4811",
    modelName: "Nissan Urvan",
    type: "van",
    temp: "reefer",
    imagePath: "/vehicle-images/van.png",
    depotName: "Kandy Depot",
    stopsCount: 3,
    nextStopName: "Waypoint Fresh Kandy Central",
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
    },
    waypoints: [
      {
        seq: 5,
        outletName: "Waypoint Fresh - Kandy City",
        outletCode: "OUT005",
        items: [
          {
            id: "item-5-1",
            orderRef: "#ORD-0512-A",
            itemTitle: "Artisanal Cheese & Chilled Pastries",
            crateCount: 8,
            weightKg: 95,
            temperature: "2.5°C",
            stagingBay: "Bay 1C",
            isReefer: true,
            status: "pending",
            barcode: "PKG-55102-A",
          },
        ],
      },
    ],
  },
];
