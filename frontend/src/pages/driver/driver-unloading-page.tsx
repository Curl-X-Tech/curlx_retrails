import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CaretRightIcon,
  CaretLeftIcon,
  WarningIcon,
  MapPinIcon,
  SnowflakeIcon,
  XIcon,
  PhoneCallIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SwipeToConfirm } from "@/components/ui/swipe-to-confirm";
import { HoldToToggleCheckbox } from "@/components/ui/hold-to-toggle-checkbox";
import { mockDriverTrip, type DriverWaypoint } from "@/data/mock-driver-trips";
import { cn } from "@/lib/utils";

export function DriverUnloadingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [trip, setTrip] = React.useState(mockDriverTrip);
  const waypoints = trip.waypoints;

  const queryWpSeq = Number(searchParams.get("wp"));
  const targetWp =
    (queryWpSeq && waypoints.find((w) => w.seq === queryWpSeq)) ||
    waypoints.find((w) => w.status === "active") ||
    waypoints[0];

  const [currentWp, setCurrentWp] = React.useState<DriverWaypoint>(targetWp);
  const [verifiedItems, setVerifiedItems] = React.useState<Set<string>>(() => {
    if (targetWp.status === "completed") {
      return new Set(targetWp.items.map((i) => i.id));
    }
    return new Set();
  });
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(() => {
    if (targetWp.items.length > 0) {
      return new Set([targetWp.items[0].id]);
    }
    return new Set();
  });

  const [isFlagModalOpen, setIsFlagModalOpen] = React.useState(false);
  const [flaggedItemId, setFlaggedItemId] = React.useState<string | null>(null);
  const [flagReason, setFlagReason] = React.useState<string>("Damaged crates on arrival");

  React.useEffect(() => {
    if (targetWp) {
      setCurrentWp(targetWp);
      if (targetWp.status === "completed") {
        setVerifiedItems(new Set(targetWp.items.map((i) => i.id)));
      }
    }
  }, [targetWp]);

  const toggleItemVerification = (itemId: string) => {
    setVerifiedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleExpandItem = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleOpenFlagModal = (itemId?: string) => {
    setFlaggedItemId(itemId || null);
    setIsFlagModalOpen(true);
  };

  const handleConfirmFlagIssue = () => {
    if (flaggedItemId) {
      setCurrentWp((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === flaggedItemId ? { ...i, status: "discrepancy" as const } : i
        ),
      }));
    }
    setIsFlagModalOpen(false);
    setFlaggedItemId(null);
  };

  const handleCompleteDelivery = () => {
    setTrip((prev) => ({
      ...prev,
      waypoints: prev.waypoints.map((w) =>
        w.seq === currentWp.seq ? { ...w, status: "completed" as const } : w
      ),
    }));

    // Find next upcoming waypoint if any
    const nextWp = waypoints.find(
      (w) => w.seq > currentWp.seq && w.status !== "completed"
    );
    if (nextWp) {
      navigate(`/driver/active?wp=${nextWp.seq}`);
    } else {
      navigate("/driver/active");
    }
  };

  const handleCallStore = () => {
    window.location.href = `tel:${currentWp.storeManagerPhone}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col min-h-0 overflow-hidden select-none bg-background">
      {/* 1. Sub-Header Navigation & Waypoint Identity Bar */}
      <div className="shrink-0 px-4 pt-3 pb-2 flex items-center justify-between gap-3 border-b border-border/70 bg-background/95 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => navigate("/driver/active")}
            className="size-9 rounded-xl flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label="Back to Map"
          >
            <CaretLeftIcon className="size-5" weight="bold" />
          </button>

          {/* Sequence Square Badge matching Reference */}
          <div className="size-9 rounded-xl bg-[#0070BA] text-white flex items-center justify-center font-heading font-black text-sm shrink-0 shadow-xs">
            {currentWp.seq}
          </div>

          <div className="flex flex-col min-w-0">
            <h2 className="font-heading font-black text-sm sm:text-base text-foreground truncate leading-tight">
              {currentWp.outletName}
            </h2>
            <span className="text-[11px] font-semibold text-muted-foreground truncate">
              {currentWp.address}
            </span>
          </div>
        </div>

        {/* Red Emergency / Flag Issue Button matching Reference */}
        <Button
          variant="destructive"
          size="icon"
          onClick={() => handleOpenFlagModal()}
          className="size-10 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md cursor-pointer shrink-0"
          aria-label="Flag Stop Discrepancy"
        >
          <WarningIcon className="size-5" weight="fill" />
        </Button>
      </div>

      {/* 2. Scrollable Unloading Order Items Checklist */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Store Receiving Contact Banner */}
        <div className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground font-medium">
              Receiving Manager
            </span>
            <strong className="font-heading font-bold text-xs text-foreground">
              {currentWp.storeManagerName}
            </strong>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {currentWp.storeManagerPhone}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCallStore}
            className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1 cursor-pointer"
          >
            <PhoneCallIcon className="size-3.5 text-primary" weight="bold" />
            <span>Call Store</span>
          </Button>
        </div>

        {/* Checklist Header */}
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="font-heading font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Unloading Items ({verifiedItems.size}/{currentWp.items.length})
          </span>
          <span className="text-xs font-bold text-primary">
            {currentWp.totalCrateCount} Crates Total
          </span>
        </div>

        {/* Order Items List */}
        <div className="space-y-3">
          {currentWp.items.map((item) => {
            const isItemVerified = verifiedItems.has(item.id);
            const isExpanded = expandedItems.has(item.id);

            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-2xl border transition-all bg-card relative",
                  isItemVerified
                    ? "border-emerald-500/40 shadow-xs"
                    : "border-border/80 hover:border-primary/40"
                )}
              >
                {/* Collapsed Item Row */}
                <div
                  onClick={() => toggleExpandItem(item.id)}
                  className={cn(
                    "p-3.5 flex items-center justify-between gap-3 cursor-pointer bg-card hover:bg-accent/30 transition-colors",
                    isExpanded ? "rounded-t-2xl" : "rounded-2xl"
                  )}
                >
                  {/* Left: Caret + Order Code + Crates Count + Snowflake Badge */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground transition-transform"
                      aria-label="Toggle item details"
                    >
                      <CaretRightIcon
                        className={cn(
                          "size-4 transition-transform duration-200",
                          isExpanded && "rotate-90"
                        )}
                        weight="bold"
                      />
                    </button>

                    <span className="font-heading font-black text-xs sm:text-sm text-foreground">
                      #{item.orderRef || item.packageCode}
                    </span>

                    <span className="font-heading font-bold text-xs sm:text-sm text-[#0070BA]">
                      {item.crateCount} Crates
                    </span>

                    {item.isReefer && (
                      <div
                        className="size-6 rounded-full bg-sky-100 dark:bg-sky-950/80 flex items-center justify-center text-[#0070BA] shrink-0"
                        title="Cold Chain Temperature Controlled"
                      >
                        <SnowflakeIcon className="size-3.5" weight="bold" />
                      </div>
                    )}
                  </div>

                  {/* Right: Hold-to-Toggle Checkbox */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <HoldToToggleCheckbox
                      checked={isItemVerified}
                      onToggle={() => toggleItemVerification(item.id)}
                      holdDurationMs={500}
                      ariaLabel={
                        isItemVerified
                          ? `Hold to uncheck ${item.orderRef || item.packageCode}`
                          : `Hold to verify ${item.orderRef || item.packageCode}`
                      }
                    />
                  </div>
                </div>

                {/* Expanded Item Detail matching Reference */}
                {isExpanded && (
                  <div className="px-4 pb-3.5 pt-1 border-t border-border/60 bg-muted/20 space-y-2 text-xs rounded-b-2xl">
                    {/* SKU Item Title */}
                    <div className="font-heading font-black text-xs sm:text-sm text-foreground leading-snug">
                      {item.itemTitle}
                    </div>

                    {/* Metric Rows */}
                    <div className="border-t border-border/50 divide-y divide-border/40 pt-1">
                      <div className="py-1.5 flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">
                          Total Weight
                        </span>
                        <strong className="font-heading font-bold text-foreground">
                          {item.weightKg} kg
                        </strong>
                      </div>

                      <div className="py-1.5 flex items-center justify-between">
                        <span className="text-muted-foreground font-medium flex items-center gap-1">
                          <MapPinIcon className="size-3.5 text-[#0070BA]" weight="bold" />
                          <span>Staging Location</span>
                        </span>
                        <strong className="font-heading font-bold text-foreground">
                          {currentWp.stagingLocation || "Bay 4C"}
                        </strong>
                      </div>
                    </div>

                    {/* Red Flag Issue Button */}
                    <div className="flex justify-end pt-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFlagModal(item.id);
                        }}
                        className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer"
                      >
                        <WarningIcon className="size-3.5" weight="fill" />
                        <span>Flag Issue</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Floating Bottom Delivery Confirmation Slider matching Reference */}
      <div className="p-4 border-t border-border/80 bg-background/95 backdrop-blur-xl shrink-0 shadow-lg">
        <SwipeToConfirm
          label="Swipe to mark Delivered"
          confirmedLabel="Delivered! Proceeding..."
          onConfirm={handleCompleteDelivery}
          disabled={verifiedItems.size === 0}
          className="h-14 bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-heading font-black"
        />
      </div>

      {/* Flag Issue Discrepancy Modal */}
      {isFlagModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <WarningIcon className="size-5" weight="fill" />
                <h3 className="font-heading font-black text-sm text-foreground">
                  Flag Delivery Discrepancy
                </h3>
              </div>
              <button
                onClick={() => setIsFlagModalOpen(false)}
                className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <XIcon className="size-4" weight="bold" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Select the exception reason for{" "}
              {flaggedItemId ? `Item #${flaggedItemId}` : currentWp.outletName}:
            </p>

            <div className="space-y-2 text-xs">
              {[
                "Damaged crates on arrival",
                "Temperature tolerance exceeded",
                "Crates count / SKU mismatch",
                "Store manager refused intake",
                "Dock access obstructed",
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setFlagReason(reason)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                    flagReason === reason
                      ? "border-destructive bg-destructive/10 text-destructive font-bold"
                      : "border-border hover:bg-muted text-foreground"
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsFlagModalOpen(false)}
                className="flex-1 rounded-xl h-9 text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmFlagIssue}
                className="flex-1 rounded-xl h-9 text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
