import * as React from "react";
import { useSearchParams } from "react-router-dom";
import {
  useLoaderBays,
  BayPortalButton,
  BayDrawer,
  BayDiscrepancySheet,
  TruckPayloadCard,
  BayChecklistCard,
} from "@/features/loader";
import { Button } from "@/components/ui/button";
import {
  ListChecksIcon,
  TruckIcon,
  CheckCircleIcon,
  PlayIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function LoaderBaysPage() {
  const [searchParams] = useSearchParams();
  const urlTripId = searchParams.get("tripId");

  const [mobileTab, setMobileTab] = React.useState<"checklist" | "vehicle">("checklist");

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
    isWaypointLocked,
    shakingWaypointSeq,
    isLoading,
    isCompleted,
    isDeparting,
    isReadyForDeparture,
    isStartingLoading,
    activeTrip,
    filteredTrips,
    handleLockedAttempt,
    handleToggleItemStatus,
    handleUnlockWaypoint,
    handleConfirmDiscrepancy,
    handleStartLoading,
    handleConfirmDeparture,
    handleToggleExpandWaypoint,
  } = useLoaderBays(urlTripId);

  const isScheduled = activeTrip.status === "scheduled";

  const handleCompleteLoading = () => {
    handleConfirmDeparture();
  };

  return (
    <div className="relative page-container-desktop h-full flex flex-col min-h-0 gap-2.5">
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

      {/* Handed Over / Dispatched Banner */}
      {isCompleted && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
            <CheckCircleIcon className="size-5 shrink-0 text-emerald-600" weight="fill" />
            <div className="flex flex-col">
              <span className="font-bold">
                Trip #{activeTrip.tripCode} Loading Complete
              </span>
              <span className="text-[11px] text-emerald-700/90 dark:text-emerald-300/90">
                Handed over to Driver {activeTrip.driver.name} · Seal #
                {activeTrip.sealNumber}. Active in driver console.
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-lg self-end sm:self-auto">
            Ready for Driver
          </span>
        </div>
      )}

      {/* Scheduled Trip Loading Banner */}
      {isScheduled && !isCompleted && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300">
            <WarningCircleIcon className="size-5 shrink-0" weight="fill" />
            <div className="flex flex-col">
              <span className="font-bold">Trip #{activeTrip.tripCode} is Scheduled</span>
              <span className="text-[11px] text-amber-600/90 dark:text-amber-400/90">
                Dock vehicle at {activeTrip.dockBay} to begin checklist verification.
              </span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleStartLoading}
            disabled={isStartingLoading}
            className="rounded-xl text-xs font-bold gap-1.5 h-8.5 bg-amber-600 hover:bg-amber-700 text-white shadow-xs self-end sm:self-auto cursor-pointer"
          >
            <PlayIcon className="size-3.5" weight="bold" />
            <span>{isStartingLoading ? "Starting..." : "Start Loading Bay"}</span>
          </Button>
        </div>
      )}

      {/* Mobile Top View Switcher (Hidden on Desktop) */}
      <div className="lg:hidden flex flex-col sm:flex-row sm:items-center justify-between bg-card p-2.5 rounded-2xl border border-border/80 shadow-xs shrink-0 gap-2">
        <div className="flex items-center gap-1.5 p-0.5 bg-muted/70 rounded-xl border border-border/50 text-xs w-full">
          <button
            onClick={() => setMobileTab("checklist")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer",
              mobileTab === "checklist"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ListChecksIcon className="size-4" weight="bold" />
            <span>Checklist</span>
            <span className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded">
              {activeTrip.verifiedItemsCount}/{activeTrip.totalItemsCount}
            </span>
          </button>

          <button
            onClick={() => setMobileTab("vehicle")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer",
              mobileTab === "vehicle"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TruckIcon className="size-4" weight="bold" />
            <span>Cargo Info</span>
          </button>
        </div>

        {/* Action Button Row on Mobile */}
        <div className="flex items-center justify-end gap-2">
          {isCompleted ? (
            <Button
              disabled
              size="sm"
              className="w-full h-8.5 rounded-xl text-xs font-bold gap-1.5 shadow-xs bg-emerald-600/90 text-white cursor-not-allowed"
            >
              <CheckCircleIcon className="size-4" weight="fill" />
              <span>Handed Over to Driver</span>
            </Button>
          ) : isScheduled ? (
            <Button
              size="sm"
              onClick={handleStartLoading}
              disabled={isStartingLoading}
              className="w-full h-8.5 rounded-xl text-xs font-bold gap-1.5 shadow-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              <PlayIcon className="size-3.5" weight="bold" />
              <span>{isStartingLoading ? "Starting..." : "Start Loading"}</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleCompleteLoading}
              disabled={isDeparting}
              className={cn(
                "w-full h-8.5 rounded-xl text-xs font-bold gap-1.5 shadow-xs cursor-pointer",
                isReadyForDeparture
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-primary text-primary-foreground"
              )}
            >
              <CheckCircleIcon className="size-4" weight="fill" />
              <span>
                {isDeparting
                  ? "Confirming..."
                  : isReadyForDeparture
                    ? "Confirm & Hand Over"
                    : "Confirm Loading Complete"}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Split Grid on Desktop / Tabbed on Mobile */}
      <div className="split-workspace-grid items-start h-full min-h-0 flex-1">
        {/* Left Column: Payload & Cargo visualizer */}
        <div
          className={cn(
            "flex-col gap-3 min-w-0 h-full overflow-y-auto desktop:overflow-visible",
            mobileTab === "vehicle" ? "flex" : "hidden lg:flex"
          )}
        >
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
              isCompleted={isCompleted}
              isDeparting={isDeparting}
              onSwitchVehicle={() => setIsVehicleDrawerOpen(true)}
              onConfirm={() => {
                if (isScheduled) {
                  handleStartLoading();
                } else {
                  handleCompleteLoading();
                }
              }}
            />
          )}
        </div>

        {/* Right Column: Loading Waypoints Checklist (LIFO reverse order) */}
        <div
          className={cn(
            "flex-col gap-3 min-w-0 h-full overflow-y-auto pr-1 pb-16",
            mobileTab === "checklist" ? "flex" : "hidden lg:flex"
          )}
        >
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
                  disabled={isCompleted}
                  isExpanded={expandedStopSeq === waypoint.seq}
                  isLocked={isWaypointLocked(waypoint)}
                  isShaking={shakingWaypointSeq === waypoint.seq}
                  onToggleExpand={handleToggleExpandWaypoint}
                  onUnlock={(seq) => {
                    handleUnlockWaypoint(seq);
                  }}
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
