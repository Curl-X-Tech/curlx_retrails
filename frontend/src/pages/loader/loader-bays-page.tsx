import { useSearchParams } from "react-router-dom";
import {
  useLoaderBays,
  BayPortalButton,
  BayDrawer,
  BayDiscrepancySheet,
  TruckPayloadCard,
  BayChecklistCard,
} from "@/features/loader";

export function LoaderBaysPage() {
  const [searchParams] = useSearchParams();
  const urlTripId = searchParams.get("tripId");

  const {
    trips,
    selectedTripId,
    setSelectedTripId,
    searchQuery,
    setSearchQuery,
    expandedStopSeq,
    isVehicleDrawerOpen,
    setIsVehicleDrawerOpen,
    reportingItem,
    setReportingItem,
    discrepancyType,
    setDiscrepancyType,
    discrepancyNotes,
    setDiscrepancyNotes,
    lockedWaypoints,
    shakingWaypointSeq,
    isLoading,
    activeTrip,
    filteredTrips,
    handleLockedAttempt,
    handleToggleItemStatus,
    handleUnlockWaypoint,
    handleConfirmDiscrepancy,
    handleToggleExpandWaypoint,
  } = useLoaderBays(urlTripId);

  return (
    <div className="relative page-container-desktop h-full flex flex-col min-h-0">
      <BayPortalButton
        baysCount={trips.length}
        onOpenDrawer={() => setIsVehicleDrawerOpen(true)}
      />

      <BayDrawer
        isOpen={isVehicleDrawerOpen}
        onOpenChange={setIsVehicleDrawerOpen}
        tripsCount={trips.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filteredTrips={filteredTrips}
        selectedTripId={selectedTripId}
        onSelectTrip={setSelectedTripId}
      />

      <BayDiscrepancySheet
        reportingItem={reportingItem}
        onClose={() => setReportingItem(null)}
        discrepancyType={discrepancyType}
        onTypeChange={setDiscrepancyType}
        discrepancyNotes={discrepancyNotes}
        onNotesChange={setDiscrepancyNotes}
        onConfirm={handleConfirmDiscrepancy}
      />

      <div className="split-workspace-grid items-start h-full min-h-0">
        <div className="flex flex-col gap-3 min-w-0 h-full overflow-y-auto desktop:overflow-visible">
          {isLoading ? (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 md:portrait:grid-cols-2 lg:grid-cols-1 gap-3.5">
                <div className="h-44 rounded-2xl bg-muted/60 animate-pulse" />
                <div className="h-44 rounded-2xl bg-muted/60 animate-pulse" />
              </div>
              <div className="h-12 rounded-xl bg-muted/60 animate-pulse" />
            </div>
          ) : (
            <TruckPayloadCard
              trip={activeTrip}
              onSwitchVehicle={() => setIsVehicleDrawerOpen(true)}
              onConfirm={() =>
                alert(
                  "Loading confirmed for Trip " +
                    activeTrip.tripCode +
                    " (Seal: " +
                    activeTrip.sealNumber +
                    ")"
                )
              }
            />
          )}
        </div>

        <div className="flex flex-col gap-3 min-w-0 h-full overflow-y-auto pr-1 pb-16">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
              <div className="h-64 rounded-2xl bg-muted/60 animate-pulse" />
              <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeTrip.waypoints.map((waypoint) => (
                <BayChecklistCard
                  key={waypoint.seq}
                  waypoint={waypoint}
                  isExpanded={expandedStopSeq === waypoint.seq}
                  isLocked={lockedWaypoints.has(waypoint.seq)}
                  isShaking={shakingWaypointSeq === waypoint.seq}
                  onToggleExpand={handleToggleExpandWaypoint}
                  onUnlock={handleUnlockWaypoint}
                  onLockedAttempt={handleLockedAttempt}
                  onToggleItemStatus={handleToggleItemStatus}
                  onReportItem={(stopSeq, item) => setReportingItem({ stopSeq, item })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
