import * as React from "react";
import L from "leaflet";
import {
  MagnifyingGlassIcon,
  CrosshairIcon,
  PlantIcon,
  StorefrontIcon,
  TruckIcon,
  MapTrifoldIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  type StoreCategory,
  type StoreLocation,
  type VehicleTrackingData,
  CENTRAL_HUB,
  MOCK_STORES,
  MOCK_VEHICLES,
  MAP_THEMES,
  buildTileUrl,
} from "@/data/mock-live-map";
import {
  createHubIcon,
  createTopViewVehicleIcon,
  createStoreIcon,
} from "@/lib/map-icons";

export function LiveMapPage() {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = React.useState<L.Map | null>(null);
  const tileLayerRef = React.useRef<L.TileLayer | null>(null);
  const vehicleMarkersRef = React.useRef<{ [key: string]: L.Marker }>({});
  const storeMarkersRef = React.useRef<{ [key: string]: L.Marker }>({});

  const [vehicles] = React.useState<VehicleTrackingData[]>(MOCK_VEHICLES);
  const [stores] = React.useState<StoreLocation[]>(MOCK_STORES);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedThemeId, setSelectedThemeId] = React.useState<string>("carto-positron");

  // Checklist Filter States
  const [selectedVehicleStatuses, setSelectedVehicleStatuses] = React.useState<string[]>([
    "en_route",
    "at_stop",
    "delayed",
  ]);
  const [showStores, setShowStores] = React.useState<boolean>(true);
  const [selectedStoreCategories, setSelectedStoreCategories] = React.useState<StoreCategory[]>([
    "fresh",
    "supermarket",
    "pharmacy",
    "chilled",
  ]);

  const selectedTheme =
    MAP_THEMES.find((t) => t.id === selectedThemeId) || MAP_THEMES[0];
  const apiKey =
    (import.meta as unknown as { env: Record<string, string> }).env
      ?.VITE_MAP_API_KEY || "";

  const resolvedTileUrl = buildTileUrl(selectedTheme.url, apiKey);

  // Initialize Map
  React.useEffect(() => {
    if (!mapContainerRef.current || mapInstance) return;

    const map = L.map(mapContainerRef.current, {
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

    // Add Central Hub Marker
    L.marker(CENTRAL_HUB.location, { icon: createHubIcon() })
      .bindPopup(
        `<div style="font-family: sans-serif; padding: 4px;"><p style="font-weight: bold; margin: 0; font-size: 13px; color: #0f172a;">${CENTRAL_HUB.name}</p><p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${CENTRAL_HUB.code}</p></div>`
      )
      .addTo(map);

    setMapInstance(map);

    return () => {
      map.remove();
      setMapInstance(null);
    };
  }, []);

  // Update Tile Layer when theme changes
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

  // Update Vehicle Markers based on checklist
  React.useEffect(() => {
    if (!mapInstance) return;

    const filtered = vehicles.filter((v) =>
      selectedVehicleStatuses.includes(v.status)
    );

    // Remove obsolete markers
    Object.keys(vehicleMarkersRef.current).forEach((id) => {
      if (!filtered.some((v) => v.id === id)) {
        vehicleMarkersRef.current[id].remove();
        delete vehicleMarkersRef.current[id];
      }
    });

    // Add / update markers
    filtered.forEach((vehicle) => {
      const icon = createTopViewVehicleIcon(vehicle);

      if (vehicleMarkersRef.current[vehicle.id]) {
        vehicleMarkersRef.current[vehicle.id]
          .setLatLng(vehicle.currentLocation)
          .setIcon(icon);
      } else {
        const marker = L.marker(vehicle.currentLocation, { icon })
          .bindPopup(
            `<div style="font-family: sans-serif; padding: 4px; min-width: 160px;">
              <p style="font-weight: bold; margin: 0; font-size: 13px; color: #0f172a;">${vehicle.code}</p>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${vehicle.vehicleType}</p>
              <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.4;">
                <p style="margin: 0; color: #334155;"><strong>Driver:</strong> ${vehicle.driverName}</p>
                <p style="margin: 0; color: #334155;"><strong>Speed:</strong> ${vehicle.speedKmH} km/h</p>
                <p style="margin: 0; color: #334155;"><strong>Fuel:</strong> ${vehicle.fuelPercentage}%</p>
                <p style="margin: 0; color: #334155;"><strong>Load:</strong> ${vehicle.loadKg} / ${vehicle.totalCapacityKg} kg (${vehicle.loadPercentage}%)</p>
              </div>
            </div>`
          )
          .addTo(mapInstance);

        vehicleMarkersRef.current[vehicle.id] = marker;
      }
    });
  }, [mapInstance, vehicles, selectedVehicleStatuses]);

  // Update Store Markers based on checklist
  React.useEffect(() => {
    if (!mapInstance) return;

    if (!showStores) {
      Object.values(storeMarkersRef.current).forEach((m) => m.remove());
      storeMarkersRef.current = {};
      return;
    }

    const filteredStores = stores.filter((s) =>
      selectedStoreCategories.includes(s.category)
    );

    // Remove old markers
    Object.keys(storeMarkersRef.current).forEach((id) => {
      if (!filteredStores.some((s) => s.id === id)) {
        storeMarkersRef.current[id].remove();
        delete storeMarkersRef.current[id];
      }
    });

    filteredStores.forEach((store) => {
      const icon = createStoreIcon(store);

      const categoryName =
        store.category === "fresh"
          ? "Fresh Produce"
          : store.category === "pharmacy"
            ? "Pharmacy"
            : store.category === "chilled"
              ? "Chilled Dairy"
              : "Supermarket";

      if (storeMarkersRef.current[store.id]) {
        storeMarkersRef.current[store.id]
          .setLatLng([store.lat, store.lng])
          .setIcon(icon);
      } else {
        const marker = L.marker([store.lat, store.lng], { icon })
          .bindPopup(
            `<div style="font-family: sans-serif; padding: 4px; min-width: 170px;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                <span style="font-weight: bold; font-size: 13px; color: #0f172a;">${store.name}</span>
              </div>
              <p style="margin: 1px 0 0 0; font-size: 11px; color: #0284c7; font-weight: 600;">${categoryName} (${store.chain})</p>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${store.address}</p>
              <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.4;">
                <p style="margin: 0; color: #334155;"><strong>Contact:</strong> ${store.contactPerson} (${store.contactPhone})</p>
                <p style="margin: 0; color: #334155;"><strong>Scheduled:</strong> ${store.cratesScheduled} Crates</p>
                <p style="margin: 0; color: #334155;"><strong>Window:</strong> ${store.deliveryWindow}</p>
                <p style="margin: 0; color: #334155;"><strong>Status:</strong> <span style="text-transform: capitalize;">${store.todayStatus.replace("_", " ")}</span></p>
              </div>
            </div>`
          )
          .addTo(mapInstance);

        storeMarkersRef.current[store.id] = marker;
      }
    });
  }, [mapInstance, stores, showStores, selectedStoreCategories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || !mapInstance) return;

    const query = searchQuery.toLowerCase();
    const matchedVehicle = vehicles.find(
      (v) =>
        v.code.toLowerCase().includes(query) ||
        v.driverName.toLowerCase().includes(query)
    );

    if (matchedVehicle) {
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
      mapInstance.flyTo([matchedStore.lat, matchedStore.lng], 15, {
        duration: 1.0,
      });
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

  const toggleStoreCategory = (category: StoreCategory) => {
    if (selectedStoreCategories.includes(category)) {
      if (selectedStoreCategories.length > 1) {
        setSelectedStoreCategories(selectedStoreCategories.filter((c) => c !== category));
      }
    } else {
      setSelectedStoreCategories([...selectedStoreCategories, category]);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* 100% Full-Bleed Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Top Controls with Standard Shadcn Components */}
      <div className="absolute top-3 inset-x-4 z-400 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Search Bar + Filters Dropdown */}
        <div className="flex items-center gap-2 pointer-events-auto bg-card/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-border shadow-md">
          {/* Search Input */}
          <form onSubmit={handleSearch} className="relative w-56">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search vehicle or store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7.5 h-8 text-xs rounded-xl bg-background"
            />
          </form>

          <Separator orientation="vertical" className="h-4 mx-0.5" />

          {/* Isolated Fleet Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 cursor-pointer rounded-xl font-medium"
                />
              }
            >
              <TruckIcon weight="bold" className="size-3.5 text-primary" />
              <span>Fleet</span>
              <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px] font-bold">
                {selectedVehicleStatuses.length}
              </Badge>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56 p-2">
              <DropdownMenuLabel className="flex items-center gap-1.5 text-xs">
                <TruckIcon className="size-3.5" /> Vehicle Status
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={selectedVehicleStatuses.includes("en_route")}
                onCheckedChange={() => toggleVehicleStatus("en_route")}
              >
                <span className="size-2 rounded-full bg-primary" />
                <span>En Route ({vehicles.filter((v) => v.status === "en_route").length})</span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedVehicleStatuses.includes("at_stop")}
                onCheckedChange={() => toggleVehicleStatus("at_stop")}
              >
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>At Stop ({vehicles.filter((v) => v.status === "at_stop").length})</span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedVehicleStatuses.includes("delayed")}
                onCheckedChange={() => toggleVehicleStatus("delayed")}
              >
                <span className="size-2 rounded-full bg-amber-500" />
                <span>Delayed ({vehicles.filter((v) => v.status === "delayed").length})</span>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Isolated Stores Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 cursor-pointer rounded-xl font-medium"
                />
              }
            >
              <StorefrontIcon weight="bold" className="size-3.5 text-emerald-600" />
              <span>Stores</span>
              <Badge
                variant={showStores ? "secondary" : "outline"}
                className="px-1.5 py-0 h-4 text-[10px] font-bold"
              >
                {showStores ? selectedStoreCategories.length : "Off"}
              </Badge>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-60 p-2">
              <DropdownMenuLabel className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <StorefrontIcon className="size-3.5" /> Store Outlets
                </span>
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={showStores}
                onCheckedChange={() => setShowStores(!showStores)}
              >
                <span className="font-semibold">Display Stores on Map</span>
              </DropdownMenuCheckboxItem>

              {showStores && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground py-1">
                    Filter by Category
                  </DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={selectedStoreCategories.includes("fresh")}
                    onCheckedChange={() => toggleStoreCategory("fresh")}
                  >
                    <PlantIcon className="size-3.5 text-emerald-600" />
                    <span>Fresh Produce ({stores.filter((s) => s.category === "fresh").length})</span>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedStoreCategories.includes("supermarket")}
                    onCheckedChange={() => toggleStoreCategory("supermarket")}
                  >
                    <StorefrontIcon className="size-3.5 text-sky-600" />
                    <span>Supermarkets ({stores.filter((s) => s.category === "supermarket").length})</span>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedStoreCategories.includes("pharmacy")}
                    onCheckedChange={() => toggleStoreCategory("pharmacy")}
                  >
                    <span className="size-2 rounded-full bg-purple-500 inline-block" />
                    <span>Pharmacies ({stores.filter((s) => s.category === "pharmacy").length})</span>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedStoreCategories.includes("chilled")}
                    onCheckedChange={() => toggleStoreCategory("chilled")}
                  >
                    <span className="size-2 rounded-full bg-cyan-500 inline-block" />
                    <span>Chilled Dairy ({stores.filter((s) => s.category === "chilled").length})</span>
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: Map Theme Selector + Recenter Button */}
        <div className="flex items-center gap-2 pointer-events-auto bg-card/95 backdrop-blur-md p-1.5 rounded-2xl border border-border shadow-md">
          {/* Shadcn DropdownMenu for Map Themes */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 cursor-pointer rounded-xl font-medium"
                />
              }
            >
              <MapTrifoldIcon className="size-3.5" />
              <span>{selectedTheme.name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1.5">
              <DropdownMenuLabel className="text-xs">Map Layer Theme</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={selectedThemeId}
                onValueChange={(val) => setSelectedThemeId(val)}
              >
                {MAP_THEMES.map((t) => (
                  <DropdownMenuRadioItem key={t.id} value={t.id}>
                    {t.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <IconButton
            variant="outline"
            size="default"
            onClick={handleRecenter}
            className="size-8 cursor-pointer rounded-xl"
            title="Recenter Map"
          >
            <CrosshairIcon className="size-3.5" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

export default LiveMapPage;
