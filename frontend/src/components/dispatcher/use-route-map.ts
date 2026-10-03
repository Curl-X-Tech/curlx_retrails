import * as React from "react";
import L from "leaflet";
import type {
  AllocationWaypoint,
  AllocationVehiclePosition,
} from "@/data/mock-allocation-details";
import { buildTileUrl } from "@/lib/map-themes";
import {
  getWaypointCategory,
  createWaypointPin,
  createTopViewMarker,
} from "./allocation-route-markers";

export function useRouteMap(
  mapContainerRef: React.RefObject<HTMLDivElement | null>,
  waypoints: AllocationWaypoint[],
  vehiclePosition?: AllocationVehiclePosition,
  vehicleUnitId = "Unit",
  vehicleModel = "truck",
  driverName?: string
) {
  const [mapInstance, setMapInstance] = React.useState<L.Map | null>(null);
  const layerGroupRef = React.useRef<L.LayerGroup | null>(null);

  const apiKey =
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_MAP_API_KEY ||
    "";
  const customTileUrl =
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_MAP_TILE_URL ||
    "https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png";
  const resolvedTileUrl = buildTileUrl(customTileUrl, apiKey);

  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [6.9366, 79.8612],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(resolvedTileUrl, {
      maxZoom: 20,
      subdomains: "abcd",
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    setMapInstance(map);

    const timer = setTimeout(() => map.invalidateSize(), 150);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      setMapInstance(null);
      layerGroupRef.current = null;
    };
  }, [mapContainerRef, resolvedTileUrl]);

  React.useEffect(() => {
    if (!mapInstance || !layerGroupRef.current) return;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    if (!waypoints || waypoints.length === 0) return;

    const allCoords: [number, number][] = [];

    waypoints.forEach((wp) => {
      const pos: [number, number] = [wp.lat, wp.lng];
      allCoords.push(pos);
      const isHub = wp.name.toLowerCase().includes("hub") || wp.seq === 1;
      const category = getWaypointCategory(wp.status);

      const marker = L.marker(pos, {
        icon: createWaypointPin(wp.seq, category, isHub),
      });

      const statusBadge =
        category === "completed"
          ? `<span style="background: #059669; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">Completed</span>`
          : category === "newly_added"
            ? `<span style="background: #7C3AED; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">New Post-Dispatch</span>`
            : `<span style="background: #0070BA; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">Upcoming</span>`;

      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; min-width: 160px;">
          <p style="font-weight: 800; margin: 0 0 5px 0; font-size: 12px; color: #0f172a;">#${wp.seq} ${wp.name}</p>
          <div style="margin-bottom: 6px;">${statusBadge}</div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            <span>ETA: <b style="color: #0f172a;">${wp.eta}</b></span>
            <span>Crates: <b style="color: #0f172a;">${wp.crates}</b></span>
          </div>
        </div>
      `);
      marker.addTo(layerGroup);
    });

    if (vehiclePosition) {
      const vPos: [number, number] = [vehiclePosition.lat, vehiclePosition.lng];
      allCoords.push(vPos);

      const vMarker = L.marker(vPos, {
        icon: createTopViewMarker(
          vehicleUnitId,
          vehicleModel,
          vehiclePosition.heading || 0
        ),
        zIndexOffset: 1000,
      });

      vMarker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; min-width: 150px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 800; font-size: 12px; color: #0f172a;">${vehicleUnitId}</span>
            <span style="background: #0f172a; color: #fff; padding: 1px 5px; border-radius: 3px; font-size: 9px; font-weight: 700;">Live</span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 3px;">
            Driver: <b style="color: #0f172a;">${driverName || "Assigned Driver"}</b>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            <span>Speed: <b style="color: #059669;">${vehiclePosition.speedKmH || 35} km/h</b></span>
            <span>${vehiclePosition.lastUpdated || "Live"}</span>
          </div>
        </div>
      `);
      vMarker.addTo(layerGroup);
    }

    if (allCoords.length > 1) {
      mapInstance.fitBounds(L.latLngBounds(allCoords), {
        padding: [30, 30],
        maxZoom: 14,
      });
    } else if (allCoords.length === 1) {
      mapInstance.setView(allCoords[0], 13);
    }

    mapInstance.invalidateSize();
  }, [mapInstance, waypoints, vehiclePosition, vehicleUnitId, vehicleModel, driverName]);

  const handleZoomIn = () => mapInstance?.zoomIn();
  const handleZoomOut = () => mapInstance?.zoomOut();
  const handleRecenter = () => {
    if (!mapInstance) return;
    const allCoords: [number, number][] = waypoints.map(
      (w) => [w.lat, w.lng] as [number, number]
    );
    if (vehiclePosition) allCoords.push([vehiclePosition.lat, vehiclePosition.lng]);
    if (allCoords.length > 1) {
      mapInstance.fitBounds(L.latLngBounds(allCoords), { padding: [30, 30] });
    } else if (allCoords.length === 1) {
      mapInstance.setView(allCoords[0], 13);
    }
  };

  return { handleZoomIn, handleZoomOut, handleRecenter };
}
