import * as React from "react";
import { createPortal } from "react-dom";
import {
  MagnifyingGlassIcon,
  SnowflakeIcon,
  CheckCircleIcon,
  CaretDownIcon,
  CaretRightIcon,
  DotsThreeVerticalIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { mockLoaderTrips, type LoaderVehicleTrip } from "@/data/mock-loader-bays";
import { useSimulatedLoading } from "@/lib/simulated-delay";
import { cn } from "@/lib/utils";

export function LoaderBaysPage() {
  const [trips, setTrips] = React.useState<LoaderVehicleTrip[]>(mockLoaderTrips);
  const [selectedTripId, setSelectedTripId] = React.useState<string>(
    mockLoaderTrips[0].id
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedStopSeq, setExpandedStopSeq] = React.useState<number>(9);
  const [isVehicleDrawerOpen, setIsVehicleDrawerOpen] = React.useState<boolean>(false);

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
        // Ignore
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

  // Toggle expand waypoint with tap-away auto-relock for all completed stops
  const handleToggleExpandWaypoint = (seq: number) => {
    setExpandedStopSeq((currentSeq) => {
      const nextSeq = currentSeq === seq ? 0 : seq;
      // Auto-relock completed waypoints when tapping away
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
    <div className="relative w-full max-w-[1440px] mx-auto">
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
      {/* Responsive Tablet Dashboard:                                  */}
      {/* - Landscape / Desktop (lg:): 2 Base Grids (Side-by-Side)      */}
      {/*   * Left Base Grid: Controls & Stats (Sticky)                 */}
      {/*   * Right Base Grid: Dedicated Scrollable Waypoints Checklist */}
      {/* - Portrait Tablet (< lg): 2-Col Top Section + Checklist Below */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 w-full items-start">
        {/* Left Base Grid (5 cols on lg, sticky): Vehicle Details, Driver, Payload & Actions */}
        <div className="lg:col-span-5 flex flex-col gap-3.5 min-w-0 lg:sticky lg:top-0">
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
              onPrint={() => window.print()}
              onFlagIssue={() => alert("Issue reported to Bay Master")}
              onConfirm={() =>
                alert("Bay loading confirmed for vehicle " + activeTrip.regNumber)
              }
            />
          )}
        </div>

        {/* Right Base Grid (7 cols on lg): Dedicated Scrollable Waypoint Manifest & Checklist */}
        <div className="lg:col-span-7 flex flex-col gap-3 min-w-0 lg:overflow-y-auto lg:max-h-[calc(100vh-6.5rem)] lg:pr-1">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
              <div className="h-64 rounded-2xl bg-muted/60 animate-pulse" />
              <div className="h-16 rounded-2xl bg-muted/60 animate-pulse" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeTrip.waypoints.map((waypoint) => {
                const isExpanded = expandedStopSeq === waypoint.seq;
                const totalItems = waypoint.items.length;
                const verifiedItems = waypoint.items.filter(
                  (i) => i.status === "verified"
                ).length;
                const isAllLoaded = totalItems > 0 && verifiedItems === totalItems;
                const isLocked = lockedWaypoints.has(waypoint.seq);

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
                    {/* Minimalist Waypoint Header Bar */}
                    <div
                      onClick={() => handleToggleExpandWaypoint(waypoint.seq)}
                      className="flex items-center justify-between p-3.5 sm:p-4 cursor-pointer hover:bg-accent/40 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Sequence Badge */}
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg font-heading font-black text-xs transition-colors",
                            isLocked
                              ? "bg-emerald-500 text-white"
                              : "bg-primary text-primary-foreground"
                          )}
                        >
                          {waypoint.seq}
                        </div>
                        <span className="font-heading font-bold text-xs sm:text-sm text-foreground truncate">
                          {waypoint.outletName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
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
                            className="size-6 text-primary fill-primary drop-shadow-xs"
                            weight="fill"
                          />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground px-1">
                            {verifiedItems}/{totalItems}
                          </span>
                        )}
                        {isExpanded ? (
                          <CaretDownIcon className="size-4 text-muted-foreground" />
                        ) : (
                          <CaretRightIcon className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Minimal Completion Progress Bar */}
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

                    {/* Waypoint Items Checklist (Flat, Minimal, Single-Tier) */}
                    {isExpanded && (
                      <div className="flex flex-col border-t border-border/70 p-2.5 sm:p-3 gap-2 bg-muted/10">
                        {waypoint.items.map((item) => {
                          const isVerified = item.status === "verified";

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (isLocked) handleLockedAttempt(waypoint.seq);
                              }}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 select-none gap-3",
                                isVerified
                                  ? "border-emerald-500/30 bg-card shadow-xs"
                                  : "border-border/70 bg-card hover:border-border",
                                isLocked &&
                                  "border-emerald-500/20 bg-card/90 cursor-pointer"
                              )}
                            >
                              {/* Product & Order Details */}
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-heading font-black text-xs sm:text-sm text-foreground tracking-tight">
                                      {item.orderRef}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary text-[11px] font-bold text-secondary-foreground shrink-0">
                                      {item.crateCount} Crates · {item.weightKg}kg
                                    </span>
                                    {item.isReefer && (
                                      <div
                                        className="flex size-5 items-center justify-center rounded-full bg-sky-500/10 text-sky-500 shrink-0"
                                        title={`Cold Chain: ${item.temperature}`}
                                      >
                                        <SnowflakeIcon
                                          className="size-3.5"
                                          weight="bold"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground truncate">
                                    <span className="truncate">{item.itemTitle}</span>
                                    <span>·</span>
                                    <span className="font-medium text-foreground/80 shrink-0">
                                      Bay {item.stagingBay}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Rounded Glove-Friendly Hold-to-Verify Button */}
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
