import * as React from "react";
import L from "leaflet";
import { buildTileUrl } from "@/lib/map-themes";
import { cn } from "@/lib/utils";
import type { DriverWaypoint } from "../types";
import { createDriverWaypointPin } from "./active-trip-pin";

interface ActiveTripMapProps {
  waypoints: DriverWaypoint[];
  currentWp: DriverWaypoint;
  currentIndex: number;
  isOnline: boolean;
  onSelectWaypoint: (index: number, wp: DriverWaypoint) => void;
  mapInstanceRef: React.MutableRefObject<L.Map | null>;
}

export function ActiveTripMap({
  waypoints,
  currentWp,
  isOnline,
  onSelectWaypoint,
  mapInstanceRef,
}: ActiveTripMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const markersGroupRef = React.useRef<L.LayerGroup | null>(null);

  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentWp.lat, currentWp.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      const apiKey =
        (import.meta as unknown as { env: Record<string, string> }).env
          ?.VITE_MAP_API_KEY || "";

      L.tileLayer(
        buildTileUrl(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          apiKey
        ),
        {
          maxZoom: 19,
          subdomains: ["a", "b", "c", "d"],
        }
      ).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    waypoints.forEach((wp, idx) => {
      const marker = L.marker([wp.lat, wp.lng], {
        icon: createDriverWaypointPin(wp.seq, wp.status),
      });

      marker.on("click", () => {
        onSelectWaypoint(idx, wp);
      });

      marker.addTo(markersGroup);
    });

    if (currentWp) {
      map.flyTo([currentWp.lat, currentWp.lng], 15, {
        duration: 0.8,
      });
    }
  }, [waypoints, currentWp, onSelectWaypoint, mapInstanceRef]);

  return (
    <div
      className={cn(
        "absolute inset-0 z-0 transition-opacity duration-300",
        !isOnline ? "opacity-85 saturate-75" : "opacity-100"
      )}
    >
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
