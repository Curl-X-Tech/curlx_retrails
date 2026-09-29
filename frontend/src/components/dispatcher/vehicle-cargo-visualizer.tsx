import * as React from "react";
import type { VehicleTrackingData } from "@/data/mock-live-map";

interface VehicleCargoVisualizerProps {
  vehicle: VehicleTrackingData;
  mode: "weight" | "volume";
  onToggleMode?: (mode: "weight" | "volume") => void;
}

export function VehicleCargoVisualizer({
  vehicle,
  mode,
  onToggleMode,
}: VehicleCargoVisualizerProps) {
  const percentage =
    mode === "weight" ? vehicle.weightPercentage : vehicle.volumePercentage;

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

  // Status-driven fill color (vibrant red/coral as shown in reference)
  const getFillColor = (pct: number) => {
    if (pct >= 85) return "#EF4444"; // Red (high load)
    if (pct >= 60) return "#F97316"; // Orange / Coral
    return "#0069A8"; // Brand Blue
  };

  const fillColor = getFillColor(percentage);

  return (
    <div className="relative w-full flex flex-col items-center select-none overflow-hidden">
      {/* Visualizer Frame: Scaled to crop 2048x2048 canvas margins so vehicle appears big & bold */}
      <div className="relative w-full flex items-center justify-center overflow-hidden h-40 sm:h-48 my-1">
        <div className="relative inline-block aspect-square h-56 sm:h-64 scale-[1.32] sm:scale-[1.4] transform-gpu transition-transform duration-300">
          {/* Base Vehicle PNG Asset */}
          <img
            src={vehicle.imageUrl}
            alt={vehicle.code}
            className="w-full h-full object-contain drop-shadow-md select-none"
          />

          {/* Overlaid Cargo Container Bay Area (Exact Photoshop Bounds + Shaded Outline) */}
          <div
            style={{
              ...containerStyle,
              borderColor: fillColor,
              borderWidth: "2.5px",
              borderStyle: "solid",
              backgroundColor: `${fillColor}18`, // Shaded translucent background for empty container area
              boxShadow: `0 0 14px ${fillColor}45, inset 0 0 10px ${fillColor}30`,
            }}
            className="absolute overflow-hidden flex backdrop-blur-[0.5px]"
          >
            {/* Filled Level Background: Vertical for Weight, Horizontal for Volume */}
            {mode === "weight" ? (
              <div
                className="w-full self-end transition-all duration-500 ease-out relative"
                style={{
                  height: `${Math.min(percentage, 100)}%`,
                  backgroundColor: fillColor,
                  borderRadius: "2px",
                  boxShadow: `0 -2px 10px ${fillColor}70`,
                }}
              />
            ) : (
              <div
                className="h-full self-start transition-all duration-500 ease-out relative"
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: fillColor,
                  borderRadius: "2px",
                  boxShadow: `2px 0 10px ${fillColor}70`,
                }}
              />
            )}

            {/* Centered Big Label inside the Cargo Bay (Proportional sizing for van vs lorry) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-0.5 pointer-events-none">
              <div className="flex items-baseline gap-0.5 sm:gap-1 text-black dark:text-white font-extrabold select-none">
                <span
                  className={`font-bold uppercase tracking-tight opacity-90 ${
                    isVan ? "text-xs sm:text-sm" : "text-sm sm:text-base"
                  }`}
                >
                  {mode === "weight" ? "w" : "v"}
                </span>
                <span
                  className={`font-heading font-black tracking-tight leading-none ${
                    isVan ? "text-lg sm:text-2xl" : "text-3xl sm:text-4xl"
                  }`}
                >
                  {percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher Pill (Weight vs Volume) */}
      <div className="flex items-center justify-between w-full px-2 pt-1 border-t border-border/30 text-xs">
        <div className="flex items-center gap-1 bg-muted/80 p-0.5 rounded-lg border border-border/40">
          <button
            type="button"
            onClick={() => onToggleMode?.("weight")}
            className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
              mode === "weight"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Weight ({vehicle.weightPercentage}%)
          </button>
          <button
            type="button"
            onClick={() => onToggleMode?.("volume")}
            className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
              mode === "volume"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Volume ({vehicle.volumePercentage}%)
          </button>
        </div>

        {/* Numeric Breakdown */}
        <div className="text-[11px] font-medium text-muted-foreground tabular-nums">
          {mode === "weight" ? (
            <span>
              <strong className="text-foreground">
                {vehicle.weightKg.toLocaleString()}
              </strong>{" "}
              / {vehicle.maxWeightKg.toLocaleString()} kg
            </span>
          ) : (
            <span>
              <strong className="text-foreground">{vehicle.volumeCbm}</strong> /{" "}
              {vehicle.maxVolumeCbm} m³
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
