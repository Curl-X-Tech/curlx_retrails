import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import type L from "leaflet";
import { Button } from "@/components/ui/button";
import { SwipeToConfirm } from "@/components/ui/swipe-to-confirm";
import {
  useOfflineActiveTrip,
  useSyncState,
  ActiveTripMap,
  ActiveTripOfflineBanner,
  ActiveTripControls,
  ActiveTripWaypointCard,
  type DriverWaypoint,
} from "@/features/driver";

export function DriverActiveTripPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const mapInstanceRef = React.useRef<L.Map | null>(null);

  const { waypoints, arriveAtStop } = useOfflineActiveTrip();
  const { isOnline } = useSyncState();

  const queryWpSeq = Number(searchParams.get("wp"));
  const initialIndex =
    queryWpSeq && waypoints.some((w) => w.seq === queryWpSeq)
      ? waypoints.findIndex((w) => w.seq === queryWpSeq)
      : waypoints.findIndex((w) => w.status === "arrived" || w.status === "pending") || 0;

  const [currentIndex, setCurrentIndex] = React.useState(
    initialIndex >= 0 ? initialIndex : 0
  );
  const currentWp = waypoints[currentIndex] || waypoints[0];

  const handleSelectWaypoint = (idx: number, wp: DriverWaypoint) => {
    setCurrentIndex(idx);
    setSearchParams({ wp: String(wp.seq) }, { replace: true });
  };

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
    if (!currentWp) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${currentWp.lat},${currentWp.lng}`;
    window.open(url, "_blank");
  };

  const handleNavigateToUnload = () => {
    if (!currentWp) return;
    navigate(`/driver/unload?wp=${currentWp.seq}`);
  };

  if (!currentWp) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-muted-foreground text-sm font-semibold">
        Loading active trip route...
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col min-h-0 overflow-hidden select-none bg-background">
      <ActiveTripMap
        waypoints={waypoints}
        currentWp={currentWp}
        currentIndex={currentIndex}
        isOnline={isOnline}
        onSelectWaypoint={handleSelectWaypoint}
        mapInstanceRef={mapInstanceRef}
      />

      <ActiveTripOfflineBanner isOnline={isOnline} />

      <ActiveTripControls
        onZoomIn={() => mapInstanceRef.current?.zoomIn()}
        onZoomOut={() => mapInstanceRef.current?.zoomOut()}
        onRecenter={handleRecenter}
      />

      <div className="mt-auto z-10 p-3 flex flex-col gap-2.5 max-w-full">
        <ActiveTripWaypointCard
          waypoints={waypoints}
          currentWp={currentWp}
          currentIndex={currentIndex}
          onPrev={handlePrev}
          onNext={handleNext}
          onSelectIndex={(idx) => handleSelectWaypoint(idx, waypoints[idx])}
          onNavigateToUnload={handleNavigateToUnload}
          onGetDirections={handleGetDirections}
        />

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
              onConfirm={async () => {
                await arriveAtStop(currentWp.seq);
                handleNavigateToUnload();
              }}
              className="h-12 bg-emerald-500/10 border-emerald-500/20 font-bold text-emerald-700 dark:text-emerald-400"
            />
          )}
        </div>
      </div>
    </div>
  );
}
