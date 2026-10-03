import type { MapThemePreset } from "@/types";

export const CENTRAL_HUB = {
  name: "Peliyagoda Central Distribution Depot",
  code: "PEL",
  location: [6.9654, 79.9042] as [number, number],
};

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
