import * as React from "react";

export function getFillColor(pct: number): string {
  if (pct >= 85) return "#EF4444";
  if (pct >= 60) return "#F97316";
  return "#00E600";
}

export function getVehicleContainerStyle(isVan: boolean): React.CSSProperties {
  return isVan
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
}

interface VehicleCargoCanvasProps {
  imageUrl: string;
  alt?: string;
  slideType: "weight" | "volume";
  percentage: number;
  isVan: boolean;
  containerHeightClass?: string;
}

export function VehicleCargoCanvas({
  imageUrl,
  alt = "Vehicle",
  slideType,
  percentage,
  isVan,
  containerHeightClass = "h-32",
}: VehicleCargoCanvasProps) {
  const color = getFillColor(percentage);
  const containerStyle = getVehicleContainerStyle(isVan);

  return (
    <div
      className={`w-1/2 min-w-[50%] max-w-[50%] shrink-0 flex items-center justify-center overflow-hidden ${containerHeightClass} select-none pointer-events-none`}
    >
      <div className="relative aspect-square h-full max-h-full max-w-full flex items-center justify-center transform-gpu pointer-events-none">
        <img
          src={
            imageUrl || (isVan ? "/vehicle-images/van.png" : "/vehicle-images/dry.png")
          }
          alt={alt}
          onError={(e) => {
            e.currentTarget.src = isVan
              ? "/vehicle-images/van.png"
              : "/vehicle-images/dry.png";
          }}
          className="w-full h-full object-contain drop-shadow-xs select-none pointer-events-none block"
          draggable={false}
        />
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
          {slideType === "weight" ? (
            <div
              className="w-full self-end transition-all duration-500 ease-out relative"
              style={{
                height: `${Math.min(percentage, 100)}%`,
                backgroundColor: color,
                borderRadius: "1px",
              }}
            />
          ) : (
            <div
              className="h-full self-start transition-all duration-500 ease-out relative"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: color,
                borderRadius: "1px",
              }}
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-0.5 pointer-events-none">
            <span
              className={`font-heading tracking-tight leading-none text-black dark:text-white select-none ${
                isVan
                  ? "text-xs sm:text-sm font-extrabold"
                  : "text-lg sm:text-xl font-black"
              }`}
            >
              {percentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
