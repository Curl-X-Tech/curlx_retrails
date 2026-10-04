import * as React from "react";
import { WarningIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { useLiveMapVehicles } from "@/api/telemetry";
import { LiveVehicleCard } from "@/components/dispatcher/live-vehicle-card";
import { LiveMapControls } from "@/features/dispatcher/components/live-map-controls";
import { useLiveMap } from "@/features/dispatcher/hooks/use-live-map";
import { useLiveMapStores } from "@/features/dispatcher/hooks/use-live-map-stores";
import type { VehicleTrackingData } from "@/types";

export function LiveMapPage() {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);

  const {
    data: vehicles = [],
    isLoading,
    error,
    isRefetchError,
    refetch,
  } = useLiveMapVehicles();
  const { stores } = useLiveMapStores();

  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string | null>(null);
  const [showVehicleCard, setShowVehicleCard] = React.useState<boolean>(true);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedThemeId, setSelectedThemeId] = React.useState<string>("carto-positron");

  const [selectedVehicleStatuses, setSelectedVehicleStatuses] = React.useState<string[]>([
    "en_route",
    "at_stop",
    "delayed",
  ]);
  const [showStores, setShowStores] = React.useState<boolean>(true);
  const [selectedBrands, setSelectedBrands] = React.useState<
    ("Fresh" | "Style" | "Tech")[]
  >(["Fresh", "Style", "Tech"]);

  const selectedVehicle = React.useMemo(() => {
    if (!vehicles.length) return null;
    if (selectedVehicleId) {
      return (
        vehicles.find(
          (v) => v.id === selectedVehicleId || v.vehicleId === selectedVehicleId
        ) ?? vehicles[0]
      );
    }
    return vehicles[0];
  }, [vehicles, selectedVehicleId]);

  const handleSelectVehicle = React.useCallback((vehicle: VehicleTrackingData) => {
    setSelectedVehicleId(vehicle.id);
    setShowVehicleCard(true);
  }, []);

  const { mapInstance, vehicleMarkersRef, storeMarkersRef } = useLiveMap({
    containerRef: mapContainerRef,
    selectedThemeId,
    vehicles,
    selectedVehicleStatuses,
    stores,
    showStores,
    selectedBrands,
    onSelectVehicle: handleSelectVehicle,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || !mapInstance) return;
    const query = searchQuery.toLowerCase();
    const matchedVehicle = vehicles.find(
      (v) =>
        v.code.toLowerCase().includes(query) || v.driverName.toLowerCase().includes(query)
    );
    if (matchedVehicle) {
      setSelectedVehicleId(matchedVehicle.id);
      setShowVehicleCard(true);
      mapInstance.flyTo(matchedVehicle.currentLocation, 15, { duration: 1.0 });
      vehicleMarkersRef.current[matchedVehicle.id]?.openPopup();
      return;
    }
    const matchedStore = stores.find(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query) ||
        s.address.toLowerCase().includes(query)
    );
    if (matchedStore) {
      mapInstance.flyTo([matchedStore.lat, matchedStore.lng], 15, { duration: 1.0 });
      storeMarkersRef.current[matchedStore.id]?.openPopup();
    }
  };

  const handleRecenter = () => {
    if (mapInstance) {
      mapInstance.flyTo([6.9271, 79.8612], 13, { duration: 1.0 });
    }
  };

  const toggleVehicleStatus = (status: string) => {
    if (selectedVehicleStatuses.includes(status)) {
      if (selectedVehicleStatuses.length > 1) {
        setSelectedVehicleStatuses(selectedVehicleStatuses.filter((s) => s !== status));
      }
    } else {
      setSelectedVehicleStatuses([...selectedVehicleStatuses, status]);
    }
  };

  const toggleBrand = (brand: "Fresh" | "Style" | "Tech") => {
    if (selectedBrands.includes(brand)) {
      if (selectedBrands.length > 1) {
        setSelectedBrands(selectedBrands.filter((b) => b !== brand));
      }
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  return (
    <div className="relative w-full h-[calc(100dvh-4rem)] overflow-hidden bg-background">
      <div ref={mapContainerRef} className="w-full h-full" />

      {isLoading && vehicles.length === 0 && (
        <div className="absolute inset-0 z-500 bg-background/60 backdrop-blur-xs flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-lg text-xs font-mono text-foreground">
            <CircleNotchIcon className="size-4 animate-spin text-primary" />
            <span>Connecting to live telematics feed...</span>
          </div>
        </div>
      )}

      {(isRefetchError || (error && vehicles.length > 0)) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-500">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-medium shadow-md backdrop-blur-md">
            <WarningIcon className="size-3.5" />
            <span>Telemetry update failed. Displaying cached positions.</span>
            <button
              onClick={() => refetch()}
              className="underline font-semibold ml-1 cursor-pointer hover:text-amber-900 dark:hover:text-amber-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <LiveMapControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        vehicles={vehicles}
        selectedVehicleStatuses={selectedVehicleStatuses}
        onToggleVehicleStatus={toggleVehicleStatus}
        stores={stores}
        showStores={showStores}
        onToggleShowStores={() => setShowStores(!showStores)}
        selectedBrands={selectedBrands}
        onToggleBrand={toggleBrand}
        selectedThemeId={selectedThemeId}
        onSelectThemeId={setSelectedThemeId}
        onRecenter={handleRecenter}
      />

      {showVehicleCard && selectedVehicle && (
        <div className="absolute bottom-4 left-4 z-400">
          <LiveVehicleCard
            vehicle={selectedVehicle}
            allVehicles={vehicles}
            onSelectVehicle={(v) => {
              setSelectedVehicleId(v.id);
              if (mapInstance) {
                mapInstance.flyTo(v.currentLocation, 14, { duration: 0.8 });
                vehicleMarkersRef.current[v.id]?.openPopup();
              }
            }}
            onFocusVehicle={(v) => {
              if (mapInstance) {
                mapInstance.flyTo(v.currentLocation, 15, { duration: 0.8 });
                vehicleMarkersRef.current[v.id]?.openPopup();
              }
            }}
            onClose={() => setShowVehicleCard(false)}
          />
        </div>
      )}
    </div>
  );
}

export default LiveMapPage;
