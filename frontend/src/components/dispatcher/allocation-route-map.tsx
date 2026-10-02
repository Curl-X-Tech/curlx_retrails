import * as React from "react";
import L from "leaflet";
import { PlusIcon, MinusIcon, CrosshairIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import type {
  AllocationWaypoint,
  AllocationVehiclePosition,
} from "@/data/mock-allocation-details";
import { getVehicleConfig, buildTileUrl } from "@/data/mock-live-map";

interface AllocationRouteMapProps {
  waypoints: AllocationWaypoint[];
  vehiclePosition?: AllocationVehiclePosition;
  vehicleUnitId?: string;
  vehicleModel?: string;
  driverName?: string;
  className?: string;
}

type WaypointCategory = "completed" | "upcoming" | "newly_added";

function getWaypointCategory(status: AllocationWaypoint["status"]): WaypointCategory {
  if (status === "completed") return "completed";
  if (status === "newly_added") return "newly_added";
  return "upcoming";
}

function createWaypointPin(
  seq: number,
  category: WaypointCategory,
  isHub: boolean = false
) {
  let bg = "#0070BA"; // Upcoming (ReTrails Blue)
  let extraGlow = "";

  if (isHub) {
    bg = "#0069A8"; // Central Hub
    extraGlow = "box-shadow: 0 2px 8px rgba(0,0,0,0.3);";
  } else if (category === "completed") {
    bg = "#059669"; // Completed (Emerald Green)
    extraGlow = "box-shadow: 0 2px 7px rgba(0,0,0,0.25);";
  } else if (category === "newly_added") {
    bg = "#7C3AED"; // Newly added post-dispatch (Purple)
    extraGlow =
      "box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.4), 0 3px 8px rgba(0,0,0,0.3);";
  } else {
    extraGlow = "box-shadow: 0 2px 7px rgba(0,0,0,0.25);";
  }

  return L.divIcon({
    className: `custom-waypoint-${category}`,
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
        <div style="display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 8px; background: ${bg}; color: #ffffff; font-family: sans-serif; font-size: 12px; font-weight: 800; border: 2px solid #ffffff; line-height: 1; ${extraGlow}">
          ${isHub ? "H" : seq}
        </div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function createTopViewMarker(
  unitId: string,
  vehicleModel: string = "truck",
  heading: number = 0
) {
  const cfg = getVehicleConfig(vehicleModel);

  return L.divIcon({
    className: "custom-topview-vehicle-icon",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
        <div style="background: rgba(255, 255, 255, 0.96); color: #0f172a; border: 1px solid #cbd5e1; border-radius: 4px; padding: 1px 5px; font-size: 10px; font-weight: 700; font-family: sans-serif; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.18); margin-bottom: 2px;">
          ${unitId}
        </div>
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <img 
            src="${cfg.iconUrl}" 
            alt="${unitId}" 
            style="width: ${cfg.imgWidth}px; height: ${cfg.imgHeight}px; object-fit: contain; transform: rotate(${heading}deg); transform-origin: center center; filter: drop-shadow(0px 8px 8px rgba(0, 0, 0, 0.42)); display: block;" 
          />
        </div>
      </div>
    `,
    iconSize: [cfg.iconWidth, cfg.iconHeight],
    iconAnchor: [cfg.anchorX, cfg.anchorY],
  });
}

export function AllocationRouteMap({
  waypoints,
  vehiclePosition,
  vehicleUnitId = "Unit",
  vehicleModel = "truck",
  driverName,
  className,
}: AllocationRouteMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<L.Map | null>(null);
  const markersRef = React.useRef<L.Marker[]>([]);
  const vehicleMarkerRef = React.useRef<L.Marker | null>(null);

  const apiKey =
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_MAP_API_KEY ||
    "";
  const customTileUrl =
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_MAP_TILE_URL ||
    "https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png";
  const resolvedTileUrl = buildTileUrl(customTileUrl, apiKey);

  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
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

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }

    if (!waypoints || waypoints.length === 0) return;

    const allCoords: [number, number][] = [];

    waypoints.forEach((wp) => {
      const pos: [number, number] = [wp.lat, wp.lng];
      allCoords.push(pos);

      const isHub = wp.name.toLowerCase().includes("hub") || wp.seq === 1;
      const category = getWaypointCategory(wp.status);

      const marker = L.marker(pos, {
        icon: createWaypointPin(wp.seq, category, isHub),
      }).addTo(map);

      const statusBadge =
        category === "completed"
          ? `<span style="background: #059669; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">Completed</span>`
          : category === "newly_added"
            ? `<span style="background: #7C3AED; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">New Post-Dispatch</span>`
            : `<span style="background: #0070BA; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">Upcoming</span>`;

      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; min-width: 160px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px;">
            <p style="font-weight: 800; margin: 0; font-size: 12px; color: #0f172a;">#${wp.seq} ${wp.name}</p>
          </div>
          <div style="margin-bottom: 6px;">
            ${statusBadge}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            <span>ETA: <b style="color: #0f172a;">${wp.eta}</b></span>
            <span>Crates: <b style="color: #0f172a;">${wp.crates}</b></span>
          </div>
        </div>
      `);

      markersRef.current.push(marker);
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
      }).addTo(map);

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

      vehicleMarkerRef.current = vMarker;
    }

    if (allCoords.length > 1) {
      map.fitBounds(L.latLngBounds(allCoords), {
        padding: [30, 30],
        maxZoom: 14,
      });
    } else if (allCoords.length === 1) {
      map.setView(allCoords[0], 13);
    }
  }, [waypoints, vehiclePosition, vehicleUnitId, vehicleModel, driverName]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const allCoords: [number, number][] = waypoints.map(
      (w) => [w.lat, w.lng] as [number, number]
    );
    if (vehiclePosition) {
      allCoords.push([vehiclePosition.lat, vehiclePosition.lng]);
    }
    if (allCoords.length > 1) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(allCoords), {
        padding: [30, 30],
      });
    } else if (allCoords.length === 1) {
      mapInstanceRef.current.setView(allCoords[0], 13);
    }
  };

  return (
    <Card
      className={`relative isolate overflow-hidden rounded-2xl border border-border/80 shadow-xs h-[230px] sm:h-[260px] min-w-0 ${className || ""}`}
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 bg-background/92 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-border/70 shadow-xs text-[11px] font-medium text-foreground select-none">
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[#059669]" />
          <span>Completed</span>
        </div>
        <span className="text-muted-foreground/40">•</span>
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[#0070BA]" />
          <span>Upcoming</span>
        </div>
        <span className="text-muted-foreground/40">•</span>
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[#7C3AED]" />
          <span>New Added</span>
        </div>
      </div>

      <div className="absolute right-3 bottom-3 z-10 flex flex-col gap-1 bg-card/90 backdrop-blur-md p-1 rounded-xl border border-border/80 shadow-md">
        <IconButton
          variant="ghost"
          size="xs"
          onClick={handleZoomIn}
          className="size-7 rounded-lg text-foreground hover:bg-muted cursor-pointer"
          title="Zoom in"
        >
          <PlusIcon className="size-3.5" weight="bold" />
        </IconButton>
        <IconButton
          variant="ghost"
          size="xs"
          onClick={handleZoomOut}
          className="size-7 rounded-lg text-foreground hover:bg-muted cursor-pointer"
          title="Zoom out"
        >
          <MinusIcon className="size-3.5" weight="bold" />
        </IconButton>
        <IconButton
          variant="ghost"
          size="xs"
          onClick={handleRecenter}
          className="size-7 rounded-lg text-foreground hover:bg-muted cursor-pointer"
          title="Center map"
        >
          <CrosshairIcon className="size-3.5" weight="bold" />
        </IconButton>
      </div>
    </Card>
  );
}
