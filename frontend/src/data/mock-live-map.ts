export type StoreCategory = "fresh" | "supermarket" | "pharmacy" | "chilled";

export interface StoreLocation {
  id: string;
  code: string;
  outletId?: string;
  name: string;
  chain: string;
  brand?: "Fresh" | "Style" | "Tech";
  dockType?: "rear_dock" | "street" | "mall_bay";
  parkingConstraint?: "normal" | "van_only" | "mall_dock";
  category: StoreCategory;
  address: string;
  lat: number;
  lng: number;
  contactPerson: string;
  contactPhone: string;
  todayStatus: "delivered" | "in_transit" | "scheduled";
  cratesScheduled: number;
  assignedVehicle?: string;
  deliveryWindow: string;
}

export interface VehicleTrackingData {
  id: string;
  code: string;
  vehicleId?: string;
  vehicleType: string;
  vehicleCategory: "truck" | "van";
  temp?: "reefer" | "ambient";
  reeferTempCelsius?: number;
  brand?: "Fresh" | "Style" | "Tech";
  depot?: "Peliyagoda" | "Kandy";
  imageUrl: string;
  driverName: string;
  driverPhone: string;
  status: "en_route" | "at_stop" | "delayed";
  currentLocation: [number, number];
  heading: number; // 0 to 360 degrees (0 = North / Upward)
  weightPercentage: number;
  weightKg: number;
  maxWeightKg: number;
  volumePercentage: number;
  volumeCbm: number;
  maxVolumeCbm: number;
  cratesCount: number;
  nextStop: string;
  nextStopEta: string;
  stopsTotal: number;
  stopsCompleted: number;
}

export interface MapThemePreset {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export const CENTRAL_HUB = {
  name: "Peliyagoda Central Distribution Hub",
  code: "HUB-WEST-01",
  location: [6.9654, 79.9042] as [number, number],
};

export const MOCK_STORES: StoreLocation[] = [
  {
    id: "st1",
    code: "OUT-0101",
    name: "Keells Super - Fort",
    chain: "Keells",
    category: "supermarket",
    address: "York Street, Colombo 01",
    lat: 6.9366,
    lng: 79.8454,
    contactPerson: "N. Gunawardena",
    contactPhone: "+94 11 234 5678",
    todayStatus: "delivered",
    cratesScheduled: 14,
    assignedVehicle: "TRK-0841",
    deliveryWindow: "08:00 - 09:00",
  },
  {
    id: "st2",
    code: "OUT-0102",
    name: "Cargills Food City - Slave Island",
    chain: "Cargills",
    category: "supermarket",
    address: "Justice Akbar Mawatha, Colombo 02",
    lat: 6.9234,
    lng: 79.8521,
    contactPerson: "P. Jayasuriya",
    contactPhone: "+94 11 245 6789",
    todayStatus: "delivered",
    cratesScheduled: 8,
    assignedVehicle: "TRK-0841",
    deliveryWindow: "09:00 - 10:00",
  },
  {
    id: "st3",
    code: "OUT-0103",
    name: "Lanka Fresh Organics - Kollupitiya",
    chain: "Lanka Fresh",
    category: "fresh",
    address: "Galle Road, Colombo 03",
    lat: 6.9082,
    lng: 79.8528,
    contactPerson: "D. Mendis",
    contactPhone: "+94 11 256 7890",
    todayStatus: "in_transit",
    cratesScheduled: 22,
    assignedVehicle: "TRK-0841",
    deliveryWindow: "10:00 - 10:30",
  },
  {
    id: "st4",
    code: "OUT-0104",
    name: "Spar Supermarket - Bambalapitiya",
    chain: "Spar",
    category: "supermarket",
    address: "Duplication Road, Colombo 04",
    lat: 6.8912,
    lng: 79.8584,
    contactPerson: "C. Wickramasinghe",
    contactPhone: "+94 11 267 8901",
    todayStatus: "scheduled",
    cratesScheduled: 19,
    assignedVehicle: "TRK-0841",
    deliveryWindow: "11:00 - 11:30",
  },
  {
    id: "st5",
    code: "OUT-0105",
    name: "Arpico Fresh Market - Wellawatte",
    chain: "Arpico",
    category: "fresh",
    address: "Galle Road, Colombo 06",
    lat: 6.8745,
    lng: 79.8621,
    contactPerson: "R. Senanayake",
    contactPhone: "+94 11 278 9012",
    todayStatus: "scheduled",
    cratesScheduled: 15,
    assignedVehicle: "TRK-0841",
    deliveryWindow: "11:30 - 12:00",
  },
  {
    id: "st6",
    code: "OUT-0106",
    name: "Keells Super - Town Hall",
    chain: "Keells",
    category: "supermarket",
    address: "C.W.W. Kannangara Mawatha, Colombo 07",
    lat: 6.9147,
    lng: 79.8682,
    contactPerson: "B. Alwis",
    contactPhone: "+94 11 289 0123",
    todayStatus: "delivered",
    cratesScheduled: 26,
    assignedVehicle: "TRK-1092",
    deliveryWindow: "08:30 - 09:30",
  },
  {
    id: "st7",
    code: "OUT-0107",
    name: "Cargills Express - Borella",
    chain: "Cargills",
    category: "supermarket",
    address: "Ward Place, Colombo 08",
    lat: 6.9147,
    lng: 79.8792,
    contactPerson: "H. Kumara",
    contactPhone: "+94 11 290 1234",
    todayStatus: "in_transit",
    cratesScheduled: 30,
    assignedVehicle: "TRK-1092",
    deliveryWindow: "09:30 - 10:00",
  },
  {
    id: "st8",
    code: "OUT-0108",
    name: "Healthguard Pharmacy - Rajagiriya",
    chain: "Healthguard",
    category: "pharmacy",
    address: "Kotte Road, Rajagiriya",
    lat: 6.9095,
    lng: 79.8965,
    contactPerson: "A. Silva",
    contactPhone: "+94 11 301 2345",
    todayStatus: "scheduled",
    cratesScheduled: 12,
    assignedVehicle: "TRK-1092",
    deliveryWindow: "11:00 - 11:45",
  },
  {
    id: "st9",
    code: "OUT-0109",
    name: "Dehiwala Organic Greens",
    chain: "Organic Greens",
    category: "fresh",
    address: "Galle Road, Dehiwala",
    lat: 6.8452,
    lng: 79.8712,
    contactPerson: "T. Bandara",
    contactPhone: "+94 11 312 3456",
    todayStatus: "in_transit",
    cratesScheduled: 11,
    assignedVehicle: "VAN-0433",
    deliveryWindow: "10:00 - 10:30",
  },
  {
    id: "st10",
    code: "OUT-0110",
    name: "Mount Lavinia Chilled Dairy Hub",
    chain: "Dairy Hub",
    category: "chilled",
    address: "Hotel Road, Mount Lavinia",
    lat: 6.8321,
    lng: 79.8654,
    contactPerson: "V. Fonseka",
    contactPhone: "+94 11 323 4567",
    todayStatus: "scheduled",
    cratesScheduled: 16,
    assignedVehicle: "VAN-0433",
    deliveryWindow: "11:00 - 11:30",
  },
];

export const MOCK_VEHICLES: VehicleTrackingData[] = [
  {
    id: "v1",
    code: "TRK-0841",
    vehicleType: "14ft Cold Reefer",
    vehicleCategory: "truck",
    imageUrl: "/vehicle-images/freeze.png",
    driverName: "S. Perera",
    driverPhone: "+94 77 123 4567",
    status: "en_route",
    currentLocation: [6.9271, 79.8612],
    heading: 185,
    weightPercentage: 80,
    weightKg: 2800,
    maxWeightKg: 3500,
    volumePercentage: 74,
    volumeCbm: 13.3,
    maxVolumeCbm: 18.0,
    cratesCount: 84,
    nextStop: "Keells Super - Fort",
    nextStopEta: "08:45 AM",
    stopsTotal: 6,
    stopsCompleted: 2,
  },
  {
    id: "v2",
    code: "TRK-1092",
    vehicleType: "20ft Heavy Box Truck",
    vehicleCategory: "truck",
    imageUrl: "/vehicle-images/dry.png",
    driverName: "M. Fernando",
    driverPhone: "+94 71 987 6543",
    status: "delayed",
    currentLocation: [6.9147, 79.8732],
    heading: 95,
    weightPercentage: 88,
    weightKg: 4400,
    maxWeightKg: 5000,
    volumePercentage: 92,
    volumeCbm: 23.0,
    maxVolumeCbm: 25.0,
    cratesCount: 120,
    nextStop: "Cargills Express - Borella",
    nextStopEta: "09:30 AM",
    stopsTotal: 8,
    stopsCompleted: 3,
  },
  {
    id: "v3",
    code: "VAN-0433",
    vehicleType: "Express Delivery Van",
    vehicleCategory: "van",
    imageUrl: "/vehicle-images/van.png",
    driverName: "K. Rathnayake",
    driverPhone: "+94 76 555 1234",
    status: "en_route",
    currentLocation: [6.8654, 79.8682],
    heading: 210,
    weightPercentage: 52,
    weightKg: 780,
    maxWeightKg: 1500,
    volumePercentage: 60,
    volumeCbm: 4.8,
    maxVolumeCbm: 8.0,
    cratesCount: 38,
    nextStop: "Lanka Fresh Organics",
    nextStopEta: "10:05 AM",
    stopsTotal: 4,
    stopsCompleted: 1,
  },
  {
    id: "v4",
    code: "TRK-0512",
    vehicleType: "16ft Cold Reefer",
    vehicleCategory: "truck",
    imageUrl: "/vehicle-images/freeze.png",
    driverName: "A. Jayasinghe",
    driverPhone: "+94 70 333 4455",
    status: "at_stop",
    currentLocation: [6.9366, 79.8454],
    heading: 0,
    weightPercentage: 35,
    weightKg: 1400,
    maxWeightKg: 4000,
    volumePercentage: 42,
    volumeCbm: 8.4,
    maxVolumeCbm: 20.0,
    cratesCount: 72,
    nextStop: "Spar Supermarket",
    nextStopEta: "11:15 AM",
    stopsTotal: 5,
    stopsCompleted: 4,
  },
  {
    id: "v5",
    code: "VAN-0988",
    vehicleType: "Transit Van",
    vehicleCategory: "van",
    imageUrl: "/vehicle-images/van.png",
    driverName: "D. Wickrama",
    driverPhone: "+94 72 444 8899",
    status: "en_route",
    currentLocation: [6.9512, 79.8781],
    heading: 320,
    weightPercentage: 74,
    weightKg: 1110,
    maxWeightKg: 1500,
    volumePercentage: 80,
    volumeCbm: 6.4,
    maxVolumeCbm: 8.0,
    cratesCount: 45,
    nextStop: "Dehiwala Greens",
    nextStopEta: "10:30 AM",
    stopsTotal: 7,
    stopsCompleted: 3,
  },
];

export const MAP_THEMES: MapThemePreset[] = [
  {
    id: "carto-positron",
    name: "Carto Positron (Light)",
    url: "https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  {
    id: "carto-voyager",
    name: "Carto Voyager",
    url: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  {
    id: "osm-standard",
    name: "OpenStreetMap Standard",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    id: "custom-api",
    name: "Custom / MapTiler API",
    url:
      (import.meta as unknown as { env: Record<string, string> }).env
        ?.VITE_MAP_TILE_URL ||
      "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key={apiKey}",
    attribution:
      '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 20,
  },
];

export function buildTileUrl(rawUrl: string, apiKey?: string): string {
  let url = rawUrl.trim();
  const trimmedKey = apiKey ? apiKey.trim() : "";

  if (trimmedKey) {
    if (url.includes("{apiKey}")) {
      url = url.replace(/\{apiKey\}/g, trimmedKey);
    } else if (url.includes("{key}")) {
      url = url.replace(/\{key\}/g, trimmedKey);
    } else if (
      (url.includes("cartocdn.com") ||
        url.includes("maptiler.com") ||
        url.includes("stadiamaps.com")) &&
      !url.includes("key=")
    ) {
      const separator = url.includes("?") ? "&" : "?";
      url = `${url}${separator}key=${trimmedKey}`;
    }
  } else {
    url = url.replace(/[?&]key=\{apiKey\}/g, "").replace(/\{apiKey\}/g, "");
    url = url.replace(/[?&]key=\{key\}/g, "").replace(/\{key\}/g, "");
  }

  return url;
}

export function getVehicleConfig(vehicleType: string): {
  iconUrl: string;
  imgWidth: number;
  imgHeight: number;
  iconWidth: number;
  iconHeight: number;
  anchorX: number;
  anchorY: number;
} {
  const type = vehicleType.toLowerCase();

  if (type.includes("van")) {
    return {
      iconUrl: "/map-icons/van-top.png",
      imgWidth: 24,
      imgHeight: 34,
      iconWidth: 44,
      iconHeight: 52,
      anchorX: 22,
      anchorY: 34,
    };
  }

  if (type.includes("20ft") || type.includes("box") || type.includes("heavy")) {
    return {
      iconUrl: "/map-icons/dry-top.png",
      imgWidth: 38,
      imgHeight: 54,
      iconWidth: 54,
      iconHeight: 72,
      anchorX: 27,
      anchorY: 48,
    };
  }

  return {
    iconUrl: "/map-icons/cool-top.png",
    imgWidth: 32,
    imgHeight: 46,
    iconWidth: 48,
    iconHeight: 64,
    anchorX: 24,
    anchorY: 42,
  };
}
