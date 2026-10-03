import * as React from "react";
import { useAuth } from "@/context/auth-context";
import { mockLoaderTrips } from "@/data/mock-loader-bays";
import { useSimulatedLoading } from "@/lib/simulated-delay";
import type {
  LoaderVehicleTrip,
  ManifestStatusFilter,
  VehicleTypeFilter,
  TempFilter,
  ManifestViewMode,
} from "../types";

export function useLoaderManifests() {
  const { user } = useAuth();
  const userDepotBase = (user?.depotName || "Peliyagoda").split(" ")[0].toLowerCase();

  const depotTrips = React.useMemo(() => {
    return mockLoaderTrips.filter((trip) =>
      trip.depotName.toLowerCase().includes(userDepotBase)
    );
  }, [userDepotBase]);

  const [statusFilter, setStatusFilter] = React.useState<ManifestStatusFilter>("loading");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = React.useState<VehicleTypeFilter>("all");
  const [tempFilter, setTempFilter] = React.useState<TempFilter>("all");
  const [viewMode, setViewMode] = React.useState<ManifestViewMode>("table");
  const [inspectingTrip, setInspectingTrip] = React.useState<LoaderVehicleTrip | null>(null);

  const isLoading = useSimulatedLoading([statusFilter, vehicleTypeFilter, tempFilter]);

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
        const matchesSeal = trip.sealNumber.toLowerCase().includes(q);
        if (!matchesReg && !matchesTrip && !matchesDriver && !matchesBay && !matchesSeal) {
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
