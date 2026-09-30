import * as React from "react";
import L from "leaflet";
import { PlusIcon, MinusIcon, CrosshairIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import type { AllocationWaypoint } from "@/data/mock-allocation-details";

interface AllocationRouteMapProps {
  waypoints: AllocationWaypoint[];
  className?: string;
}

function createWaypointIcon(seq: number, isCurrent: boolean = false) {
  return L.divIcon({
    className: "custom-allocation-waypoint",
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 8px; background: ${
        isCurrent ? "#00E600" : "#059669"
      }; color: #ffffff; font-family: sans-serif; font-size: 13px; font-weight: 800; box-shadow: 0 2px 8px rgba(0,0,0,0.35); border: 2px solid #ffffff; line-height: 1; user-select: none;">
        ${seq}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export function AllocationRouteMap({ waypoints, className }: AllocationRouteMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<L.Map | null>(null);
  const markersRef = React.useRef<L.Marker[]>([]);
  const polylineRef = React.useRef<L.Polyline | null>(null);

  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [6.9366, 79.8612],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          subdomains: "abcd",
        }
      ).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers & polyline
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (!waypoints || waypoints.length === 0) return;

    const latLngs: [number, number][] = [];

    waypoints.forEach((wp) => {
      const pos: [number, number] = [wp.lat, wp.lng];
      latLngs.push(pos);

      const marker = L.marker(pos, {
        icon: createWaypointIcon(wp.seq, wp.status === "current"),
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 2px; min-width: 140px;">
          <p style="font-weight: 800; margin: 0; font-size: 12px; color: #0f172a;">#${wp.seq} ${wp.name}</p>
          <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; color: #64748b;">
            <span>ETA: <b>${wp.eta}</b></span>
            <span>Crates: <b>${wp.crates}</b></span>
          </div>
        </div>
      `);

      markersRef.current.push(marker);
    });

    if (latLngs.length > 1) {
      polylineRef.current = L.polyline(latLngs, {
        color: "#0070BA",
        weight: 3.5,
        opacity: 0.85,
        dashArray: "6, 6",
      }).addTo(map);

      map.fitBounds(L.latLngBounds(latLngs), {
        padding: [30, 30],
        maxZoom: 14,
      });
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 13);
    }
  }, [waypoints]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    if (!mapInstanceRef.current || !waypoints.length) return;
    const latLngs = waypoints.map((w) => [w.lat, w.lng] as [number, number]);
    if (latLngs.length > 1) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(latLngs), {
        padding: [30, 30],
      });
    } else {
      mapInstanceRef.current.setView(latLngs[0], 13);
    }
  };

  return (
    <Card
      className={`relative overflow-hidden rounded-2xl border border-border/80 shadow-xs h-[230px] sm:h-[260px] min-w-0 ${className || ""}`}
    >
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls in bottom right */}
      <div className="absolute right-3 bottom-3 z-1000 flex flex-col gap-1 bg-card/90 backdrop-blur-md p-1 rounded-xl border border-border/80 shadow-md">
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
          title="Center route"
        >
          <CrosshairIcon className="size-3.5" weight="bold" />
        </IconButton>
      </div>
    </Card>
  );
}
