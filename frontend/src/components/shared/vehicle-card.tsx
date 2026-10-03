import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { VehicleCargoCanvas } from "./vehicle-cargo-canvas";
import { VehicleCardHeader } from "./vehicle-card-header";
import { VehicleCardFooter } from "./vehicle-card-footer";
import { useVehicleCardSlider } from "./use-vehicle-card-slider";
import {
  vehicleCardVariants,
  type VehicleCardData,
  type SharedVehicleCardProps,
} from "./vehicle-card-types";

export { vehicleCardVariants, type VehicleCardData, type SharedVehicleCardProps };

export function VehicleCard({
  vehicle,
  isSelected = false,
  onSelect,
  variant,
  className,
  ...props
}: SharedVehicleCardProps) {
  const { mode, setMode, activeIndex, isDragging, dragOffset, touchHandlers } =
    useVehicleCardSlider();
  const isVan = vehicle.vehicleCategory === "van";

  return (
    <Card
      onClick={() => onSelect?.(vehicle)}
      className={cn(vehicleCardVariants({ variant, selected: isSelected, className }))}
      {...props}
    >
      <VehicleCardHeader vehicle={vehicle} onSelect={onSelect} />

      <div
        className="relative w-full max-w-full overflow-hidden my-2 min-w-0 touch-pan-y"
        {...touchHandlers}
      >
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
            alt={vehicle.plateNumber}
            slideType="weight"
            percentage={vehicle.weightPercentage}
            isVan={isVan}
          />
          <VehicleCargoCanvas
            imageUrl={vehicle.imageUrl}
            alt={vehicle.plateNumber}
            slideType="volume"
            percentage={vehicle.volumePercentage}
            isVan={isVan}
          />
        </div>

        <div className="flex items-center justify-between px-1 -mt-0.5 text-[10px]">
          <IconButton
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              setMode("weight");
            }}
            className="size-5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
            title="Switch to Mass"
          >
            <CaretLeftIcon className="size-3" />
          </IconButton>

          <div
            onClick={(e) => {
              e.stopPropagation();
              setMode((prev) => (prev === "weight" ? "volume" : "weight"));
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 bg-muted/60 hover:bg-muted rounded-full cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-1">
              <span
                className={`size-1.5 rounded-full transition-all duration-300 ${mode === "weight" ? "bg-primary w-3" : "bg-muted-foreground/30"}`}
              />
              <span
                className={`size-1.5 rounded-full transition-all duration-300 ${mode === "volume" ? "bg-primary w-3" : "bg-muted-foreground/30"}`}
              />
            </div>
            <span className="font-semibold text-[10px] text-muted-foreground">
              {mode === "weight"
                ? `${vehicle.allocatedWeightKg.toLocaleString()} kg Mass`
                : `${vehicle.allocatedVolumeCbm} m³ Volume`}
            </span>
          </div>

          <IconButton
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              setMode("volume");
            }}
            className="size-5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
            title="Switch to Volume"
          >
            <CaretRightIcon className="size-3" />
          </IconButton>
        </div>
      </div>

      <VehicleCardFooter
        hubName={vehicle.hubName}
        stopsCount={vehicle.stopsCount}
        nextStopName={vehicle.nextStopName}
      />
    </Card>
  );
}
