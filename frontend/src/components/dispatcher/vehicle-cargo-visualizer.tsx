import * as React from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/icon-button";

export interface VehicleVisualizerData {
  vehicleCategory: "lorry" | "van" | string;
  weightPercentage: number;
  volumePercentage: number;
  imageUrl: string;
  code?: string;
  weightKg?: number;
  allocatedWeightKg?: number;
  maxWeightKg: number;
  volumeCbm?: number;
  allocatedVolumeCbm?: number;
  maxVolumeCbm: number;
}

interface VehicleCargoVisualizerProps {
  vehicle: VehicleVisualizerData;
  mode: "weight" | "volume";
  onToggleMode?: (mode: "weight" | "volume") => void;
}

export function VehicleCargoVisualizer({
  vehicle,
  mode,
  onToggleMode,
}: VehicleCargoVisualizerProps) {
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const activeIndex = mode === "weight" ? 0 : 1;
  const isVan = vehicle.vehicleCategory === "van";

  // Exact Photoshop Coordinates based on 2048x2048 image canvas:
  // Lorries: x: 740px (36.13%), y: 575px (28.08%), w: 1150px (56.15%), h: 677px (33.06%)
  // Van:     x: 1083px (52.88%), y: 646px (31.54%), w: 711px (34.72%), h: 501px (24.46%)
  const containerStyle: React.CSSProperties = isVan
    ? {
        left: `${(1083 / 2048) * 100}%`,
        top: `${(646 / 2048) * 100}%`,
        width: `${(711 / 2048) * 100}%`,
        height: `${(501 / 2048) * 100}%`,
        borderRadius: "4px",
      }
    : {
        left: `${(740 / 2048) * 100}%`,
        top: `${(575 / 2048) * 100}%`,
        width: `${(1150 / 2048) * 100}%`,
        height: `${(677 / 2048) * 100}%`,
        borderRadius: "4px",
      };

  const getFillColor = (pct: number) => {
    if (pct >= 85) return "#EF4444";
    if (pct >= 60) return "#F97316";
    return "#0069A8";
  };

  const toggleMode = () => {
    const nextMode = mode === "weight" ? "volume" : "weight";
    onToggleMode?.(nextMode);
  };

  const setSpecificMode = (targetMode: "weight" | "volume") => {
    onToggleMode?.(targetMode);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const offset = currentX - touchStartX;
    if ((activeIndex === 0 && offset > 0) || (activeIndex === 1 && offset < 0)) {
      setDragOffset(offset * 0.3);
    } else {
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    if (dragOffset < -40 && activeIndex === 0) {
      setSpecificMode("volume");
    } else if (dragOffset > 40 && activeIndex === 1) {
      setSpecificMode("weight");
    }
    setTouchStartX(null);
    setIsDragging(false);
    setDragOffset(0);
  };

  const renderVehicleSlide = (slideType: "weight" | "volume") => {
    const pct =
      slideType === "weight" ? vehicle.weightPercentage : vehicle.volumePercentage;
    const color = getFillColor(pct);

    return (
      <div className="w-1/2 min-w-[50%] max-w-[50%] shrink-0 flex items-center justify-center overflow-hidden h-40 sm:h-48 my-1 select-none pointer-events-none">
        <div className="relative inline-block aspect-square h-56 sm:h-64 scale-[1.24] sm:scale-[1.3] transform-gpu pointer-events-none">
          <img
            src={vehicle.imageUrl}
            alt={vehicle.code}
            className="w-full h-full object-contain drop-shadow-md select-none pointer-events-none"
            draggable={false}
          />

          <div
            style={{
              ...containerStyle,
              borderColor: color,
              borderWidth: "2.5px",
              borderStyle: "dashed",
              backgroundColor: `${color}18`,
              boxShadow: `0 0 14px ${color}45, inset 0 0 10px ${color}30`,
            }}
            className="absolute overflow-hidden flex backdrop-blur-[0.5px]"
          >
            {slideType === "weight" ? (
              <div
                className="w-full self-end transition-all duration-500 ease-out relative"
                style={{
                  height: `${Math.min(pct, 100)}%`,
                  backgroundColor: color,
                  borderRadius: "2px",
                  boxShadow: `0 -2px 10px ${color}70`,
                }}
              />
            ) : (
              <div
                className="h-full self-start transition-all duration-500 ease-out relative"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  backgroundColor: color,
                  borderRadius: "2px",
                  boxShadow: `2px 0 10px ${color}70`,
                }}
              />
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center p-0.5 pointer-events-none">
              <div className="flex items-baseline gap-0.5 sm:gap-1 text-black dark:text-white font-extrabold select-none">
                <span
                  className={`font-bold uppercase tracking-tight opacity-90 ${
                    isVan ? "text-xs sm:text-sm" : "text-sm sm:text-base"
                  }`}
                >
                  {slideType === "weight" ? "w" : "v"}
                </span>
                <span
                  className={`font-heading font-black tracking-tight leading-none ${
                    isVan ? "text-lg sm:text-2xl" : "text-3xl sm:text-4xl"
                  }`}
                >
                  {pct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const currentPercentage =
    mode === "weight" ? vehicle.weightPercentage : vehicle.volumePercentage;

  return (
    <div
      className="relative w-full max-w-full flex flex-col items-center select-none overflow-hidden min-w-0"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div className="relative w-full max-w-full overflow-hidden min-w-0 touch-pan-y cursor-grab active:cursor-grabbing">
        <div
          className="flex w-[200%] min-w-[200%] max-w-[200%] transform-gpu will-change-transform"
          style={{
            transform: isDragging
              ? `translateX(calc(${activeIndex === 0 ? "0%" : "-50%"} + ${dragOffset}px))`
              : `translateX(${activeIndex === 0 ? "0%" : "-50%"})`,
            transition: isDragging
              ? "none"
              : "transform 350ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {renderVehicleSlide("weight")}
          {renderVehicleSlide("volume")}
        </div>
      </div>

      <div className="flex items-center justify-between w-full px-2 pt-2 border-t border-border/40 text-xs">
        <IconButton
          variant="ghost"
          size="xs"
          onClick={() => setSpecificMode("weight")}
          className={`size-6 cursor-pointer rounded-md transition-opacity ${
            activeIndex === 0
              ? "text-muted-foreground/40 hover:text-muted-foreground/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Switch to Mass (Weight)"
        >
          <CaretLeftIcon className="size-3.5" />
        </IconButton>

        <div
          onClick={toggleMode}
          className="flex items-center gap-2 px-3 py-1 bg-muted/80 hover:bg-muted rounded-full border border-border/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-1">
            <span
              className={`size-1.5 rounded-full transition-all duration-300 ${
                mode === "weight" ? "bg-primary w-3.5" : "bg-muted-foreground/40"
              }`}
            />
            <span
              className={`size-1.5 rounded-full transition-all duration-300 ${
                mode === "volume" ? "bg-primary w-3.5" : "bg-muted-foreground/40"
              }`}
            />
          </div>

          <span className="font-semibold text-xs text-foreground tracking-tight">
            {mode === "weight" ? "Mass (Weight)" : "Volume Capacity"}
          </span>

          <span className="text-[11px] font-bold text-muted-foreground">
            {currentPercentage}%
          </span>
        </div>

        <IconButton
          variant="ghost"
          size="xs"
          onClick={() => setSpecificMode("volume")}
          className={`size-6 cursor-pointer rounded-md transition-opacity ${
            activeIndex === 1
              ? "text-muted-foreground/40 hover:text-muted-foreground/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Switch to Volume Capacity"
        >
          <CaretRightIcon className="size-3.5" />
        </IconButton>
      </div>

      {/* Breakdown Metrics */}
      <div className="w-full px-3 pt-1 pb-0.5 flex justify-center text-[11px] font-medium text-muted-foreground tabular-nums">
        {mode === "weight" ? (
          <span>
            <strong className="text-foreground">
              {(vehicle.weightKg ?? vehicle.allocatedWeightKg ?? 0).toLocaleString()}
            </strong>{" "}
            / {vehicle.maxWeightKg.toLocaleString()} kg
          </span>
        ) : (
          <span>
            <strong className="text-foreground">
              {(vehicle.volumeCbm ?? vehicle.allocatedVolumeCbm ?? 0).toFixed(1)}
            </strong>{" "}
            / {vehicle.maxVolumeCbm.toFixed(1)} m³
          </span>
        )}
      </div>
    </div>
  );
}
