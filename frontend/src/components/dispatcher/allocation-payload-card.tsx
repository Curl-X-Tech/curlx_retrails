import * as React from "react";
import { Card } from "@/components/ui/card";
import type { VehicleAllocation } from "@/data/mock-allocations";

interface AllocationPayloadCardProps {
  allocation: VehicleAllocation;
  className?: string;
}

export function AllocationPayloadCard({
  allocation,
  className,
}: AllocationPayloadCardProps) {
  const [mode, setMode] = React.useState<"weight" | "volume">("weight");

  const isVan = allocation.vehicleCategory === "van";
  const pct =
    mode === "weight" ? allocation.weightPercentage : allocation.volumePercentage;

  // Exact Photoshop Coordinates based on 2048x2048 image canvas:
  // Lorries: x: 740px (36.13%), y: 575px (28.08%), w: 1150px (56.15%), h: 677px (33.06%)
  // Van:     x: 1083px (52.88%), y: 646px (31.54%), w: 711px (34.72%), h: 501px (24.46%)
  const containerStyle: React.CSSProperties = isVan
    ? {
        left: `${(1083 / 2048) * 100}%`,
        top: `${(646 / 2048) * 100}%`,
        width: `${(711 / 2048) * 100}%`,
        height: `${(501 / 2048) * 100}%`,
        borderRadius: "3px",
      }
    : {
        left: `${(740 / 2048) * 100}%`,
        top: `${(575 / 2048) * 100}%`,
        width: `${(1150 / 2048) * 100}%`,
        height: `${(677 / 2048) * 100}%`,
        borderRadius: "3px",
      };

  // Status/Load-driven fill color (vibrant red/coral matching mockup)
  const getFillColor = (percentage: number) => {
    if (percentage >= 80) return "#EF4444"; // Vivid Red (matches mockup)
    if (percentage >= 60) return "#F97316"; // Orange
    return "#00E600"; // Bright Green
  };

  const fillColor = getFillColor(pct);

  return (
    <Card
      className={`p-4 bg-card rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between h-[230px] sm:h-[260px] min-w-0 ${
        className || ""
      }`}
    >
      {/* Title & Mode Switcher */}
      <div className="flex items-center justify-between">
        <h4 className="font-heading font-bold text-sm sm:text-base text-foreground">
          {mode === "weight" ? "Payload (Kg)" : "Volume (m³)"}
        </h4>
        <div className="flex items-center bg-muted/60 rounded-lg p-0.5 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setMode("weight")}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
              mode === "weight"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Weight
          </button>
          <button
            type="button"
            onClick={() => setMode("volume")}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
              mode === "volume"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Volume
          </button>
        </div>
      </div>

      {/* Vehicle Visual Graphic with Cargo Fill */}
      <div className="relative flex items-center justify-center h-32 sm:h-36 overflow-hidden my-auto select-none pointer-events-none">
        <div className="relative inline-block aspect-square h-32 sm:h-36 max-h-full transform-gpu">
          {/* Base Vehicle Asset */}
          <img
            src={allocation.imageUrl}
            alt={allocation.plateNumber}
            className="w-full h-full object-contain pointer-events-none"
            loading="lazy"
          />

          {/* Cargo Container Fill Boundary Box */}
          <div
            className="absolute overflow-hidden flex flex-col justify-end border border-neutral-700/30"
            style={containerStyle}
          >
            {/* Dynamic Fill Area */}
            {mode === "weight" ? (
              <div
                className="w-full relative flex items-center justify-center transition-all duration-500 ease-out"
                style={{
                  height: `${Math.min(100, Math.max(0, pct))}%`,
                  backgroundColor: fillColor,
                }}
              >
                <span className="text-white font-mono text-[11px] sm:text-xs font-black tracking-tight drop-shadow-md select-none">
                  w{pct}%
                </span>
              </div>
            ) : (
              <div
                className="h-full relative flex items-center justify-center transition-all duration-500 ease-out self-start"
                style={{
                  width: `${Math.min(100, Math.max(0, pct))}%`,
                  backgroundColor: fillColor,
                }}
              >
                <span className="text-white font-mono text-[11px] sm:text-xs font-black tracking-tight drop-shadow-md select-none">
                  v{pct}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Capacity Numeric Readout at bottom (matching mockup) */}
      <div className="text-center">
        <span className="font-heading font-black text-base sm:text-lg text-foreground tracking-tight">
          {mode === "weight"
            ? `${allocation.allocatedWeightKg.toLocaleString()} / ${allocation.maxWeightKg.toLocaleString()} kg`
            : `${allocation.allocatedVolumeCbm.toFixed(1)} / ${allocation.maxVolumeCbm.toFixed(1)} m³`}
        </span>
      </div>
    </Card>
  );
}
