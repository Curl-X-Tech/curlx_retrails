import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { TruckIcon, MapPinIcon, SnowflakeIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const manifestVehicleCardVariants = cva(
  "relative bg-card rounded-2xl p-4 overflow-hidden select-none cursor-pointer transition-all duration-150 min-h-[160px] flex flex-col justify-between group",
  {
    variants: {
      variant: {
        default: "border border-border/80 hover:border-border hover:shadow-xs",
        loader: "border border-border/80 hover:border-border hover:shadow-xs",
        dispatcher: "border border-border/80 hover:border-border hover:shadow-xs",
      },
      selected: {
        true: "border-2 border-primary ring-2 ring-primary/20 shadow-md bg-card",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      selected: false,
    },
  }
);

export interface ManifestVehicleCardData {
  id: string;
  plateNumber: string;
  vehicleModel: string;
  imageUrl: string;
  hubName: string;
  stopsCount: number;
  nextStopName: string;
  isColdChain?: boolean;
}

export interface ManifestVehicleCardProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect">,
    VariantProps<typeof manifestVehicleCardVariants> {
  vehicle: ManifestVehicleCardData;
  isSelected?: boolean;
  onSelect?: (vehicle: ManifestVehicleCardData) => void;
}

export function ManifestVehicleCard({
  vehicle,
  isSelected = false,
  onSelect,
  variant,
  className,
  ...props
}: ManifestVehicleCardProps) {
  return (
    <Card
      onClick={() => onSelect?.(vehicle)}
      className={cn(
        manifestVehicleCardVariants({
          variant,
          selected: isSelected,
          className,
        })
      )}
      {...props}
    >
      {/* 3D Realistic Vehicle Image Positioned on Right */}
      <div className="absolute -right-24 sm:-right-28 top-1/2 -translate-y-1/2 w-64 sm:w-72 h-44 sm:h-48 pointer-events-none flex items-center justify-center select-none overflow-visible">
        <img
          src={vehicle.imageUrl}
          alt={vehicle.plateNumber}
          className="h-full w-full object-contain scale-125 transform translate-x-10 drop-shadow-md select-none pointer-events-none"
          loading="lazy"
        />
      </div>

      {/* Left Info Details */}
      <div className="relative z-10 max-w-[60%] sm:max-w-[64%] space-y-3">
        <div className="leading-tight">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight">
              # {vehicle.plateNumber}
            </span>
            {vehicle.isColdChain && (
              <div className="size-4 rounded-full bg-[#0070BA] flex items-center justify-center text-white shrink-0 shadow-xs">
                <SnowflakeIcon weight="bold" className="size-2.5" />
              </div>
            )}
          </div>
          <p className="text-xs font-semibold text-foreground/80 mt-0.5 truncate">
            {vehicle.vehicleModel}
          </p>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <TruckIcon className="size-4 text-[#0070BA] shrink-0" weight="regular" />
            <span className="font-medium text-foreground truncate text-[11px] sm:text-xs">
              {vehicle.hubName}
            </span>
          </div>

          <div className="flex items-center pl-[7px]">
            <div className="h-6 sm:h-7 border-l-2 border-dashed border-border/80 flex items-center">
              <Badge className="bg-[#0070BA] hover:bg-[#0070BA] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full ml-3 shrink-0 shadow-xs">
                {vehicle.stopsCount} Stops
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPinIcon className="size-4 text-foreground shrink-0" weight="fill" />
            <span className="font-medium text-foreground truncate text-[11px] sm:text-xs">
              {vehicle.nextStopName}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
