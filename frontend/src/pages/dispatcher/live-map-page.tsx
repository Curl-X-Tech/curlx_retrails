import * as React from "react";
import L from "leaflet";
import {
  PhoneIcon,
  MagnifyingGlassIcon,
  GasPumpIcon,
  PackageIcon,
  StorefrontIcon,
  TruckIcon,
  XIcon,
  CrosshairIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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
  slaStatus: "on_time" | "warning" | "delayed";
  delayMinutes?: number;
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
    slaStatus: "on_time",
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
    slaStatus: "delayed",
    delayMinutes: 24,
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
    slaStatus: "on_time",
  },
  {
    id: "v4",
    code: "TRK-0512",
    vehicleType: "16ft Chilled Reefer",
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
    slaStatus: "on_time",
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
    slaStatus: "on_time",
  },
];

export interface MapThemePreset {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

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
      <div class="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md ring-2 ring-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
          <path d="M240,184h-8V57.9l9.67-2.08a8,8,0,1,0-3.35-15.64l-224,48A8,8,0,0,0,16,104a8.16,8.16,0,0,0,1.69-.18L24,102.47V184H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM40,99,216,61.33V184H192V128a8,8,0,0,0-8-8H72a8,8,0,0,0-8,8v56H40Z"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function createTopViewVehicleIcon(vehicle: VehicleTrackingData, isSelected: boolean) {
  const iconUrl = getVehicleIconUrl(vehicle.vehicleType);
  const heading = vehicle.heading || 0;
  const isDelayed = vehicle.status === "delayed";
  const isAtStop = vehicle.status === "at_stop";
  const ringColor = isDelayed ? "#D97706" : isAtStop ? "#059669" : "#0069A8";

  return L.divIcon({
    className: "custom-vehicle-topview-marker",
    html: `
      <div class="relative flex flex-col items-center cursor-pointer select-none group">
        <!-- Floating Vehicle Badge Label -->
        <div class="mb-1 px-1.5 py-0.5 rounded-md bg-white text-slate-900 border border-slate-200/90 text-[10px] font-bold shadow-xs whitespace-nowrap transition-transform duration-200 ${isSelected ? "scale-110 ring-2 ring-primary text-primary" : "group-hover:scale-105"}">
          <span>${vehicle.code}</span>
          ${vehicle.speedKmH > 0 ? `<span class="ml-1 text-[9px] font-semibold text-slate-500 font-mono">${vehicle.speedKmH}km/h</span>` : ""}
        </div>

        <!-- Top-View Vehicle PNG with Heading Rotation -->
        <div class="relative flex items-center justify-center transition-all duration-300 ${isSelected ? "scale-125 z-50" : "hover:scale-115 z-30"}">
          ${
            vehicle.status === "en_route"
              ? `<span class="absolute -inset-2 rounded-full bg-primary/20 animate-ping pointer-events-none"></span>`
              : ""
          }
          <div class="relative flex items-center justify-center p-1 rounded-full bg-white/70 backdrop-blur-2xs shadow-md border-2" style="border-color: ${ringColor}">
            <img 
              src="${iconUrl}" 
              alt="${vehicle.code}" 
              class="w-7 h-10 object-contain drop-shadow-sm transition-transform duration-300 ease-out"
              style="transform: rotate(${heading}deg); transform-origin: center center;"
            />
          </div>
        </div>
      </div>
    `,
    iconSize: [64, 76],
    iconAnchor: [32, 48],
  });
}

function createStoreIcon(store: StoreLocation, isSelected: boolean) {
  const isDelivered = store.todayStatus === "delivered";
  const isInTransit = store.todayStatus === "in_transit";
  const bg = isDelivered ? "#059669" : isInTransit ? "#0069A8" : "#64748B";

  return L.divIcon({
    className: "custom-store-marker",
    html: `
      <div class="relative flex items-center justify-center cursor-pointer transition-transform ${isSelected ? "scale-125 z-40" : "hover:scale-110 z-20"}">
        <div class="size-7 rounded-lg flex items-center justify-center text-white shadow-sm ring-2 ring-white" style="background-color: ${bg}">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
            <path d="M239.71,81.14l-16-48A8,8,0,0,0,216.12,28H39.88a8,8,0,0,0-7.59,5.14l-16,48A8,8,0,0,0,24,96v16a8,8,0,0,0,8,8v96a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V120a8,8,0,0,0,8-8V96A8,8,0,0,0,239.71,81.14ZM45.72,44H210.28l10.67,32H35.05ZM208,216H48V120H208Zm16-112H32V92H224Z"/>
          </svg>
        </div>
        ${store.cratesScheduled ? `<span class="absolute -top-1 -right-1 bg-slate-900 text-white text-[9px] font-bold px-1 rounded-full border border-white leading-none py-0.5">${store.cratesScheduled}</span>` : ""}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

interface LeafletMapCanvasProps {
  vehicles: VehicleTrackingData[];
  stores: StoreLocation[];
  selectedVehicle?: VehicleTrackingData;
  selectedStore?: StoreLocation;
  focusedTarget: "vehicle" | "store" | null;
  onSelectVehicle: (id: string) => void;
  onSelectStore: (id: string) => void;
  showStores: boolean;
  themeId: string;
}

function LeafletMapCanvas({
  vehicles,
  stores,
  selectedVehicle,
  selectedStore,
  focusedTarget,
  onSelectVehicle,
  onSelectStore,
  showStores,
  themeId,
}: LeafletMapCanvasProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const tileLayerRef = React.useRef<L.TileLayer | null>(null);
  const vehicleMarkersRef = React.useRef<{ [key: string]: L.Marker }>({});
  const storeMarkersRef = React.useRef<{ [key: string]: L.Marker }>({});

  const selectedTheme = MAP_THEMES.find((t) => t.id === themeId) || MAP_THEMES[0];
  const apiKey =
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_MAP_API_KEY ||
    "";

  const resolvedTileUrl = buildTileUrl(selectedTheme.url, apiKey);

  // Initialize Map
  React.useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter = selectedVehicle
      ? selectedVehicle.currentLocation
      : CENTRAL_HUB.location;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false,
    });

    // Add zoom control at bottom right to keep top clear
    L.control.zoom({ position: "bottomright" }).addTo(map);

    const tileLayer = L.tileLayer(resolvedTileUrl, {
      attribution: selectedTheme.attribution,
      maxZoom: selectedTheme.maxZoom,
      subdomains: "abcd",
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Add Central Hub Marker
    L.marker(CENTRAL_HUB.location, { icon: createHubIcon() })
      .bindPopup(
        `<div class="p-1 font-sans"><p class="font-bold text-xs text-slate-900">${CENTRAL_HUB.name}</p><p class="text-[11px] text-slate-500">${CENTRAL_HUB.code}</p></div>`
      )
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer on theme/key changes
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const tileLayer = L.tileLayer(resolvedTileUrl, {
      attribution: selectedTheme.attribution,
      maxZoom: selectedTheme.maxZoom,
      subdomains: "abcd",
    }).addTo(map);

    tileLayerRef.current = tileLayer;
  }, [resolvedTileUrl, selectedTheme.attribution, selectedTheme.maxZoom]);

  // Update vehicle markers
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    vehicles.forEach((vehicle) => {
      const isSelected = vehicle.id === selectedVehicle?.id;
      const icon = createTopViewVehicleIcon(vehicle, isSelected);

      if (vehicleMarkersRef.current[vehicle.id]) {
        vehicleMarkersRef.current[vehicle.id]
          .setLatLng(vehicle.currentLocation)
          .setIcon(icon);
      } else {
        const marker = L.marker(vehicle.currentLocation, { icon }).addTo(map);

        marker.on("click", () => {
          onSelectVehicle(vehicle.id);
        });

        vehicleMarkersRef.current[vehicle.id] = marker;
      }
    });
  }, [vehicles, selectedVehicle?.id, onSelectVehicle]);

  // Update store location markers
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!showStores) {
      Object.values(storeMarkersRef.current).forEach((m) => m.remove());
      storeMarkersRef.current = {};
      return;
    }

    stores.forEach((store) => {
      const isSelected = store.id === selectedStore?.id;
      const icon = createStoreIcon(store, isSelected);

      if (storeMarkersRef.current[store.id]) {
        storeMarkersRef.current[store.id].setLatLng([store.lat, store.lng]).setIcon(icon);
      } else {
        const marker = L.marker([store.lat, store.lng], { icon }).addTo(map);

        marker.on("click", () => {
          onSelectStore(store.id);
        });

        storeMarkersRef.current[store.id] = marker;
      }
    });
  }, [stores, selectedStore?.id, showStores, onSelectStore]);

  // Smooth pan on target change
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (focusedTarget === "vehicle" && selectedVehicle) {
      map.flyTo(selectedVehicle.currentLocation, 15, { duration: 1.0 });
    } else if (focusedTarget === "store" && selectedStore) {
      map.flyTo([selectedStore.lat, selectedStore.lng], 15, { duration: 1.0 });
    }
  }, [focusedTarget, selectedVehicle, selectedStore]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}

export function LiveMapPage() {
  const [vehicles] = React.useState<VehicleTrackingData[]>(MOCK_VEHICLES);
  const [stores] = React.useState<StoreLocation[]>(MOCK_STORES);
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>("v1");
  const [selectedStoreId, setSelectedStoreId] = React.useState<string | null>(null);
  const [focusedTarget, setFocusedTarget] = React.useState<"vehicle" | "store" | null>(
    "vehicle"
  );
  const [selectedThemeId, setSelectedThemeId] = React.useState<string>("carto-positron");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [showStores, setShowStores] = React.useState<boolean>(true);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState<boolean>(true);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const selectedStore = selectedStoreId
    ? stores.find((s) => s.id === selectedStoreId)
    : undefined;

  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    setSelectedStoreId(null);
    setFocusedTarget("vehicle");
    setIsDetailsOpen(true);
  };

  const handleSelectStore = (id: string) => {
    setSelectedStoreId(id);
    setFocusedTarget("store");
    setIsDetailsOpen(true);
    const st = stores.find((s) => s.id === id);
    if (st?.assignedVehicle) {
      const v = vehicles.find((veh) => veh.code === st.assignedVehicle);
      if (v) setSelectedVehicleId(v.id);
    }
  };

  const activeEnRouteCount = vehicles.filter((v) => v.status === "en_route").length;
  const atStopCount = vehicles.filter((v) => v.status === "at_stop").length;
  const delayedCount = vehicles.filter((v) => v.status === "delayed").length;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* 100% Full-Bleed Map Canvas */}
      <div className="absolute inset-0 z-0">
        <LeafletMapCanvas
          vehicles={vehicles}
          stores={stores}
          selectedVehicle={selectedVehicle}
          selectedStore={selectedStore}
          focusedTarget={focusedTarget}
          onSelectVehicle={handleSelectVehicle}
          onSelectStore={handleSelectStore}
          showStores={showStores}
          themeId={selectedThemeId}
        />
      </div>

      {/* Floating Top Control Bar (Map-First) */}
      <div className="absolute top-3 inset-x-4 z-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pointer-events-none">
        {/* Left: Hub Title & Quick Vehicle Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-card/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-border shadow-md">
          <div className="flex items-center gap-2 pr-2 border-r border-border">
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-heading font-bold text-xs text-foreground">
              Live Fleet Tracking
            </span>
            <Badge variant="outline" className="text-[10px] font-semibold">
              {activeEnRouteCount} Moving • {atStopCount} At Stop
              {delayedCount > 0 && ` • ${delayedCount} Delayed`}
            </Badge>
          </div>

          {/* Quick Vehicle Pills */}
          <div className="flex items-center gap-1.5">
            {vehicles.map((v) => {
              const isSelected =
                selectedVehicleId === v.id && focusedTarget === "vehicle";
              const isDelayed = v.status === "delayed";
              const isAtStop = v.status === "at_stop";

              return (
                <button
                  key={v.id}
                  onClick={() => handleSelectVehicle(v.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border",
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs scale-105"
                      : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                  )}
                >
                  <TruckIcon className="size-3.5" />
                  <span>{v.code}</span>
                  {v.speedKmH > 0 && (
                    <span className="text-[10px] opacity-75 font-mono">
                      {v.speedKmH}km/h
                    </span>
                  )}
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isDelayed
                        ? "bg-amber-500"
                        : isAtStop
                          ? "bg-emerald-500"
                          : "bg-primary"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Map Controls */}
        <div className="flex items-center gap-2 pointer-events-auto bg-card/95 backdrop-blur-md p-1.5 rounded-2xl border border-border shadow-md">
          {/* Search bar */}
          <div className="relative w-44">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Locate vehicle / store..."
              value={searchQuery}
              onChange={(e) => {
                const query = e.target.value.toLowerCase();
                setSearchQuery(e.target.value);
                if (query) {
                  const matchedVeh = vehicles.find(
                    (v) =>
                      v.code.toLowerCase().includes(query) ||
                      v.driverName.toLowerCase().includes(query)
                  );
                  if (matchedVeh) {
                    handleSelectVehicle(matchedVeh.id);
                    return;
                  }
                  const matchedStore = stores.find(
                    (s) =>
                      s.name.toLowerCase().includes(query) ||
                      s.code.toLowerCase().includes(query)
                  );
                  if (matchedStore) {
                    handleSelectStore(matchedStore.id);
                  }
                }
              }}
              className="pl-7.5 h-8 text-xs rounded-xl"
            />
          </div>

          {/* Toggle Store Markers */}
          <Button
            variant={showStores ? "default" : "outline"}
            size="sm"
            onClick={() => setShowStores(!showStores)}
            className="h-8 text-xs gap-1.5 cursor-pointer rounded-xl"
          >
            <StorefrontIcon weight="bold" className="size-3.5" />
            Stores ({stores.length})
          </Button>

          {/* Map Theme Dropdown */}
          <select
            value={selectedThemeId}
            onChange={(e) => setSelectedThemeId(e.target.value)}
            className="h-8 px-2 text-xs font-medium bg-background text-foreground border border-input rounded-xl cursor-pointer focus:outline-hidden"
          >
            {MAP_THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>

          {/* Recenter Hub */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFocusedTarget("vehicle");
              setSelectedVehicleId(vehicles[0].id);
            }}
            className="h-8 px-2 text-xs cursor-pointer rounded-xl"
            title="Recenter Map"
          >
            <CrosshairIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Floating Telemetry Card (Bottom-Right / Side) */}
      {isDetailsOpen && (
        <div className="absolute bottom-6 left-4 z-400 w-80 max-w-[calc(100vw-2rem)]">
          {focusedTarget === "vehicle" && selectedVehicle ? (
            <Card className="p-3.5 bg-card/95 backdrop-blur-md rounded-2xl border border-border shadow-xl space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-border/70 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <TruckIcon weight="bold" className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-bold text-sm text-foreground">
                        {selectedVehicle.code}
                      </span>
                      <Badge
                        variant={
                          selectedVehicle.status === "delayed"
                            ? "destructive"
                            : selectedVehicle.status === "at_stop"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-[10px] font-semibold"
                      >
                        {selectedVehicle.status === "delayed"
                          ? `+${selectedVehicle.delayMinutes}m Delayed`
                          : selectedVehicle.status === "at_stop"
                            ? "At Stop"
                            : "En Route"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedVehicle.vehicleType}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                >
                  <XIcon className="size-4" />
                </button>
              </div>

              {/* Live Telemetry Grid */}
              <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl bg-muted/40 border border-border/50">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Speed</span>
                  <span className="font-bold text-xs text-foreground font-mono">
                    {selectedVehicle.speedKmH} km/h
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Fuel</span>
                  <span className="font-bold text-xs text-foreground flex items-center justify-center gap-0.5">
                    <GasPumpIcon className="size-3 text-muted-foreground" />
                    {selectedVehicle.fuelPercentage}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Load</span>
                  <span className="font-bold text-xs text-foreground flex items-center justify-center gap-0.5">
                    <PackageIcon className="size-3 text-muted-foreground" />
                    {selectedVehicle.loadPercentage}%
                  </span>
                </div>
              </div>

              {/* Driver & Contact */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <span className="text-[10px] text-muted-foreground block">
                    Assigned Driver
                  </span>
                  <p className="font-semibold text-foreground">
                    {selectedVehicle.driverName}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 cursor-pointer rounded-lg"
                >
                  <PhoneIcon className="size-3" />
                  Call Driver
                </Button>
              </div>
            </Card>
          ) : (
            selectedStore && (
              <Card className="p-3.5 bg-card/95 backdrop-blur-md rounded-2xl border border-border shadow-xl space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-border/70 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <StorefrontIcon weight="bold" className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading font-bold text-sm text-foreground">
                          {selectedStore.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {selectedStore.code}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedStore.address}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsDetailsOpen(false)}
                    className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>

                {/* Store Status Details */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Status
                    </span>
                    <span className="font-bold text-foreground capitalize">
                      {selectedStore.todayStatus.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Scheduled Crates
                    </span>
                    <span className="font-bold text-foreground">
                      {selectedStore.cratesScheduled} Crates
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Assigned Vehicle
                    </span>
                    <span className="font-semibold text-primary">
                      {selectedStore.assignedVehicle || "Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Window
                    </span>
                    <span className="font-medium text-foreground">
                      {selectedStore.deliveryWindow}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Store Manager
                    </span>
                    <p className="font-medium text-foreground">
                      {selectedStore.contactPerson}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 cursor-pointer rounded-lg"
                  >
                    <PhoneIcon className="size-3" />
                    Call Store
                  </Button>
                </div>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default LiveMapPage;
