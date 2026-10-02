import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import L from "leaflet";
import {
  PlusIcon,
  MinusIcon,
  CrosshairIcon,
  CheckCircleIcon,
  NavigationArrowIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SwipeToConfirm } from "@/components/ui/swipe-to-confirm";
import { mockDriverTrip, type DriverWaypoint } from "@/data/mock-driver-trips";
import { buildTileUrl } from "@/data/mock-live-map";
import { cn } from "@/lib/utils";

function createDriverWaypointPin(seq: number, status: DriverWaypoint["status"]) {
  let bg = "#0070BA"; // Active Blue
  let extraGlow = "box-shadow: 0 2px 7px rgba(0,0,0,0.25);";

  if (status === "completed") {
    bg = "#059669"; // Emerald Green
  } else if (status === "active") {
    bg = "#0070BA"; // Bright Primary
    extraGlow =
      "box-shadow: 0 0 0 3px rgba(0, 112, 186, 0.4), 0 3px 8px rgba(0,0,0,0.3);";
  } else {
    bg = "#0369A1"; // Sky/Navy Upcoming
  }

  return L.divIcon({
    className: `driver-waypoint-pin-${status}`,
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; background: ${bg}; color: #ffffff; font-family: sans-serif; font-size: 13px; font-weight: 900; border: 2px solid #ffffff; line-height: 1; ${extraGlow} cursor: pointer;">
        ${seq}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function DriverActiveTripPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<L.Map | null>(null);
  const markersGroupRef = React.useRef<L.LayerGroup | null>(null);

  const [trip] = React.useState(mockDriverTrip);
  const waypoints = trip.waypoints;

  // Active waypoint index controlled via carousel or search query
  const queryWpSeq = Number(searchParams.get("wp"));
  const initialIndex =
    queryWpSeq && waypoints.some((w) => w.seq === queryWpSeq)
      ? waypoints.findIndex((w) => w.seq === queryWpSeq)
      : waypoints.findIndex((w) => w.status === "active") || 0;

  const [currentIndex, setCurrentIndex] = React.useState(
    initialIndex >= 0 ? initialIndex : 0
  );
  const currentWp = waypoints[currentIndex] || waypoints[0];

  // Initialize Leaflet Map
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

  // Update Waypoint Markers
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Add Waypoint Pin Markers
    waypoints.forEach((wp, idx) => {
      const marker = L.marker([wp.lat, wp.lng], {
        icon: createDriverWaypointPin(wp.seq, wp.status),
      });

      marker.on("click", () => {
        setCurrentIndex(idx);
        setSearchParams({ wp: String(wp.seq) }, { replace: true });
      });

      marker.addTo(markersGroup);
    });

    // Pan smoothly to current selected waypoint
    if (currentWp) {
      map.flyTo([currentWp.lat, currentWp.lng], 15, {
        duration: 0.8,
      });
    }
  }, [waypoints, currentIndex, currentWp]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setSearchParams({ wp: String(waypoints[prevIdx].seq) }, { replace: true });
    }
  };

  const handleNext = () => {
    if (currentIndex < waypoints.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSearchParams({ wp: String(waypoints[nextIdx].seq) }, { replace: true });
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && currentWp) {
      mapInstanceRef.current.flyTo([currentWp.lat, currentWp.lng], 15);
    }
  };

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${currentWp.lat},${currentWp.lng}`;
    window.open(url, "_blank");
  };

  const handleNavigateToUnload = () => {
    navigate(`/driver/unload?wp=${currentWp.seq}`);
  };

  return (
    <div className="relative w-full h-full flex flex-col min-h-0 overflow-hidden select-none bg-background">
      {/* 1. Full Viewport Interactive Leaflet Map Background */}
      <div className="absolute inset-0 z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* 2. Top-Right Map Controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5 shadow-md">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="size-9 bg-background/95 backdrop-blur-md rounded-xl border border-border/80 flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer shadow-xs"
          aria-label="Zoom In"
        >
          <PlusIcon className="size-4" weight="bold" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="size-9 bg-background/95 backdrop-blur-md rounded-xl border border-border/80 flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer shadow-xs"
          aria-label="Zoom Out"
        >
          <MinusIcon className="size-4" weight="bold" />
        </button>
        <button
          onClick={handleRecenter}
          className="size-9 bg-background/95 backdrop-blur-md rounded-xl border border-border/80 flex items-center justify-center text-primary hover:bg-muted active:scale-95 transition-all cursor-pointer shadow-xs mt-1"
          aria-label="Re-center GPS"
        >
          <CrosshairIcon className="size-4.5" weight="bold" />
        </button>
      </div>

      {/* 3. Floating Active Waypoint Card & Bottom Action Controller */}
      <div className="mt-auto z-10 p-3 flex flex-col gap-2.5 max-w-full">
        {/* Main Waypoint Info Card */}
        <Card className="rounded-3xl p-4 bg-background/95 backdrop-blur-xl border border-border/90 shadow-2xl space-y-3.5">
          {/* Header: Sequence Badge & Store Title */}
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "size-8 rounded-xl flex items-center justify-center font-heading font-black text-sm text-white shrink-0 shadow-xs",
                currentWp.status === "completed"
                  ? "bg-emerald-600"
                  : currentWp.status === "active"
                    ? "bg-primary"
                    : "bg-sky-700"
              )}
            >
              {currentWp.seq}
            </span>
            <div className="flex flex-col min-w-0">
              <h3 className="font-heading font-black text-base text-foreground truncate leading-tight">
                {currentWp.outletName}
              </h3>
              <span className="text-[11px] font-semibold text-muted-foreground truncate">
                Window: {currentWp.deliveryWindow}
              </span>
            </div>
          </div>

          {/* Quick Dual Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Arrived / Unload Action Button */}
            <Button
              onClick={handleNavigateToUnload}
              className={cn(
                "h-10 rounded-2xl font-bold text-xs gap-2 shadow-xs transition-all cursor-pointer",
                currentWp.status === "completed"
                  ? "bg-muted text-muted-foreground hover:bg-muted"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              )}
            >
              <CheckCircleIcon className="size-4" weight="fill" />
              <span>
                {currentWp.status === "completed" ? "View Checklist" : "Arrived"}
              </span>
            </Button>

            {/* Get Direction Action Button */}
            <Button
              onClick={handleGetDirections}
              className="h-10 rounded-2xl font-bold text-xs gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all cursor-pointer"
            >
              <NavigationArrowIcon className="size-4" weight="fill" />
              <span>Get Direction</span>
            </Button>
          </div>

          {/* Address Line */}
          <div className="pt-1">
            <p className="font-heading font-black text-sm text-foreground leading-snug">
              {currentWp.address}
            </p>
          </div>

          {/* Structured Key Metrics List */}
          <div className="border-t border-border/70 divide-y divide-border/60 text-xs">
            <div className="py-2 flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Total Weight</span>
              <strong className="font-heading font-bold text-foreground">
                {currentWp.totalWeightKg} kg
              </strong>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Pallets / Crates</span>
              <strong className="font-heading font-bold text-primary">
                {currentWp.totalCrateCount} Crates
              </strong>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Staging Location</span>
              <span className="font-semibold text-muted-foreground">
                {currentWp.stagingLocation} ({currentWp.dockType.replace("_", " ")})
              </span>
            </div>
          </div>

          {/* Carousel Pagination Controls */}
          <div className="flex items-center justify-between pt-1 border-t border-border/70">
            {/* Left Carousel Arrow */}
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={cn(
                "size-8 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              )}
              aria-label="Previous Waypoint"
            >
              <CaretLeftIcon className="size-5" weight="bold" />
            </button>

            {/* Carousel Dot Indicators */}
            <div className="flex items-center gap-1.5">
              {waypoints.map((wp, idx) => (
                <button
                  key={wp.seq}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setSearchParams({ wp: String(wp.seq) }, { replace: true });
                  }}
                  className={cn(
                    "transition-all rounded-full cursor-pointer",
                    idx === currentIndex
                      ? "w-6 h-2 bg-primary"
                      : wp.status === "completed"
                        ? "size-2 bg-emerald-600"
                        : "size-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to Waypoint ${wp.seq}`}
                />
              ))}
            </div>

            {/* Right Carousel Arrow */}
            <button
              onClick={handleNext}
              disabled={currentIndex === waypoints.length - 1}
              className={cn(
                "size-8 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              )}
              aria-label="Next Waypoint"
            >
              <CaretRightIcon className="size-5" weight="bold" />
            </button>
          </div>
        </Card>

        {/* 4. Bottom Swipe Bar to Arrive / Open Checklist */}
        <div className="p-1 rounded-3xl bg-background/95 backdrop-blur-xl border border-border/80 shadow-lg">
          {currentWp.status === "completed" ? (
            <div className="h-12 flex items-center justify-between px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <span className="text-xs font-bold text-emerald-600">
                Stop #{currentWp.seq} Completed
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNavigateToUnload}
                className="h-8 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20 cursor-pointer"
              >
                View Checklist
              </Button>
            </div>
          ) : (
            <SwipeToConfirm
              label="Swipe to confirm arrival & unload"
              confirmedLabel="Arrived! Opening checklist..."
              onConfirm={handleNavigateToUnload}
              className="h-12 bg-emerald-500/10 border-emerald-500/20 font-bold text-emerald-700 dark:text-emerald-400"
            />
          )}
        </div>
      </div>
    </div>
  );
}
