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
  CameraIcon,
  ArrowsClockwiseIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PencilSimpleLineIcon,
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

  // Discrepancy Modal
  const [isFlagModalOpen, setIsFlagModalOpen] = React.useState(false);
  const [flaggedItemId, setFlaggedItemId] = React.useState<string | null>(null);
  const [flagReason, setFlagReason] = React.useState<string>("Damaged crates on arrival");

  // Proof of Delivery (POD) Modal State (Signature / Photo)
  const [isPodModalOpen, setIsPodModalOpen] = React.useState(false);
  const [podMode, setPodMode] = React.useState<"signature" | "photo">("signature");
  const [hasSignature, setHasSignature] = React.useState(false);
  const [capturedPhoto, setCapturedPhoto] = React.useState<string | null>(null);
  const [isCapturing, setIsCapturing] = React.useState(false);

  // Canvas Signature References
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = React.useRef(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleCallStore = () => {
    window.location.href = `tel:${currentWp.storeManagerPhone}`;
  };

  // Triggered when bottom swipe is completed on unloading page
  const handleInitiatePod = () => {
    setIsPodModalOpen(true);
  };

  // Final Confirmation after Signature / Photo Capture
  const handleFinalDeliveryConfirm = () => {
    setTrip((prev) => ({
      ...prev,
      waypoints: prev.waypoints.map((w) =>
        w.seq === currentWp.seq ? { ...w, status: "completed" as const } : w
      ),
    }));

    setIsPodModalOpen(false);

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

  // -------------------------------------------------------------
  // HTML5 Signature Canvas Handlers
  // -------------------------------------------------------------
  const startDrawing = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawingRef.current = true;
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(x - rect.left, y - rect.top);
  };

  const drawMove = (x: number, y: number) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(x - rect.left, y - rect.top);
    ctx.strokeStyle = "#0070BA";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Simulated Photo Proof Capture
  const handleCapturePhoto = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setCapturedPhoto(
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80"
      );
      setIsCapturing(false);
    }, 600);
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
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

      {/* 3. Floating Bottom Delivery Confirmation Slider */}
      <div className="p-4 border-t border-border/80 bg-background/95 backdrop-blur-xl shrink-0 shadow-lg">
        <SwipeToConfirm
          label="Swipe to complete delivery"
          confirmedLabel="Opening verification signature..."
          onConfirm={handleInitiatePod}
          disabled={verifiedItems.size === 0}
          className="h-14 bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-heading font-black"
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. Proof of Delivery (POD) Signature & Photo Modal            */}
      {/* ------------------------------------------------------------- */}
      {isPodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border/90 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative">
            {/* Close Button */}
            <button
              onClick={() => setIsPodModalOpen(false)}
              className="absolute top-4 right-4 size-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer"
              aria-label="Close POD Modal"
            >
              <XIcon className="size-4" weight="bold" />
            </button>

            {/* Modal Header matching Reference Screenshots */}
            <div className="space-y-1 text-left pr-8">
              <h3 className="font-heading font-black text-xl text-foreground">
                {podMode === "signature" ? "Signature" : "Capture a picture"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {podMode === "signature"
                  ? "Kindly get store manager signature"
                  : "Capture photo of delivered crates at intake dock"}
              </p>
            </div>

            {/* Mode A: Interactive Signature Pad */}
            {podMode === "signature" && (
              <div className="relative border-2 border-dashed border-border/80 rounded-2xl h-60 w-full overflow-hidden bg-muted/10 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={240}
                  onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
                  onMouseMove={(e) => drawMove(e.clientX, e.clientY)}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={(e) => {
                    const t = e.touches[0];
                    startDrawing(t.clientX, t.clientY);
                  }}
                  onTouchMove={(e) => {
                    const t = e.touches[0];
                    drawMove(t.clientX, t.clientY);
                  }}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full cursor-crosshair touch-none"
                />

                {!hasSignature && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-muted-foreground/50 gap-1.5">
                    <PencilSimpleLineIcon className="size-6" weight="bold" />
                    <span className="text-xs font-semibold">Sign inside the box</span>
                  </div>
                )}

                {hasSignature && (
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    className="absolute top-2 right-2 text-[11px] font-bold text-muted-foreground hover:text-destructive bg-background/80 backdrop-blur-md px-2 py-1 rounded-md border border-border/60 cursor-pointer shadow-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Mode B: Photo Capture Viewfinder */}
            {podMode === "photo" && (
              <div
                onClick={() => {
                  if (!capturedPhoto && !isCapturing) {
                    fileInputRef.current?.click();
                  }
                }}
                className="relative border-2 border-dashed border-border/80 rounded-2xl h-60 w-full overflow-hidden bg-muted/10 flex flex-col items-center justify-center p-2 cursor-pointer hover:border-primary/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />

                {capturedPhoto ? (
                  <div className="relative w-full h-full rounded-xl overflow-hidden group">
                    <img
                      src={capturedPhoto}
                      alt="Delivered crates proof"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircleIcon
                        className="size-3.5 text-emerald-400"
                        weight="fill"
                      />
                      <span>Photo Verified</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetakePhoto();
                      }}
                      className="absolute top-2 right-2 text-[11px] font-bold text-white bg-black/70 hover:bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1 shadow-md active:scale-95"
                    >
                      <ArrowsClockwiseIcon className="size-3" weight="bold" />
                      <span>Retake</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4 gap-3">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center pointer-events-none">
                      <CameraIcon className="size-6" weight="bold" />
                    </div>
                    <div className="pointer-events-none">
                      <p className="font-heading font-black text-xs text-foreground">
                        Proof of Intake
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        Tap anywhere to capture intake cargo
                      </span>
                    </div>
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCapturePhoto();
                      }}
                      disabled={isCapturing}
                      className="h-9 px-5 rounded-xl text-xs font-bold bg-[#0070BA] hover:bg-[#0070BA]/90 text-white cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      <CameraIcon className="size-4 mr-1.5" weight="bold" />
                      <span>{isCapturing ? "Capturing..." : "Capture Photo"}</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Toggle Mode Switch Link matching Reference Screenshots */}
            <div className="text-left">
              {podMode === "signature" ? (
                <button
                  type="button"
                  onClick={() => setPodMode("photo")}
                  className="text-xs font-bold text-[#0070BA] hover:underline cursor-pointer"
                >
                  Store manager not available
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPodMode("signature")}
                  className="text-xs font-bold text-[#0070BA] hover:underline cursor-pointer"
                >
                  Store manager available
                </button>
              )}
            </div>

            {/* Bottom Confirm Action using shadcn Button */}
            <div className="pt-2">
              <Button
                onClick={handleFinalDeliveryConfirm}
                className="w-full h-12 rounded-2xl font-heading font-black text-sm bg-[#0070BA] hover:bg-[#0070BA]/90 text-white shadow-md cursor-pointer gap-2 flex items-center justify-center transition-all active:scale-95"
              >
                <span>Confirm</span>
                <ArrowRightIcon className="size-4" weight="bold" />
              </Button>
            </div>
          </div>
        </div>
      )}

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
