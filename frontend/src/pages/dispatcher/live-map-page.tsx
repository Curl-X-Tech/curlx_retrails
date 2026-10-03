import * as React from "react";
import {
  type StoreLocation,
  type VehicleTrackingData,
  MOCK_STORES,
  MOCK_VEHICLES,
} from "@/data/mock-live-map";
import { LiveVehicleCard } from "@/components/dispatcher/live-vehicle-card";
import { LiveMapControls } from "@/features/dispatcher/components/live-map-controls";
import { useLiveMap } from "@/features/dispatcher/hooks/use-live-map";

export function LiveMapPage() {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);

  const [vehicles] = React.useState<VehicleTrackingData[]>(MOCK_VEHICLES);
  const [stores] = React.useState<StoreLocation[]>(MOCK_STORES);
  const [selectedVehicle, setSelectedVehicle] =
    React.useState<VehicleTrackingData | null>(MOCK_VEHICLES[0]);
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

  const handleSelectVehicle = React.useCallback((vehicle: VehicleTrackingData) => {
    setSelectedVehicle(vehicle);
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
      setSelectedVehicle(matchedVehicle);
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
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-background">
      <div ref={mapContainerRef} className="w-full h-full" />

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
              setSelectedVehicle(v);
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
