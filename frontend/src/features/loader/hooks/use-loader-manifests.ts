import * as React from "react";
import { useBays } from "@/api/loader";
import { useAuth } from "@/context/auth-context";
import type {
  LoaderVehicleTrip,
  ManifestStatusFilter,
  ManifestViewMode,
  TempFilter,
  VehicleTypeFilter,
} from "../types";

export function useLoaderManifests() {
  const { user } = useAuth();
  const userDepotId = user?.depotId || "depot-pel";

  const { data: bays = [], isLoading } = useBays(userDepotId);

  const [statusFilter, setStatusFilter] = React.useState<ManifestStatusFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] =
    React.useState<VehicleTypeFilter>("all");
  const [tempFilter, setTempFilter] = React.useState<TempFilter>("all");
  const [viewMode, setViewMode] = React.useState<ManifestViewMode>("table");
  const [inspectingTrip, setInspectingTrip] = React.useState<LoaderVehicleTrip | null>(
    null
  );

  const depotTrips: LoaderVehicleTrip[] = React.useMemo(() => {
    return bays.map((b) => ({
      id: b.trip.id,
      tripCode: b.trip.trip_code,
      tripSequence: 1,
      sealNumber: "SL-90821-B",
      vehicleId: b.vehicle.vehicle_id,
      regNumber: b.vehicle.reg_number,
      modelName: b.vehicle.model_name,
      type: b.vehicle.type,
      temp: b.vehicle.temp,
      weightCapKg: b.vehicle.weight_cap_kg,
      volumeCapM3: b.vehicle.volume_cap_m3,
      imagePath:
        b.vehicle.temp === "reefer"
          ? "/vehicle-images/freeze.png"
          : "/vehicle-images/dry.png",
      depotName: b.bay.depot_id === "depot-kandy" ? "Kandy Depot" : "Peliyagoda Depot",
      stopsCount: b.trip.stops_count,
      nextStopName: b.trip.next_stop_name,
      plannedDepartureTime: b.trip.planned_departure_time,
      departureCountdownMinutes: 45,
      status: (b.trip.status as any) || "loading",
      dockBay: b.bay.bay_number,
      verifiedItemsCount: b.progress.verified_items_count,
      totalItemsCount: b.progress.total_items_count,
      driver: {
        name: b.driver.name,
        designation: "Fleet Pilot",
        licenseId: b.driver.license_number || "DL-90821-WP-89",
        phone: b.driver.phone,
        avatarInitials: b.driver.name
          .split(" ")
          .map((n) => n[0])
          .join(""),
      },
      payload: {
        currentKg: b.progress.payload_kg,
        maxKg: b.progress.max_payload_kg,
        percentage: b.progress.payload_percentage,
        secondaryMetric: "Payload",
        currentVolumeM3: b.progress.volume_m3,
        maxVolumeM3: b.progress.max_volume_m3,
      },
      waypoints: [],
    }));
  }, [bays]);

  const filteredTrips = React.useMemo(() => {
    return depotTrips.filter((trip) => {
      if (statusFilter !== "all" && trip.status !== statusFilter) return false;
      if (vehicleTypeFilter !== "all" && trip.type !== vehicleTypeFilter) return false;
      if (tempFilter !== "all" && trip.temp !== tempFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesReg = trip.regNumber.toLowerCase().includes(q);
        const matchesTrip = trip.tripCode.toLowerCase().includes(q);
        const matchesDriver = trip.driver.name.toLowerCase().includes(q);
        const matchesBay = trip.dockBay.toLowerCase().includes(q);
        if (!matchesReg && !matchesTrip && !matchesDriver && !matchesBay) {
          return false;
        }
      }
      return true;
    });
  }, [depotTrips, statusFilter, vehicleTypeFilter, tempFilter, searchQuery]);

  const totalCount = depotTrips.length;
  const loadingCount = depotTrips.filter((t) => t.status === "loading").length;
  const readyCount = depotTrips.filter((t) => t.status === "ready").length;
  const dispatchedCount = depotTrips.filter((t) => t.status === "dispatched").length;
  const flaggedCount = depotTrips.filter((t) => t.status === "flagged").length;

  const resetFilters = React.useCallback(() => {
    setStatusFilter("all");
    setSearchQuery("");
    setVehicleTypeFilter("all");
    setTempFilter("all");
  }, []);

  return {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    vehicleTypeFilter,
    setVehicleTypeFilter,
    tempFilter,
    setTempFilter,
    viewMode,
    setViewMode,
    inspectingTrip,
    setInspectingTrip,
    isLoading,
    filteredTrips,
    counts: {
      total: totalCount,
      loading: loadingCount,
      ready: readyCount,
      dispatched: dispatchedCount,
      flagged: flaggedCount,
    },
    resetFilters,
  };
}
