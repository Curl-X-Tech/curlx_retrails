import * as React from "react";
import {
  TruckIcon,
  MapPinIcon,
  SnowflakeIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import type { VehicleAllocation } from "@/data/mock-allocations";

interface AllocationVehicleCardProps {
  allocation: VehicleAllocation;
  onSelect?: (allocation: VehicleAllocation) => void;
  isSelected?: boolean;
  className?: string;
}

export function AllocationVehicleCard({
  allocation,
  onSelect,
  isSelected = false,
  className,
}: AllocationVehicleCardProps) {
  const [mode, setMode] = React.useState<"weight" | "volume">("weight");
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const activeIndex = mode === "weight" ? 0 : 1;
  const isVan = allocation.vehicleCategory === "van";

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

  const getFillColor = (pct: number) => {
    if (pct >= 90) return "#EF4444";
    if (pct >= 75) return "#F97316";
    return "#00E600";
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "weight" ? "volume" : "weight"));
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
    if (dragOffset < -35 && activeIndex === 0) {
      setMode("volume");
    } else if (dragOffset > 35 && activeIndex === 1) {
      setMode("weight");
    }
    setTouchStartX(null);
    setIsDragging(false);
    setDragOffset(0);
  };

  const renderVehicleSlide = (slideType: "weight" | "volume") => {
    const pct =
      slideType === "weight" ? allocation.weightPercentage : allocation.volumePercentage;
    const color = getFillColor(pct);

    return (
      <div className="w-1/2 min-w-[50%] max-w-[50%] shrink-0 flex items-center justify-center overflow-hidden h-32 select-none pointer-events-none">
        <div className="relative inline-block aspect-square h-32 max-h-full transform-gpu pointer-events-none">
          {/* Base Vehicle PNG Asset */}
          <img
            src={allocation.imageUrl}
            alt={allocation.code}
            className="w-full h-full object-contain drop-shadow-xs select-none pointer-events-none"
            draggable={false}
          />

          {/* Overlaid Cargo Container Bay Area */}
          <div
            style={{
              ...containerStyle,
              borderColor: color,
              borderWidth: "2px",
              borderStyle: "dashed",
              backgroundColor: `${color}18`,
              boxShadow: `0 0 8px ${color}30`,
            }}
            className="absolute overflow-hidden flex backdrop-blur-[0.5px]"
          >
            {/* Filled Level Background */}
            {slideType === "weight" ? (
              <div
                className="w-full self-end transition-all duration-500 ease-out relative"
                style={{
                  height: `${Math.min(pct, 100)}%`,
                  backgroundColor: color,
                  borderRadius: "1px",
                }}
              />
            ) : (
              <div
                className="h-full self-start transition-all duration-500 ease-out relative"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  backgroundColor: color,
                  borderRadius: "1px",
                }}
              />
            )}

            {/* Centered Label inside the Cargo Bay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-0.5 pointer-events-none">
              <span
                className={`font-heading tracking-tight leading-none text-black dark:text-white select-none ${
                  isVan
                    ? "text-xs sm:text-sm font-extrabold"
                    : "text-lg sm:text-xl font-black"
                }`}
              >
                {pct}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const nextStopName = allocation.assignedStops[0]?.name || "Destination Depot";

  const isColdChain =
    allocation.temperatureZone === "frozen" || allocation.temperatureZone === "chilled";

  return (
    <Card
      onClick={() => onSelect?.(allocation)}
      className={cn(
        "bg-card border border-border/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between select-none hover:border-border hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden min-w-0 group",
        isSelected && "border-primary ring-2 ring-primary/20 bg-primary/[0.02] shadow-sm",
        className
      )}
    >
      {/* 1. Header Section: # Plate + Cold Chain Icon, Vehicle Model & Action Icon Button */}
      <div className="flex items-start justify-between">
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(allocation);
          }}
          className="cursor-pointer min-w-0"
        >
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <h3 className="font-heading font-black text-base text-foreground tracking-tight group-hover:text-primary transition-colors shrink-0">
              # {allocation.plateNumber}
            </h3>
            {isColdChain && (
              <div className="size-5 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                <SnowflakeIcon weight="fill" className="size-3.5" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-medium mt-0.5 truncate max-w-[160px]">
            {allocation.vehicleModel}
          </p>
        </div>

        {/* Action Icon Button in Header */}
        <IconButton
          variant="ghost"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(allocation);
          }}
          className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          title="View Details"
        >
          <ArrowSquareOutIcon className="size-4" />
        </IconButton>
      </div>

      {/* 2. Swipable Vehicle Visualizer between Mass and Volume */}
      <div
        className="relative w-full max-w-full overflow-hidden my-2 min-w-0 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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
          {/* Slide 1: Mass / Weight */}
          {renderVehicleSlide("weight")}

          {/* Slide 2: Volume */}
          {renderVehicleSlide("volume")}
        </div>

        {/* Carousel Mode Dots & Arrow Switcher */}
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
              toggleMode();
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 bg-muted/60 hover:bg-muted rounded-full cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-1">
              <span
                className={`size-1.5 rounded-full transition-all duration-300 ${
                  mode === "weight" ? "bg-primary w-3" : "bg-muted-foreground/30"
                }`}
              />
              <span
                className={`size-1.5 rounded-full transition-all duration-300 ${
                  mode === "volume" ? "bg-primary w-3" : "bg-muted-foreground/30"
                }`}
              />
            </div>
            <span className="font-semibold text-[10px] text-muted-foreground">
              {mode === "weight"
                ? `${allocation.allocatedWeightKg.toLocaleString()} kg Mass`
                : `${allocation.allocatedVolumeCbm} m³ Volume`}
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

      <div className="pt-2 border-t border-border/50 space-y-1.5">
        <div className="flex items-center gap-2.5">
          <TruckIcon className="size-5 text-[#0070BA] shrink-0" weight="regular" />
          <span className="text-xs font-semibold text-foreground truncate">
            {allocation.hubName}
          </span>
        </div>

        <div className="flex items-center pl-[9px]">
          <div className="h-6 border-l-2 border-dashed border-border/80 flex items-center">
            <Badge className="bg-[#0070BA] hover:bg-[#0070BA] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full ml-3 shrink-0 shadow-xs">
              {allocation.assignedStops.length} Stops
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <MapPinIcon className="size-5 text-foreground shrink-0" weight="fill" />
          <span className="text-xs font-semibold text-foreground truncate">
            {nextStopName}
          </span>
        </div>
      </div>
    </Card>
  );
}
