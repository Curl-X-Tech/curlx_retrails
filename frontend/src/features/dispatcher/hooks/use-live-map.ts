import * as React from "react";
import L from "leaflet";
import {
  type StoreLocation,
  type VehicleTrackingData,
  CENTRAL_HUB,
  MAP_THEMES,
  buildTileUrl,
} from "@/data/mock-live-map";
import { createHubIcon } from "@/lib/map-icons";
import { useLiveMapMarkers } from "./use-live-map-markers";

interface UseLiveMapOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  selectedThemeId: string;
  vehicles: VehicleTrackingData[];
  selectedVehicleStatuses: string[];
  stores: StoreLocation[];
  showStores: boolean;
  selectedBrands: ("Fresh" | "Style" | "Tech")[];
  onSelectVehicle: (vehicle: VehicleTrackingData) => void;
}

export function useLiveMap({
  containerRef,
  selectedThemeId,
  vehicles,
  selectedVehicleStatuses,
  stores,
  showStores,
  selectedBrands,
  onSelectVehicle,
}: UseLiveMapOptions) {
  const [mapInstance, setMapInstance] = React.useState<L.Map | null>(null);
  const tileLayerRef = React.useRef<L.TileLayer | null>(null);

  const selectedTheme = MAP_THEMES.find((t) => t.id === selectedThemeId) || MAP_THEMES[0];
  const apiKey =
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_MAP_API_KEY ||
    "";
  const resolvedTileUrl = buildTileUrl(selectedTheme.url, apiKey);

  React.useEffect(() => {
    if (!containerRef.current || mapInstance) return;

    const map = L.map(containerRef.current, {
      center: [6.9271, 79.8612],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const tileLayer = L.tileLayer(resolvedTileUrl, {
      attribution: selectedTheme.attribution,
      maxZoom: selectedTheme.maxZoom,
      subdomains: "abcd",
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    L.marker(CENTRAL_HUB.location, { icon: createHubIcon() })
      .bindPopup(
        `<div style="font-family: sans-serif; padding: 4px;"><p style="font-weight: bold; margin: 0; font-size: 13px; color: #0f172a;">${CENTRAL_HUB.name}</p><p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Code: ${CENTRAL_HUB.code}</p></div>`
      )
      .addTo(map);

    setMapInstance(map);

    return () => {
      map.remove();
      setMapInstance(null);
    };
  }, []);

  React.useEffect(() => {
    if (!mapInstance) return;
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }
    const tileLayer = L.tileLayer(resolvedTileUrl, {
      attribution: selectedTheme.attribution,
      maxZoom: selectedTheme.maxZoom,
      subdomains: "abcd",
    }).addTo(mapInstance);
    tileLayerRef.current = tileLayer;
  }, [mapInstance, resolvedTileUrl, selectedTheme.attribution, selectedTheme.maxZoom]);

  const { vehicleMarkersRef, storeMarkersRef } = useLiveMapMarkers(
    mapInstance,
    vehicles,
    selectedVehicleStatuses,
    stores,
    showStores,
    selectedBrands,
    onSelectVehicle
  );

  return {
    mapInstance,
    vehicleMarkersRef,
    storeMarkersRef,
  };
}
