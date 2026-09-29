import * as React from "react";
import L from "leaflet";

export interface StoreLocation {
  id: string;
  code: string;
  name: string;
  chain: string;
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
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  status: "en_route" | "at_stop" | "delayed";
  currentLocation: [number, number];
  heading: number; // 0 to 360 degrees (0 = North / Upward)
  speedKmH: number;
  fuelPercentage: number;
  loadPercentage: number;
  loadKg: number;
  totalCapacityKg: number;
}

const CENTRAL_HUB = {
  name: "Peliyagoda Central Distribution Hub",
  code: "HUB-WEST-01",
  location: [6.9654, 79.9042] as [number, number],
};

const MOCK_STORES: StoreLocation[] = [
  {
    id: "st1",
    code: "OUT-0101",
    name: "Keells Super - Fort",
    chain: "Keells",
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
    name: "Lanka Super - Kollupitiya",
    chain: "Lanka Super",
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
    name: "Arpico Supercentre - Wellawatte",
    chain: "Arpico",
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
    name: "Keells Super - Dehiwala",
    chain: "Keells",
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
    name: "Cargills Food City - Mount Lavinia",
    chain: "Cargills",
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

const MOCK_VEHICLES: VehicleTrackingData[] = [
  {
    id: "v1",
    code: "TRK-0841",
    vehicleType: "14ft Reefer",
    driverName: "S. Perera",
    driverPhone: "+94 77 123 4567",
    status: "en_route",
    currentLocation: [6.9271, 79.8612],
    heading: 185,
    speedKmH: 42,
    fuelPercentage: 78,
    loadPercentage: 65,
    loadKg: 2275,
    totalCapacityKg: 3500,
  },
  {
    id: "v2",
    code: "TRK-1092",
    vehicleType: "20ft Box Truck",
    driverName: "M. Fernando",
    driverPhone: "+94 71 987 6543",
    status: "delayed",
    currentLocation: [6.9147, 79.8732],
    heading: 95,
    speedKmH: 12,
    fuelPercentage: 62,
    loadPercentage: 88,
    loadKg: 4400,
    totalCapacityKg: 5000,
  },
  {
    id: "v3",
    code: "VAN-0433",
    vehicleType: "Express Delivery Van",
    driverName: "K. Rathnayake",
    driverPhone: "+94 76 555 1234",
    status: "en_route",
    currentLocation: [6.8654, 79.8682],
    heading: 210,
    speedKmH: 38,
    fuelPercentage: 84,
    loadPercentage: 52,
    loadKg: 780,
    totalCapacityKg: 1500,
  },
  {
    id: "v4",
    code: "TRK-0512",
    vehicleType: "16ft Reefer",
    driverName: "A. Jayasinghe",
    driverPhone: "+94 70 333 4455",
    status: "at_stop",
    currentLocation: [6.9366, 79.8454],
    heading: 0,
    speedKmH: 0,
    fuelPercentage: 91,
    loadPercentage: 35,
    loadKg: 1400,
    totalCapacityKg: 4000,
  },
  {
    id: "v5",
    code: "VAN-0988",
    vehicleType: "Transit Van",
    driverName: "D. Wickrama",
    driverPhone: "+94 72 444 8899",
    status: "en_route",
    currentLocation: [6.9512, 79.8781],
    heading: 320,
    speedKmH: 48,
    fuelPercentage: 70,
    loadPercentage: 74,
    loadKg: 1110,
    totalCapacityKg: 1500,
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

function getVehicleIconUrl(vehicleType: string): string {
  const type = vehicleType.toLowerCase();
  if (
    type.includes("reefer") ||
    type.includes("cold") ||
    type.includes("cool") ||
    type.includes("chilled")
  ) {
    return "/map-icons/cool-top.png";
  }
  if (type.includes("van")) {
    return "/map-icons/van-top.png";
  }
  return "/map-icons/dry-top.png";
}

function createHubIcon() {
  return L.divIcon({
    className: "custom-hub-icon",
    html: `
      <div style="width: 36px; height: 36px; border-radius: 10px; background: #0069A8; color: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.25); border: 2px solid #ffffff;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
          <path d="M240,184h-8V57.9l9.67-2.08a8,8,0,1,0-3.35-15.64l-224,48A8,8,0,0,0,16,104a8.16,8.16,0,0,0,1.69-.18L24,102.47V184H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM40,99,216,61.33V184H192V128a8,8,0,0,0-8-8H72a8,8,0,0,0-8,8v56H40Z"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function createTopViewVehicleIcon(vehicle: VehicleTrackingData) {
  const iconUrl = getVehicleIconUrl(vehicle.vehicleType);
  const heading = vehicle.heading || 0;
  const isDelayed = vehicle.status === "delayed";
  const isAtStop = vehicle.status === "at_stop";
  const ringColor = isDelayed ? "#D97706" : isAtStop ? "#059669" : "#0069A8";

  return L.divIcon({
    className: "custom-topview-vehicle-icon",
    html: `
      <div style="position: relative; width: 64px; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
        <!-- Vehicle Code Tag -->
        <div style="background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 6px; padding: 1px 6px; font-size: 10px; font-weight: 700; font-family: sans-serif; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.15); margin-bottom: 2px;">
          ${vehicle.code}
        </div>
        
        <!-- Top-view vehicle image container with heading rotation -->
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 255, 255, 0.9); border: 2px solid ${ringColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
          <img 
            src="${iconUrl}" 
            alt="${vehicle.code}" 
            style="width: 28px; height: 38px; object-fit: contain; transform: rotate(${heading}deg); transform-origin: center center; display: block;" 
          />
        </div>
      </div>
    `,
    iconSize: [64, 68],
    iconAnchor: [32, 48],
  });
}

function createStoreIcon(store: StoreLocation) {
  const isDelivered = store.todayStatus === "delivered";
  const isInTransit = store.todayStatus === "in_transit";
  const bg = isDelivered ? "#059669" : isInTransit ? "#0069A8" : "#64748B";

  return L.divIcon({
    className: "custom-store-marker",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="width: 28px; height: 28px; border-radius: 8px; background: ${bg}; color: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 2px solid #ffffff;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
            <path d="M239.71,81.14l-16-48A8,8,0,0,0,216.12,28H39.88a8,8,0,0,0-7.59,5.14l-16,48A8,8,0,0,0,24,96v16a8,8,0,0,0,8,8v96a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V120a8,8,0,0,0,8-8V96A8,8,0,0,0,239.71,81.14ZM45.72,44H210.28l10.67,32H35.05ZM208,216H48V120H208Zm16-112H32V92H224Z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function LiveMapPage() {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);

  const tileUrl =
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_MAP_TILE_URL ||
    "https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png";

  const apiKey =
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_MAP_API_KEY ||
    "";

  const resolvedTileUrl = buildTileUrl(tileUrl, apiKey);

  React.useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [6.9271, 79.8612],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer(resolvedTileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
      subdomains: "abcd",
    }).addTo(map);

    // Add Central Hub Marker
    L.marker(CENTRAL_HUB.location, { icon: createHubIcon() })
      .bindPopup(
        `<div style="font-family: sans-serif; padding: 4px;"><p style="font-weight: bold; margin: 0; font-size: 13px; color: #0f172a;">${CENTRAL_HUB.name}</p><p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${CENTRAL_HUB.code}</p></div>`
      )
      .addTo(map);

    // Add Store Markers
    MOCK_STORES.forEach((store) => {
      const icon = createStoreIcon(store);
      L.marker([store.lat, store.lng], { icon })
        .bindPopup(
          `<div style="font-family: sans-serif; padding: 4px; min-width: 170px;">
            <p style="font-weight: bold; margin: 0; font-size: 13px; color: #0f172a;">${store.name}</p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${store.address}</p>
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.4;">
              <p style="margin: 0; color: #334155;"><strong>Status:</strong> ${store.todayStatus.toUpperCase()}</p>
              <p style="margin: 0; color: #334155;"><strong>Crates:</strong> ${store.cratesScheduled}</p>
              <p style="margin: 0; color: #334155;"><strong>Vehicle:</strong> ${store.assignedVehicle || "Unassigned"}</p>
            </div>
          </div>`
        )
        .addTo(map);
    });

    // Add Vehicle Markers (Top-View PNGs)
    MOCK_VEHICLES.forEach((vehicle) => {
      const icon = createTopViewVehicleIcon(vehicle);
      L.marker(vehicle.currentLocation, { icon })
        .bindPopup(
          `<div style="font-family: sans-serif; padding: 4px; min-width: 160px;">
            <p style="font-weight: bold; margin: 0; font-size: 13px; color: #0f172a;">${vehicle.code}</p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${vehicle.vehicleType}</p>
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.4;">
              <p style="margin: 0; color: #334155;"><strong>Driver:</strong> ${vehicle.driverName}</p>
              <p style="margin: 0; color: #334155;"><strong>Speed:</strong> ${vehicle.speedKmH} km/h</p>
              <p style="margin: 0; color: #334155;"><strong>Fuel:</strong> ${vehicle.fuelPercentage}%</p>
              <p style="margin: 0; color: #334155;"><strong>Load:</strong> ${vehicle.loadKg} / ${vehicle.totalCapacityKg} kg (${vehicle.loadPercentage}%)</p>
            </div>
          </div>`
        )
        .addTo(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [resolvedTileUrl]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-background">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

export default LiveMapPage;
