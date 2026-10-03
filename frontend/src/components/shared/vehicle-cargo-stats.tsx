import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/icon-button";
import type { VehicleVisualizerData } from "./vehicle-cargo-visualizer";

interface VehicleCargoStatsProps {
  vehicle: VehicleVisualizerData;
  mode: "weight" | "volume";
  onToggleMode?: (mode: "weight" | "volume") => void;
  activeIndex: number;
  currentPercentage: number;
}

export function VehicleCargoStats({
  vehicle,
  mode,
  onToggleMode,
  activeIndex,
  currentPercentage,
}: VehicleCargoStatsProps) {
  const toggleMode = () => {
    onToggleMode?.(mode === "weight" ? "volume" : "weight");
  };

  return (
    <>
      <div className="flex items-center justify-between w-full px-2 pt-2 border-t border-border/40 text-xs">
        <IconButton
          variant="ghost"
          size="xs"
          onClick={() => onToggleMode?.("weight")}
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
          onClick={() => onToggleMode?.("volume")}
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
    </>
  );
}
