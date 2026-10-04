import * as React from "react";
import { VehicleCargoCanvas } from "./vehicle-cargo-canvas";
import { VehicleCargoStats } from "./vehicle-cargo-stats";

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
  size?: "compact" | "sm" | "md" | "lg";
}

export function VehicleCargoVisualizer({
  vehicle,
  mode,
  onToggleMode,
  size = "md",
}: VehicleCargoVisualizerProps) {
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const activeIndex = mode === "weight" ? 0 : 1;
  const isVan =
    vehicle.vehicleCategory === "van" ||
    Boolean(vehicle.imageUrl && vehicle.imageUrl.includes("van.png"));

  const sizeContainer = {
    compact: "h-32 sm:h-36 my-0.5",
    sm: "h-34 sm:h-38 my-0.5",
    md: "h-36 sm:h-44 my-1",
    lg: "h-40 sm:h-48 my-1",
  }[size];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const offset = e.touches[0].clientX - touchStartX;
    if ((activeIndex === 0 && offset > 0) || (activeIndex === 1 && offset < 0)) {
      setDragOffset(offset * 0.3);
    } else {
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    if (dragOffset < -40 && activeIndex === 0) onToggleMode?.("volume");
    else if (dragOffset > 40 && activeIndex === 1) onToggleMode?.("weight");
    setTouchStartX(null);
    setIsDragging(false);
    setDragOffset(0);
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
          <VehicleCargoCanvas
            imageUrl={vehicle.imageUrl}
            alt={vehicle.code}
            slideType="weight"
            percentage={vehicle.weightPercentage}
            isVan={isVan}
            containerHeightClass={sizeContainer}
          />
          <VehicleCargoCanvas
            imageUrl={vehicle.imageUrl}
            alt={vehicle.code}
            slideType="volume"
            percentage={vehicle.volumePercentage}
            isVan={isVan}
            containerHeightClass={sizeContainer}
          />
        </div>
      </div>

      <VehicleCargoStats
        vehicle={vehicle}
        mode={mode}
        onToggleMode={onToggleMode}
        activeIndex={activeIndex}
        currentPercentage={currentPercentage}
      />
    </div>
  );
}
