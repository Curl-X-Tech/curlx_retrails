import type { MapThemePreset, StoreLocation, VehicleTrackingData } from "@/types";

export type { MapThemePreset, StoreLocation, VehicleTrackingData };

export const CENTRAL_HUB = {
  name: "Peliyagoda Central Distribution Depot",
  code: "PEL",
  location: [6.9654, 79.9042] as [number, number],
};

export const MOCK_STORES: StoreLocation[] = [
  {
    id: "st1",
    code: "OUT001",
    outletId: "OUT001",
    name: "Waypoint Fresh - Fort Dock",
    brand: "Fresh",
    district: "Colombo",
    dockType: "rear_dock",
    parkingConstraint: "normal",
    address: "York Street, Colombo 01",
    lat: 6.9366,
    lng: 79.8454,
    contactPhone: "+94 11 234 5678",
    todayStatus: "delivered",
    cratesScheduled: 14,
    assignedVehicle: "NP-4811",
    deliveryWindow: "05:00 - 08:00 AM",
  },
  {
    id: "st2",
    code: "OUT002",
    outletId: "OUT002",
    name: "Waypoint Fresh - Slave Island",
    brand: "Fresh",
    district: "Colombo",
    dockType: "street",
    parkingConstraint: "van_only",
    address: "Justice Akbar Mawatha, Colombo 02",
    lat: 6.9234,
    lng: 79.8521,
    contactPhone: "+94 11 245 6789",
    todayStatus: "delivered",
    cratesScheduled: 8,
    assignedVehicle: "NP-4811",
    deliveryWindow: "05:00 - 08:00 AM",
  },
  {
    id: "st3",
    code: "OUT003",
    outletId: "OUT003",
    name: "Waypoint Fresh - Kollupitiya",
    brand: "Fresh",
    district: "Colombo",
    dockType: "rear_dock",
    parkingConstraint: "normal",
    address: "Galle Road, Colombo 03",
    lat: 6.9082,
    lng: 79.8528,
    contactPhone: "+94 11 256 7890",
    todayStatus: "in_transit",
    cratesScheduled: 22,
    assignedVehicle: "NP-4811",
    deliveryWindow: "05:00 - 08:00 AM",
  },
  {
    id: "st4",
    code: "OUT004",
    outletId: "OUT004",
    name: "Waypoint Style - Bambalapitiya Mall",
    brand: "Style",
    district: "Colombo",
    dockType: "mall_bay",
    parkingConstraint: "mall_dock",
    address: "Duplication Road, Colombo 04",
    lat: 6.8912,
    lng: 79.8584,
    contactPhone: "+94 11 267 8901",
    todayStatus: "scheduled",
    cratesScheduled: 19,
    assignedVehicle: "WP-3021",
    deliveryWindow: "09:00 - 11:00 AM",
  },
  {
    id: "st5",
    code: "OUT005",
    outletId: "OUT005",
    name: "Waypoint Fresh - Wellawatte",
    brand: "Fresh",
    district: "Colombo",
    dockType: "street",
    parkingConstraint: "van_only",
    address: "Galle Road, Colombo 06",
    lat: 6.8745,
    lng: 79.8621,
    contactPhone: "+94 11 278 9012",
    todayStatus: "scheduled",
    cratesScheduled: 15,
    assignedVehicle: "NP-4811",
    deliveryWindow: "05:00 - 08:00 AM",
  },
  {
    id: "st6",
    code: "OUT006",
    outletId: "OUT006",
    name: "Waypoint Tech - Town Hall Bay",
    brand: "Tech",
    district: "Colombo",
    dockType: "rear_dock",
    parkingConstraint: "normal",
    address: "C.W.W. Kannangara Mawatha, Colombo 07",
    lat: 6.9147,
    lng: 79.8682,
    contactPhone: "+94 11 289 0123",
    todayStatus: "delivered",
    cratesScheduled: 26,
    assignedVehicle: "WP-3021",
    deliveryWindow: "09:00 - 11:00 AM",
  },
  {
    id: "st7",
    code: "OUT007",
    outletId: "OUT007",
    name: "Waypoint Fresh - Borella Central",
    brand: "Fresh",
    district: "Colombo",
    dockType: "rear_dock",
    parkingConstraint: "normal",
    address: "Ward Place, Colombo 08",
    lat: 6.9147,
    lng: 79.8792,
    contactPhone: "+94 11 290 1234",
    todayStatus: "in_transit",
    cratesScheduled: 30,
    assignedVehicle: "NP-4811",
    deliveryWindow: "05:00 - 08:00 AM",
  },
  {
    id: "st8",
    code: "OUT008",
    outletId: "OUT008",
    name: "Waypoint Style - Rajagiriya Arcade",
    brand: "Style",
    district: "Colombo",
    dockType: "mall_bay",
    parkingConstraint: "mall_dock",
    address: "Kotte Road, Rajagiriya",
    lat: 6.9095,
    lng: 79.8965,
    contactPhone: "+94 11 301 2345",
    todayStatus: "scheduled",
    cratesScheduled: 12,
    assignedVehicle: "WP-3021",
    deliveryWindow: "10:30 - 12:30 PM",
  },
  {
    id: "st9",
    code: "OUT009",
    outletId: "OUT009",
    name: "Waypoint Fresh - Dehiwala",
    brand: "Fresh",
    district: "Colombo",
    dockType: "street",
    parkingConstraint: "van_only",
    address: "Galle Road, Dehiwala",
    lat: 6.8452,
    lng: 79.8712,
    contactPhone: "+94 11 312 3456",
    todayStatus: "in_transit",
    cratesScheduled: 11,
    assignedVehicle: "WP-NB-5521",
    deliveryWindow: "05:00 - 08:00 AM",
  },
  {
    id: "st10",
    code: "OUT010",
    outletId: "OUT010",
    name: "Waypoint Fresh - Mount Lavinia",
    brand: "Fresh",
    district: "Colombo",
    dockType: "street",
    parkingConstraint: "van_only",
    address: "Hotel Road, Mount Lavinia",
    lat: 6.8321,
    lng: 79.8654,
    contactPhone: "+94 11 323 4567",
    todayStatus: "scheduled",
    cratesScheduled: 16,
    assignedVehicle: "WP-NB-5521",
    deliveryWindow: "05:00 - 08:00 AM",
  },
];

export const MOCK_VEHICLES: VehicleTrackingData[] = [
  {
    id: "v1",
    code: "NP-4811",
    vehicleId: "VEH001",
    vehicleType: "14ft Cold Reefer Lorry",
    vehicleCategory: "truck",
    temp: "reefer",
    reeferTempCelsius: 3.2,
    brand: "Fresh",
    depot: "Peliyagoda",
    imageUrl: "/vehicle-images/freeze.png",
    driverName: "Saman Perera",
    driverPhone: "+94 77 123 4567",
    status: "en_route",
    currentLocation: [6.9271, 79.8612],
    heading: 185,
    weightPercentage: 80,
    weightKg: 3360,
    maxWeightKg: 4200,
    volumePercentage: 80,
    volumeCbm: 22.4,
    maxVolumeCbm: 28.0,
    cratesCount: 84,
    nextStop: "Waypoint Fresh - Fort Dock",
    nextStopEta: "07:30 AM",
    stopsTotal: 5,
    stopsCompleted: 2,
  },
  {
    id: "v2",
    code: "WP-3021",
    vehicleId: "VEH002",
    vehicleType: "16ft Ambient Freight Lorry",
    vehicleCategory: "truck",
    temp: "ambient",
    brand: "Style",
    depot: "Peliyagoda",
    imageUrl: "/vehicle-images/dry.png",
    driverName: "Ruwan Silva",
    driverPhone: "+94 71 456 7890",
    status: "delayed",
    currentLocation: [6.9147, 79.8732],
    heading: 95,
    weightPercentage: 88,
    weightKg: 5280,
    maxWeightKg: 6000,
    volumePercentage: 91,
    volumeCbm: 20.0,
    maxVolumeCbm: 22.0,
    cratesCount: 120,
    nextStop: "Waypoint Tech - Town Hall Bay",
    nextStopEta: "09:30 AM",
    stopsTotal: 6,
    stopsCompleted: 2,
  },
  {
    id: "v3",
    code: "WP-NB-5521",
    vehicleId: "VEH003",
    vehicleType: "Express Delivery Van",
    vehicleCategory: "van",
    temp: "ambient",
    brand: "Fresh",
    depot: "Peliyagoda",
    imageUrl: "/vehicle-images/van.png",
    driverName: "Dinesh Fernando",
    driverPhone: "+94 76 987 6543",
    status: "en_route",
    currentLocation: [6.8654, 79.8682],
    heading: 210,
    weightPercentage: 77,
    weightKg: 1390,
    maxWeightKg: 1800,
    volumePercentage: 78,
    volumeCbm: 5.6,
    maxVolumeCbm: 7.2,
    cratesCount: 38,
    nextStop: "Waypoint Fresh - Dehiwala",
    nextStopEta: "07:45 AM",
    stopsTotal: 4,
    stopsCompleted: 1,
  },
  {
    id: "v4",
    code: "WP-NF-9921",
    vehicleId: "VEH004",
    vehicleType: "14ft Ambient Freight Lorry",
    vehicleCategory: "truck",
    temp: "ambient",
    brand: "Tech",
    depot: "Peliyagoda",
    imageUrl: "/vehicle-images/dry.png",
    driverName: "Kasun Jayawardena",
    driverPhone: "+94 77 345 6789",
    status: "at_stop",
    currentLocation: [6.9366, 79.8454],
    heading: 0,
    weightPercentage: 85,
    weightKg: 4420,
    maxWeightKg: 5200,
    volumePercentage: 87,
    volumeCbm: 15.6,
    maxVolumeCbm: 18.0,
    cratesCount: 72,
    nextStop: "Waypoint Tech - Town Hall Bay",
    nextStopEta: "10:15 AM",
    stopsTotal: 5,
    stopsCompleted: 4,
  },
  {
    id: "v5",
    code: "WP-NC-1089",
    vehicleId: "VEH005",
    vehicleType: "Express Delivery Van",
    vehicleCategory: "van",
    temp: "ambient",
    brand: "Fresh",
    depot: "Peliyagoda",
    imageUrl: "/vehicle-images/van.png",
    driverName: "Pradeep Kumara",
    driverPhone: "+94 72 234 5678",
    status: "en_route",
    currentLocation: [6.9512, 79.8781],
    heading: 320,
    weightPercentage: 64,
    weightKg: 1150,
    maxWeightKg: 1800,
    volumePercentage: 67,
    volumeCbm: 4.8,
    maxVolumeCbm: 7.2,
    cratesCount: 45,
    nextStop: "Waypoint Fresh - Wellawatte",
    nextStopEta: "08:00 AM",
    stopsTotal: 4,
    stopsCompleted: 2,
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
    return url;
  }

  if (url.includes("maptiler.com") || url.includes("stadiamaps.com")) {
    return "https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png";
  }

  url = url.replace(/[?&]key=\{apiKey\}/g, "").replace(/\{apiKey\}/g, "");
  url = url.replace(/[?&]key=\{key\}/g, "").replace(/\{key\}/g, "");

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
