import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  TruckIcon,
  ClockIcon,
  BoxArrowDownIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  FunnelIcon,
  PrinterIcon,
  ListBulletsIcon,
  SquaresFourIcon,
  UserIcon,
  ArrowsClockwiseIcon,
  EyeIcon,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ManifestVehicleCard, type ManifestVehicleCardData } from "@/components/shared";
import {
  mockLoaderTrips,
  type LoaderVehicleTrip,
  type SpecialHandlingCode,
} from "@/data/mock-loader-bays";
import { useSimulatedLoading } from "@/lib/simulated-delay";
import { cn } from "@/lib/utils";

function getHandlingLabel(code?: SpecialHandlingCode | null) {
  switch (code) {
    case "COL":
      return "Cold Chain";
    case "FRG":
      return "Fragile Cargo";
    case "MAL":
      return "Mall Bay";
    case "HAZ":
      return "Hazardous";
    default:
      return null;
  }
}

export function LoaderManifestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userDepotBase = (user?.depotName || "Peliyagoda").split(" ")[0].toLowerCase();

  // Filter trips to only those belonging to the logged-in user's assigned depot
  const depotTrips = React.useMemo(() => {
    return mockLoaderTrips.filter((trip) =>
      trip.depotName.toLowerCase().includes(userDepotBase)
    );
  }, [userDepotBase]);

  const [statusFilter, setStatusFilter] = React.useState<
    "loading" | "ready" | "dispatched" | "flagged" | "all"
  >("loading");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = React.useState<
    "all" | "truck" | "van"
  >("all");
  const [tempFilter, setTempFilter] = React.useState<"all" | "reefer" | "ambient">("all");
  const [viewMode, setViewMode] = React.useState<"table" | "grid">("table");
  const [inspectingTrip, setInspectingTrip] = React.useState<LoaderVehicleTrip | null>(
    null
  );

  const isLoading = useSimulatedLoading([statusFilter, vehicleTypeFilter, tempFilter]);

  // Filtered trips
  const filteredTrips = React.useMemo(() => {
    return depotTrips.filter((trip) => {
      // Status filter
      if (statusFilter !== "all" && trip.status !== statusFilter) {
        return false;
      }

      // Vehicle type filter
      if (vehicleTypeFilter !== "all" && trip.type !== vehicleTypeFilter) {
        return false;
      }

      // Temperature filter
      if (tempFilter !== "all" && trip.temp !== tempFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesReg = trip.regNumber.toLowerCase().includes(q);
        const matchesTrip = trip.tripCode.toLowerCase().includes(q);
        const matchesDriver = trip.driver.name.toLowerCase().includes(q);
        const matchesBay = trip.dockBay.toLowerCase().includes(q);
        const matchesSeal = trip.sealNumber.toLowerCase().includes(q);
        if (
          !matchesReg &&
          !matchesTrip &&
          !matchesDriver &&
          !matchesBay &&
          !matchesSeal
        ) {
          return false;
        }
      }

      return true;
    });
  }, [depotTrips, statusFilter, vehicleTypeFilter, tempFilter, searchQuery]);

  // Real-time counts for tabs strictly for this depot
  const totalCount = depotTrips.length;
  const loadingCount = depotTrips.filter((t) => t.status === "loading").length;
  const readyCount = depotTrips.filter((t) => t.status === "ready").length;
  const dispatchedCount = depotTrips.filter((t) => t.status === "dispatched").length;
  const flaggedCount = depotTrips.filter((t) => t.status === "flagged").length;

  return (
    <div className="w-full h-full flex flex-col min-h-0 gap-2.5">
      {/* 1. Header Toolbar: Title, Tabs, Search & Filters in One Compact Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 shrink-0 bg-card p-2 sm:p-2.5 rounded-2xl border border-border/80 shadow-xs">
        {/* Left: Prominent Tabs */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Tabs
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as typeof statusFilter)}
            className="w-full sm:w-auto"
          >
            <TabsList className="bg-muted/70 p-0.5 rounded-xl h-9 w-full sm:w-auto grid grid-cols-5 sm:flex sm:items-center gap-0.5">
              <TabsTrigger
                value="loading"
                className="rounded-lg text-xs font-bold px-2.5 py-1 gap-1.5 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span>Dock Queue</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-background/20 text-inherit">
                  {loadingCount}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="ready"
                className="rounded-lg text-xs font-bold px-2.5 py-1 gap-1.5 transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                <span>Ready</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-background/20 text-inherit">
                  {readyCount}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="dispatched"
                className="rounded-lg text-xs font-bold px-2.5 py-1 gap-1.5 transition-all data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                <span>History</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-background/20 text-inherit">
                  {dispatchedCount}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="flagged"
                className="rounded-lg text-xs font-bold px-2.5 py-1 gap-1.5 transition-all data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                <span>Flagged</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-background/20 text-inherit">
                  {flaggedCount}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="all"
                className="rounded-lg text-xs font-bold px-2.5 py-1 gap-1.5 transition-all"
              >
                <span>All</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-muted text-foreground">
                  {totalCount}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Right: Search, Secondary Filters & Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-52 min-w-[140px]">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search reg, trip, driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 pl-8 rounded-xl text-xs bg-background border-border/80 shadow-2xs"
            />
          </div>

          {/* Quick Vehicle Type Filter */}
          <select
            value={vehicleTypeFilter}
            onChange={(e) =>
              setVehicleTypeFilter(e.target.value as typeof vehicleTypeFilter)
            }
            className="h-8.5 px-2 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
            aria-label="Filter by vehicle type"
          >
            <option value="all">All Vehicles</option>
            <option value="truck">Trucks</option>
            <option value="van">Vans</option>
          </select>

          {/* Quick Temperature Filter */}
          <select
            value={tempFilter}
            onChange={(e) => setTempFilter(e.target.value as typeof tempFilter)}
            className="h-8.5 px-2 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
            aria-label="Filter by temperature"
          >
            <option value="all">All Cargo</option>
            <option value="reefer">Cold Chain</option>
            <option value="ambient">Ambient</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border/80 rounded-xl p-0.5 bg-muted/30 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={cn(
                "size-7.5 p-0 rounded-lg cursor-pointer",
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Table View"
              aria-label="Table View"
            >
              <ListBulletsIcon className="size-3.5" weight="bold" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "size-7.5 p-0 rounded-lg cursor-pointer",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Card Grid View"
              aria-label="Card Grid View"
            >
              <SquaresFourIcon className="size-3.5" weight="bold" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="size-8.5 p-0 rounded-xl border-border/80 hover:bg-accent cursor-pointer shadow-xs shrink-0"
            title="Print Schedule"
            aria-label="Print Schedule"
          >
            <PrinterIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* 2. Main Data View (Consolidated High-Impact 5-Column Table) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
        {isLoading ? (
          <div className="space-y-2.5">
            <div className="h-10 rounded-2xl bg-muted/60 animate-pulse" />
            <div className="h-28 rounded-2xl bg-muted/60 animate-pulse" />
            <div className="h-28 rounded-2xl bg-muted/60 animate-pulse" />
          </div>
        ) : filteredTrips.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-border/80 bg-card">
            <FunnelIcon className="size-8 text-muted-foreground/50 mb-2" />
            <h3 className="font-heading font-bold text-sm text-foreground">
              No matching manifests in this filter
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
              Try switching your tab selection or clearing the search keyword.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
                setVehicleTypeFilter("all");
                setTempFilter("all");
              }}
              className="mt-3 h-8 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <ArrowsClockwiseIcon className="size-3 mr-1.5" />
              Reset Filters
            </Button>
          </Card>
        ) : viewMode === "table" ? (
          /* Streamlined 5-Column High-Clarity Table */
          <Card className="rounded-2xl border border-border/80 overflow-hidden shadow-xs bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-heading font-bold text-xs text-foreground uppercase tracking-wider py-2.5 pl-3.5 pr-2 w-[11%]">
                    Bay
                  </TableHead>
                  <TableHead className="font-heading font-bold text-xs text-foreground uppercase tracking-wider py-2.5 w-[15%]">
                    Manifest
                  </TableHead>
                  <TableHead className="font-heading font-bold text-xs text-foreground uppercase tracking-wider py-2.5 w-[20%]">
                    Vehicle & Driver
                  </TableHead>
                  <TableHead className="font-heading font-bold text-xs text-foreground uppercase tracking-wider py-2.5 w-[16%]">
                    Departure
                  </TableHead>
                  <TableHead className="font-heading font-bold text-xs text-foreground uppercase tracking-wider py-2.5 w-[24%]">
                    Progress & Load
                  </TableHead>
                  <TableHead className="font-heading font-bold text-xs text-foreground uppercase tracking-wider py-2.5 text-right w-[14%]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => {
                  const isDispatched = trip.status === "dispatched";
                  const isReady = trip.status === "ready";
                  const isFlagged = trip.status === "flagged";
                  const isLoadingActive = trip.status === "loading";

                  return (
                    <TableRow
                      key={trip.id}
                      className={cn(
                        "transition-colors hover:bg-accent/30",
                        isFlagged && "bg-amber-500/5 hover:bg-amber-500/10"
                      )}
                    >
                      {/* Column 1: Dock Bay Badge with Status Notch */}
                      <TableCell className="py-2.5 pl-3.5 pr-2 align-middle relative">
                        <span
                          className={cn(
                            "absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r",
                            isLoadingActive && "bg-primary",
                            isReady && "bg-emerald-600 dark:bg-emerald-500",
                            isFlagged && "bg-amber-600 dark:bg-amber-500",
                            isDispatched && "bg-muted-foreground/40"
                          )}
                        />
                        <Badge
                          variant="secondary"
                          className="font-heading font-black text-xs px-2 py-0.5 rounded-lg border border-border bg-accent text-foreground shrink-0"
                        >
                          {trip.dockBay}
                        </Badge>
                      </TableCell>

                      {/* Column 2: Manifest ID & Seal */}
                      <TableCell className="py-2.5 align-middle">
                        <div className="flex flex-col min-w-0">
                          <span className="font-heading font-black text-sm text-foreground leading-tight">
                            {trip.tripCode}
                          </span>
                          <span className="text-[11px] font-medium text-muted-foreground truncate">
                            Seal #{trip.sealNumber}
                          </span>
                        </div>
                      </TableCell>

                      {/* Column 3: Vehicle & Driver */}
                      <TableCell className="py-2.5 align-middle">
                        <div className="flex flex-col min-w-0">
                          <span className="font-heading font-bold text-xs text-foreground truncate">
                            #{trip.regNumber}
                          </span>
                          <span className="text-[11px] font-medium text-muted-foreground truncate">
                            {trip.driver.name}
                          </span>
                        </div>
                      </TableCell>

                      {/* Column 4: Departure Schedule & Countdown */}
                      <TableCell className="py-2.5 align-middle">
                        {isDispatched ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">
                              Departed {trip.dispatchedAt || trip.plannedDepartureTime}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Completed Run
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                              <ClockIcon
                                className="size-3.5 text-primary"
                                weight="bold"
                              />
                              <span>{trip.plannedDepartureTime}</span>
                            </div>
                            <span
                              className={cn(
                                "text-[11px] font-semibold",
                                trip.departureCountdownMinutes < 15
                                  ? "text-rose-600 dark:text-rose-400 font-bold"
                                  : "text-muted-foreground"
                              )}
                            >
                              {trip.departureCountdownMinutes}m remaining
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Column 5: Progress & Payload */}
                      <TableCell className="py-2.5 align-middle">
                        <div className="flex flex-col gap-1">
                          {isDispatched ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
                              <CheckCircleIcon
                                className="size-3.5 text-muted-foreground"
                                weight="bold"
                              />
                              Dispatched (All Verified)
                            </span>
                          ) : isReady ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircleIcon
                                className="size-3.5 text-emerald-600"
                                weight="fill"
                              />
                              Ready for Rollout ({trip.verifiedItemsCount ?? 0}/
                              {trip.totalItemsCount ?? 0})
                            </span>
                          ) : isFlagged ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                              <WarningCircleIcon
                                className="size-3.5 text-amber-600"
                                weight="fill"
                              />
                              Issue Flagged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                              <BoxArrowDownIcon
                                className="size-3.5 text-primary"
                                weight="bold"
                              />
                              Loading ({trip.verifiedItemsCount ?? 0}/
                              {trip.totalItemsCount ?? 0})
                            </span>
                          )}

                          <span className="text-[11px] text-muted-foreground">
                            {trip.payload.currentKg} kg ({trip.payload.percentage}%) ·{" "}
                            {trip.stopsCount} Stops
                          </span>
                        </div>
                      </TableCell>

                      {/* Column 6: Actions */}
                      <TableCell className="py-2.5 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInspectingTrip(trip)}
                            className="size-7.5 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Inspect Manifest Details"
                            aria-label="Inspect Manifest Details"
                          >
                            <EyeIcon className="size-4" />
                          </Button>

                          <Button
                            variant={isLoadingActive ? "default" : "secondary"}
                            size="sm"
                            onClick={() => navigate(`/loader/bays?tripId=${trip.id}`)}
                            className="h-7.5 px-2.5 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            {isLoadingActive ? "Open Bay" : "View"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ) : (
          /* Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {filteredTrips.map((trip) => {
              const cardData: ManifestVehicleCardData = {
                id: trip.id,
                plateNumber: trip.regNumber,
                vehicleModel: trip.modelName,
                imageUrl: trip.imagePath,
                hubName: trip.dockBay,
                stopsCount: trip.stopsCount,
                nextStopName: trip.nextStopName,
                isColdChain: trip.temp === "reefer",
              };

              return (
                <div key={trip.id} className="flex flex-col gap-1">
                  <ManifestVehicleCard
                    vehicle={cardData}
                    variant="loader"
                    onClick={() => navigate(`/loader/bays?tripId=${trip.id}`)}
                  />
                  <div className="flex items-center justify-between px-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-black text-foreground">
                        {trip.tripCode}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground font-semibold">
                        {trip.plannedDepartureTime}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectingTrip(trip)}
                      className="h-6.5 px-2 text-[11px] font-semibold rounded-lg cursor-pointer"
                    >
                      Inspect Stops
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Manifest Inspect & Waypoints Sheet */}
      <Sheet
        open={Boolean(inspectingTrip)}
        onOpenChange={(open) => !open && setInspectingTrip(null)}
      >
        <SheetContent
          side="right"
          className="sm:max-w-md w-full p-0 flex flex-col bg-card"
        >
          {inspectingTrip && (
            <>
              <SheetHeader className="p-4 pb-3 border-b border-border/70">
                <div className="flex items-center justify-between">
                  <SheetTitle className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                    <TruckIcon className="size-5 text-primary" weight="bold" />
                    <span>Manifest {inspectingTrip.tripCode}</span>
                  </SheetTitle>
                  <Badge variant="secondary" className="font-bold text-xs">
                    {inspectingTrip.dockBay}
                  </Badge>
                </div>
                <SheetDescription className="text-xs text-muted-foreground">
                  Vehicle #{inspectingTrip.regNumber} · Seal #{inspectingTrip.sealNumber}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Driver and Specs Card */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserIcon className="size-4 text-primary" />
                      <span className="font-heading font-bold text-xs text-foreground">
                        {inspectingTrip.driver.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      {inspectingTrip.driver.phone}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                        Weight
                      </span>
                      <span className="font-heading font-bold text-foreground">
                        {inspectingTrip.payload.currentKg} / {inspectingTrip.weightCapKg}{" "}
                        kg
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                        Volume
                      </span>
                      <span className="font-heading font-bold text-foreground">
                        {inspectingTrip.payload.currentVolumeM3} /{" "}
                        {inspectingTrip.volumeCapM3} m³
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                        Departure
                      </span>
                      <span className="font-heading font-bold text-foreground">
                        {inspectingTrip.plannedDepartureTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flagged Issue Banner if present */}
                {inspectingTrip.flagReason && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-start gap-2">
                    <WarningCircleIcon
                      className="size-4.5 text-amber-600 shrink-0 mt-0.5"
                      weight="fill"
                    />
                    <div>
                      <span className="font-bold block">Flagged Discrepancy Logged:</span>
                      <span>{inspectingTrip.flagReason}</span>
                    </div>
                  </div>
                )}

                {/* Stops & Line Items List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Waypoints ({inspectingTrip.waypoints.length} Stops)
                  </h4>
                  <div className="space-y-2">
                    {inspectingTrip.waypoints.map((wp) => (
                      <div
                        key={wp.seq}
                        className="p-2.5 rounded-xl border border-border/80 bg-background space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex size-5 items-center justify-center rounded-lg bg-primary text-primary-foreground font-heading font-black text-[11px]">
                              {wp.seq}
                            </span>
                            <span className="font-heading font-bold text-xs text-foreground">
                              {wp.outletName}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {wp.deliveryWindow}
                          </span>
                        </div>

                        {/* Items in this waypoint */}
                        {wp.items && wp.items.length > 0 ? (
                          <div className="space-y-1 pt-0.5">
                            {wp.items.map((item) => {
                              const handlingText = getHandlingLabel(
                                item.specialHandlingCode
                              );
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-1.5 rounded-lg bg-muted/40 text-xs gap-2"
                                >
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium text-foreground truncate text-[11px]">
                                      {item.itemTitle}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                      <span className="font-bold text-foreground">
                                        {item.packageCode}
                                      </span>
                                      <span>·</span>
                                      <span>{item.stagingBay}</span>
                                      {handlingText && (
                                        <>
                                          <span>·</span>
                                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                            {handlingText}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <span className="font-bold text-foreground text-[11px] shrink-0">
                                    {item.crateCount} Crates
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground italic pl-7">
                            Loading completed for this stop.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-1 flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setInspectingTrip(null)}
                    className="flex-1 h-9 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      setInspectingTrip(null);
                      navigate(`/loader/bays?tripId=${inspectingTrip.id}`);
                    }}
                    className="flex-1 h-9 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer"
                  >
                    Open Bay Station
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
