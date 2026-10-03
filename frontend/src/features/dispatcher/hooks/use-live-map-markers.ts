import * as React from "react";
import L from "leaflet";
import type { StoreLocation, VehicleTrackingData } from "@/data/mock-live-map";
import { createStoreIcon, createTopViewVehicleIcon } from "@/lib/map-icons";

export function useLiveMapMarkers(
  mapInstance: L.Map | null,
  vehicles: VehicleTrackingData[],
  selectedVehicleStatuses: string[],
  stores: StoreLocation[],
  showStores: boolean,
  selectedBrands: ("Fresh" | "Style" | "Tech")[],
  onSelectVehicle: (vehicle: VehicleTrackingData) => void
) {
  const vehicleMarkersRef = React.useRef<{ [key: string]: L.Marker }>({});
  const storeMarkersRef = React.useRef<{ [key: string]: L.Marker }>({});

  React.useEffect(() => {
    if (!mapInstance) return;

    const filtered = vehicles.filter((v) => selectedVehicleStatuses.includes(v.status));

    Object.keys(vehicleMarkersRef.current).forEach((id) => {
      if (!filtered.some((v) => v.id === id)) {
        vehicleMarkersRef.current[id].remove();
        delete vehicleMarkersRef.current[id];
      }
    });

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
              <p style="font-weight: bold; margin: 0; font-size: 13px; color: #0f172a;"># ${vehicle.code}</p>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${vehicle.vehicleType}</p>
              <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.4;">
                <p style="margin: 0; color: #334155;"><strong>Driver:</strong> ${vehicle.driverName}</p>
                <p style="margin: 0; color: #334155;"><strong>Weight:</strong> W ${vehicle.weightPercentage}% (${vehicle.weightKg} kg)</p>
                <p style="margin: 0; color: #334155;"><strong>Volume:</strong> V ${vehicle.volumePercentage}% (${vehicle.volumeCbm} m³)</p>
                <p style="margin: 0; color: #334155;"><strong>Next Stop:</strong> ${vehicle.nextStop}</p>
              </div>
            </div>`
          )
          .on("click", () => {
            onSelectVehicle(vehicle);
          })
          .addTo(mapInstance);

        vehicleMarkersRef.current[vehicle.id] = marker;
      }
    });
  }, [mapInstance, vehicles, selectedVehicleStatuses, onSelectVehicle]);

  React.useEffect(() => {
    if (!mapInstance) return;

    if (!showStores) {
      Object.values(storeMarkersRef.current).forEach((m) => m.remove());
      storeMarkersRef.current = {};
      return;
    }

    const filteredStores = stores.filter((s) => selectedBrands.includes(s.brand));

    Object.keys(storeMarkersRef.current).forEach((id) => {
      if (!filteredStores.some((s) => s.id === id)) {
        storeMarkersRef.current[id].remove();
        delete storeMarkersRef.current[id];
      }
    });

    filteredStores.forEach((store) => {
      const icon = createStoreIcon(store);

      if (storeMarkersRef.current[store.id]) {
        storeMarkersRef.current[store.id].setLatLng([store.lat, store.lng]).setIcon(icon);
      } else {
        const marker = L.marker([store.lat, store.lng], { icon })
          .bindPopup(
            `<div style="font-family: sans-serif; padding: 4px; min-width: 170px;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                <span style="font-weight: bold; font-size: 13px; color: #0f172a;">${store.name}</span>
              </div>
              <p style="margin: 1px 0 0 0; font-size: 11px; color: #0284c7; font-weight: 600;">Waypoint ${store.brand} (${store.code})</p>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${store.address}</p>
              <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.4;">
                <p style="margin: 0; color: #334155;"><strong>Dock:</strong> ${store.dockType.replace("_", " ")} (${store.parkingConstraint.replace("_", " ")})</p>
                <p style="margin: 0; color: #334155;"><strong>Phone:</strong> ${store.contactPhone}</p>
                <p style="margin: 0; color: #334155;"><strong>Scheduled:</strong> ${store.cratesScheduled} Packages</p>
                <p style="margin: 0; color: #334155;"><strong>Window:</strong> ${store.deliveryWindow}</p>
                <p style="margin: 0; color: #334155;"><strong>Status:</strong> <span style="text-transform: capitalize;">${store.todayStatus.replace("_", " ")}</span></p>
              </div>
            </div>`
          )
          .addTo(mapInstance);

        storeMarkersRef.current[store.id] = marker;
      }
    });
  }, [mapInstance, stores, showStores, selectedBrands]);

  return { vehicleMarkersRef, storeMarkersRef };
}
