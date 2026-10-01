import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  MagnifyingGlassIcon,
  SnowflakeIcon,
  CheckCircleIcon,
  CaretDownIcon,
  CaretRightIcon,
  DotsThreeVerticalIcon,
  WarningCircleIcon,
  FlagIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { TruckPayloadCard } from "@/components/loader/truck-payload-card";
import {
  HoldToVerifyButton,
  HoldToUnlockButton,
} from "@/components/loader/hold-to-verify-button";
import { ManifestVehicleCard, type ManifestVehicleCardData } from "@/components/shared";
import {
  mockLoaderTrips,
  type LoaderVehicleTrip,
  type LoaderOrderItem,
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
      return "Mall Bay Delivery";
    case "HAZ":
      return "Hazardous Handling";
    default:
      return null;
  }
}

export function LoaderBaysPage() {
  const [searchParams] = useSearchParams();
  const urlTripId = searchParams.get("tripId");

  const [trips, setTrips] = React.useState<LoaderVehicleTrip[]>(mockLoaderTrips);
  const [selectedTripId, setSelectedTripId] = React.useState<string>(() => {
    if (urlTripId && mockLoaderTrips.some((t) => t.id === urlTripId)) {
      return urlTripId;
    }
    return mockLoaderTrips[0].id;
  });

  React.useEffect(() => {
    if (urlTripId && mockLoaderTrips.some((t) => t.id === urlTripId)) {
      setSelectedTripId(urlTripId);
    }
  }, [urlTripId]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedStopSeq, setExpandedStopSeq] = React.useState<number>(9);
  const [isVehicleDrawerOpen, setIsVehicleDrawerOpen] = React.useState<boolean>(false);

  // Item discrepancy reporting state
  const [reportingItem, setReportingItem] = React.useState<{
    stopSeq: number;
    item: LoaderOrderItem;
  } | null>(null);
  const [discrepancyType, setDiscrepancyType] = React.useState<
    "shortage" | "damaged" | "temp_breach" | "wrong_barcode"
  >("shortage");
  const [discrepancyNotes, setDiscrepancyNotes] = React.useState("");

  // Auto-lock waypoint sections when all items are verified
  const [lockedWaypoints, setLockedWaypoints] = React.useState<Set<number>>(() => {
    const initialLocked = new Set<number>();
    mockLoaderTrips[0]?.waypoints.forEach((wp) => {
      const allLoaded =
        wp.items.length > 0 && wp.items.every((i) => i.status === "verified");
      if (allLoaded) initialLocked.add(wp.seq);
    });
    return initialLocked;
  });

  const [shakingWaypointSeq, setShakingWaypointSeq] = React.useState<number | null>(null);

  const handleLockedAttempt = (seq: number) => {
    setShakingWaypointSeq(seq);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([40, 50, 40]);
      } catch {
        // Ignore vibration errors
      }
    }
    setTimeout(() => {
      setShakingWaypointSeq((curr) => (curr === seq ? null : curr));
    }, 550);
  };

  const isLoading = useSimulatedLoading([selectedTripId]);

  const activeTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  const filteredTrips = React.useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const q = searchQuery.toLowerCase();
    return trips.filter(
      (t) =>
        t.regNumber.toLowerCase().includes(q) ||
        t.modelName.toLowerCase().includes(q) ||
        t.depotName.toLowerCase().includes(q)
    );
  }, [trips, searchQuery]);

  // Hold-to-verify item status toggle
  const handleToggleItemStatus = (stopSeq: number, itemId: string) => {
    setTrips((prevTrips) =>
      prevTrips.map((trip) => {
        if (trip.id !== selectedTripId) return trip;
        const updatedWaypoints = trip.waypoints.map((wp) => {
          if (wp.seq !== stopSeq) return wp;
          const updatedItems = wp.items.map((item) => {
            if (item.id !== itemId) return item;
            const nextStatus: "pending" | "verified" =
              item.status === "verified" ? "pending" : "verified";
            return { ...item, status: nextStatus };
          });

          // Auto-lock when all items are verified
          const allVerified =
            updatedItems.length > 0 && updatedItems.every((i) => i.status === "verified");
          if (allVerified) {
            setLockedWaypoints((prev) => new Set(prev).add(stopSeq));
          } else {
            setLockedWaypoints((prev) => {
              const next = new Set(prev);
              next.delete(stopSeq);
              return next;
            });
          }

          return { ...wp, items: updatedItems };
        });

        return { ...trip, waypoints: updatedWaypoints };
      })
    );
  };

  const handleUnlockWaypoint = (stopSeq: number) => {
    setLockedWaypoints((prev) => {
      const next = new Set(prev);
      next.delete(stopSeq);
      return next;
    });
  };

  // Submit item discrepancy report
  const handleConfirmDiscrepancy = () => {
    if (!reportingItem) return;
    const { stopSeq, item } = reportingItem;

    setTrips((prevTrips) =>
      prevTrips.map((trip) => {
        if (trip.id !== selectedTripId) return trip;
        const updatedWaypoints = trip.waypoints.map((wp) => {
          if (wp.seq !== stopSeq) return wp;
          const updatedItems = wp.items.map((i) => {
            if (i.id !== item.id) return i;
            return {
              ...i,
              status: "flagged" as const,
              notes: discrepancyNotes || `Reported ${discrepancyType}`,
            };
          });
          return { ...wp, items: updatedItems };
        });
        return { ...trip, waypoints: updatedWaypoints };
      })
    );

    setReportingItem(null);
    setDiscrepancyNotes("");
  };

  // Toggle expand waypoint with tap-away auto-relock for all completed stops
  const handleToggleExpandWaypoint = (seq: number) => {
    setExpandedStopSeq((currentSeq) => {
      const nextSeq = currentSeq === seq ? 0 : seq;
      setLockedWaypoints((prev) => {
        const next = new Set(prev);
        activeTrip.waypoints.forEach((wp) => {
          const allLoaded =
            wp.items.length > 0 && wp.items.every((i) => i.status === "verified");
          if (allLoaded && wp.seq !== nextSeq) {
            next.add(wp.seq);
          }
        });
        return next;
      });
      return nextSeq;
    });
  };

  return (
    <div className="relative page-container-desktop h-full flex flex-col min-h-0">
      {/* ------------------------------------------------------------- */}
      {/* Left Edge Pullable / Floating Button (Screen Viewport Center) */}
      {/* ------------------------------------------------------------- */}
      {typeof document !== "undefined" &&
        createPortal(
          <button
            onClick={() => setIsVehicleDrawerOpen(true)}
            className="fixed left-16 z-50 hidden md:flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-r-2xl bg-card border border-l-0 border-border text-foreground shadow-2xl hover:bg-accent hover:shadow-primary/10 transition-colors active:scale-95 group cursor-pointer select-none"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
            }}
            title="Search & Switch Docked Vehicles / Drivers"
            aria-label="Search & Switch Docked Vehicles"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <MagnifyingGlassIcon className="size-4" weight="bold" />
            </div>
            <DotsThreeVerticalIcon className="size-3 text-muted-foreground/60" />
            <CaretRightIcon
              className="size-3.5 text-primary transition-transform group-hover:translate-x-0.5"
              weight="bold"
            />
            <span className="text-[10px] font-bold text-muted-foreground [writing-mode:vertical-lr] tracking-widest uppercase">
              {trips.length} Bays
            </span>
          </button>,
          document.body
        )}

      {/* ------------------------------------------------------------- */}
      {/* Slide-Out Vehicle Queue Sheet / Drawer                        */}
      {/* ------------------------------------------------------------- */}
      <Sheet open={isVehicleDrawerOpen} onOpenChange={setIsVehicleDrawerOpen}>
        <SheetContent
          side="left"
          className="sm:max-w-md w-full p-0 flex flex-col bg-card"
        >
          <SheetHeader className="p-5 pb-3 border-b border-border/70">
            <SheetTitle className="font-heading font-bold text-base text-foreground flex items-center justify-between">
              <span>Docked Vehicle Manifests</span>
              <Badge variant="secondary" className="text-xs font-bold px-2.5 py-0.5">
                {trips.length} Active
              </Badge>
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Tap any docked vehicle to switch the active loading manifest.
            </SheetDescription>
            {/* Search Input */}
            <div className="relative mt-2">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search Veh No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-10 rounded-xl bg-background border-border/80 text-sm font-sans shadow-xs"
              />
            </div>
          </SheetHeader>

          {/* Scrollable Vehicle List inside Drawer */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredTrips.map((trip) => {
              const isSelected = trip.id === selectedTripId;

              const cardData: ManifestVehicleCardData = {
                id: trip.id,
                plateNumber: trip.regNumber,
                vehicleModel: trip.modelName,
                imageUrl: trip.imagePath,
                hubName: trip.depotName,
                stopsCount: trip.stopsCount,
                nextStopName: trip.nextStopName,
                isColdChain: trip.temp === "reefer",
              };

              return (
                <ManifestVehicleCard
                  key={trip.id}
                  vehicle={cardData}
                  variant="loader"
                  isSelected={isSelected}
                  onClick={() => {
                    setSelectedTripId(trip.id);
                    setIsVehicleDrawerOpen(false);
                  }}
                />
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* ------------------------------------------------------------- */}
      {/* Item Discrepancy Reporting Sheet                              */}
      {/* ------------------------------------------------------------- */}
      <Sheet
        open={Boolean(reportingItem)}
        onOpenChange={(open) => !open && setReportingItem(null)}
      >
        <SheetContent
          side="right"
          className="sm:max-w-md w-full p-0 flex flex-col bg-card"
        >
          <SheetHeader className="p-5 pb-3 border-b border-border/70">
            <SheetTitle className="font-heading font-bold text-base text-foreground flex items-center gap-2">
              <WarningCircleIcon className="size-5 text-amber-500" weight="bold" />
              <span>Report Item Discrepancy</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Log a shortfall, damaged crates, or temperature issue for this order item.
            </SheetDescription>
          </SheetHeader>

          {reportingItem && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Target Item Summary */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5">
                <span className="font-heading font-bold text-sm text-foreground block">
                  {reportingItem.item.itemTitle}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border border-border/70">
                    {reportingItem.item.packageCode}
                  </span>
                  <span>#{reportingItem.item.orderRef}</span>
                  <span>·</span>
                  <span>{reportingItem.item.crateCount} Crates</span>
                </div>
              </div>

              {/* Discrepancy Type Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
                  Issue Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "shortage", label: "Crate Shortage" },
                    { id: "damaged", label: "Damaged Crates" },
                    { id: "temp_breach", label: "Temp Breach" },
                    { id: "wrong_barcode", label: "Barcode Mismatch" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDiscrepancyType(opt.id as typeof discrepancyType)}
                      className={cn(
                        "p-2.5 rounded-xl text-xs font-semibold border transition-all text-left",
                        discrepancyType === opt.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/80 bg-background text-foreground hover:bg-accent"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
                  Discrepancy Notes
                </label>
                <Input
                  placeholder="e.g. 2 crates missing from staging bay..."
                  value={discrepancyNotes}
                  onChange={(e) => setDiscrepancyNotes(e.target.value)}
                  className="h-11 rounded-xl text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setReportingItem(null)}
                  className="flex-1 h-11 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDiscrepancy}
                  className="flex-1 h-11 rounded-xl text-xs font-semibold"
                >
                  Flag Discrepancy
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ------------------------------------------------------------- */}
      {/* 4-Tier Split Workspace Grid:                                  */}
      {/* - Left Pane: Controls, Countdown, Payload & Verification      */}
      {/* - Right Pane: Purpose-Built Loading Checklist & Waypoints     */}
      {/* ------------------------------------------------------------- */}
      <div className="split-workspace-grid items-start h-full min-h-0">
        {/* Left Base Grid: Controls, Stats & Actions */}
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

        {/* Right Base Grid: Clear Warehouse Loading Checklist */}
        <div className="flex flex-col gap-3 min-w-0 h-full overflow-y-auto pr-1 pb-16">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
              <div className="h-64 rounded-2xl bg-muted/60 animate-pulse" />
              <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Waypoint Checklist Cards */}
              {activeTrip.waypoints.map((waypoint) => {
                const isExpanded = expandedStopSeq === waypoint.seq;
                const totalItems = waypoint.items.length;
                const verifiedItems = waypoint.items.filter(
                  (i) => i.status === "verified"
                ).length;
                const isAllLoaded = totalItems > 0 && verifiedItems === totalItems;
                const isLocked = lockedWaypoints.has(waypoint.seq);

                const totalCrates = waypoint.items.reduce(
                  (acc, i) => acc + i.crateCount,
                  0
                );
                const totalWeightKg = waypoint.items.reduce(
                  (acc, i) => acc + i.weightKg,
                  0
                );

                return (
                  <Card
                    key={waypoint.seq}
                    className={cn(
                      "flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs",
                      isLocked
                        ? "border-emerald-500/40 bg-card shadow-emerald-500/5 ring-1 ring-emerald-500/15"
                        : "border-border/80 bg-card"
                    )}
                  >
                    {/* Waypoint Section Header */}
                    <div
                      onClick={() => handleToggleExpandWaypoint(waypoint.seq)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/40 transition-colors select-none gap-3"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Stop Sequence Indicator */}
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-xl font-heading font-black text-sm transition-colors",
                            isLocked
                              ? "bg-emerald-500 text-white"
                              : "bg-primary text-primary-foreground"
                          )}
                        >
                          {waypoint.seq}
                        </div>

                        {/* Outlet Destination Info & Load Quantities */}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-sm sm:text-base text-foreground truncate">
                              {waypoint.outletName}
                            </span>
                            <span className="text-xs text-muted-foreground font-semibold shrink-0">
                              ({waypoint.outletCode})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="font-semibold text-foreground/90">
                              {totalCrates} Crates ({totalWeightKg} kg)
                            </span>
                            <span>·</span>
                            <span>{totalItems} Line Items</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Verification Status & Expand Toggle */}
                      <div className="flex items-center gap-3 shrink-0">
                        {isLocked ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center"
                          >
                            <HoldToUnlockButton
                              isShaking={shakingWaypointSeq === waypoint.seq}
                              onUnlock={() => handleUnlockWaypoint(waypoint.seq)}
                            />
                          </div>
                        ) : isAllLoaded ? (
                          <CheckCircleIcon
                            className="size-7 text-primary fill-primary drop-shadow-xs"
                            weight="fill"
                          />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground bg-muted/80 px-2.5 py-1 rounded-lg">
                            {verifiedItems}/{totalItems} Checked
                          </span>
                        )}
                        {isExpanded ? (
                          <CaretDownIcon className="size-4 text-muted-foreground" />
                        ) : (
                          <CaretRightIcon className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Progress Fill Line */}
                    <div className="h-1 w-full bg-muted/40 overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          isLocked ? "bg-emerald-500" : "bg-primary"
                        )}
                        style={{
                          width:
                            totalItems > 0
                              ? `${(verifiedItems / totalItems) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>

                    {/* Purpose-Built Warehouse Checklist Items */}
                    {isExpanded && (
                      <div className="flex flex-col border-t border-border/70 p-3 sm:p-3.5 gap-2.5 bg-muted/15">
                        {waypoint.items.map((item) => {
                          const isVerified = item.status === "verified";
                          const isFlagged = item.status === "flagged";
                          const handlingText = getHandlingLabel(item.specialHandlingCode);

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (isLocked) handleLockedAttempt(waypoint.seq);
                              }}
                              className={cn(
                                "flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all duration-200 select-none gap-3.5",
                                isVerified
                                  ? "border-emerald-500/30 bg-card/75 opacity-90 shadow-2xs"
                                  : isFlagged
                                    ? "border-amber-500/40 bg-amber-500/5 shadow-xs"
                                    : "border-border/80 bg-card hover:border-foreground/20 shadow-xs",
                                isLocked && "cursor-pointer"
                              )}
                            >
                              {/* Left: Product Identification, Bay Placement & Specs */}
                              <div className="flex flex-col min-w-0 flex-1 gap-1.5">
                                {/* Product Title */}
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "font-heading font-bold text-sm sm:text-base text-foreground leading-snug truncate",
                                      isVerified &&
                                        "text-muted-foreground line-through decoration-muted-foreground/50"
                                    )}
                                  >
                                    {item.itemTitle}
                                  </span>
                                </div>

                                {/* Barcode / Package Code & Order Reference */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                  <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border/70">
                                    {item.packageCode}
                                  </span>
                                  <span className="font-medium">#{item.orderRef}</span>
                                  <span>·</span>
                                  <span>{item.category}</span>
                                </div>

                                {/* Staging Bay Placement & Quantities */}
                                <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
                                  <span className="font-bold text-foreground bg-accent/80 px-2 py-0.5 rounded border border-border">
                                    {item.stagingBay}
                                  </span>
                                  <span>·</span>
                                  <span className="font-bold text-foreground text-sm font-sans">
                                    {item.crateCount} Crates
                                  </span>
                                  <span>·</span>
                                  <span className="font-medium text-foreground/80">
                                    {item.weightKg} kg
                                  </span>
                                  <span>·</span>
                                  <span className="font-medium">
                                    {item.volumeM3.toFixed(2)} m³
                                  </span>

                                  {/* Special Handling / Temperature Notes */}
                                  {item.isReefer && (
                                    <>
                                      <span>·</span>
                                      <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold">
                                        <SnowflakeIcon
                                          className="size-3 text-sky-500"
                                          weight="bold"
                                        />
                                        {item.temperature}
                                      </span>
                                    </>
                                  )}
                                  {handlingText && (
                                    <>
                                      <span>·</span>
                                      <span className="inline-flex items-center gap-1 text-foreground/80 font-medium">
                                        <WarningCircleIcon
                                          className="size-3 text-amber-500"
                                          weight="bold"
                                        />
                                        {handlingText}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {isFlagged && (
                                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold pt-0.5">
                                    <WarningCircleIcon
                                      className="size-3.5"
                                      weight="bold"
                                    />
                                    <span>Issue Reported: {item.notes}</span>
                                  </div>
                                )}
                              </div>

                              {/* Middle: Report Issue Button */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center shrink-0"
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isLocked}
                                  onClick={() =>
                                    setReportingItem({ stopSeq: waypoint.seq, item })
                                  }
                                  className={cn(
                                    "h-8 px-2.5 rounded-lg text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border cursor-pointer",
                                    isFlagged &&
                                      "text-amber-600 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                                  )}
                                  title="Report discrepancy or shortage for this item"
                                >
                                  <FlagIcon
                                    className="size-3.5"
                                    weight={isFlagged ? "fill" : "bold"}
                                  />
                                  <span className="hidden sm:inline">Report</span>
                                </Button>
                              </div>

                              {/* Right-Hand Action Zone: Glove-Friendly Hold-to-Verify Button */}
                              <div className="flex flex-col items-center justify-center shrink-0 pl-1">
                                <HoldToVerifyButton
                                  isVerified={isVerified}
                                  disabled={isLocked}
                                  onDisabledAttempt={() =>
                                    handleLockedAttempt(waypoint.seq)
                                  }
                                  onToggle={() =>
                                    handleToggleItemStatus(waypoint.seq, item.id)
                                  }
                                />
                                {isVerified && (
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                    Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
