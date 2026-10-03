import { useNavigate } from "react-router-dom";
import {
  useLoaderManifests,
  ManifestToolbar,
  ManifestTableView,
  ManifestGridView,
  ManifestInspectSheet,
  ManifestEmptyState,
} from "@/features/loader";

export function LoaderManifestsPage() {
  const navigate = useNavigate();
  const {
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
    counts,
    resetFilters,
  } = useLoaderManifests();

  return (
    <div className="w-full h-full flex flex-col min-h-0 gap-2.5">
      <ManifestToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        vehicleTypeFilter={vehicleTypeFilter}
        onVehicleTypeFilterChange={setVehicleTypeFilter}
        tempFilter={tempFilter}
        onTempFilterChange={setTempFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        counts={counts}
      />

      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
        {isLoading ? (
          <div className="space-y-2.5">
            <div className="h-10 rounded-2xl bg-muted/60 animate-pulse" />
            <div className="h-28 rounded-2xl bg-muted/60 animate-pulse" />
            <div className="h-28 rounded-2xl bg-muted/60 animate-pulse" />
          </div>
        ) : filteredTrips.length === 0 ? (
          <ManifestEmptyState onResetFilters={resetFilters} />
        ) : viewMode === "table" ? (
          <ManifestTableView
            trips={filteredTrips}
            onInspectTrip={setInspectingTrip}
            onOpenBay={(tripId) => navigate(`/loader/bays?tripId=${tripId}`)}
          />
        ) : (
          <ManifestGridView
            trips={filteredTrips}
            onInspectTrip={setInspectingTrip}
            onOpenBay={(tripId) => navigate(`/loader/bays?tripId=${tripId}`)}
          />
        )}
      </div>

      <ManifestInspectSheet
        trip={inspectingTrip}
        onClose={() => setInspectingTrip(null)}
        onOpenBayStation={(tripId) => navigate(`/loader/bays?tripId=${tripId}`)}
      />
    </div>
  );
}
