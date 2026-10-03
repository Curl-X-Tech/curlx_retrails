import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

export const vehicleCardVariants = cva(
  "bg-card border border-border/80 shadow-xs rounded-2xl flex flex-col justify-between select-none hover:border-border hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden min-w-0 group",
  {
    variants: {
      variant: {
        default: "p-4",
        dispatcher: "p-4",
        loader: "p-3.5 sm:p-4 max-w-full",
        compact: "p-3",
      },
      selected: {
        true: "border-primary ring-2 ring-primary/20 bg-primary/[0.02] shadow-sm",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      selected: false,
    },
  }
);

export interface VehicleCardData {
  id: string;
  plateNumber: string;
  vehicleModel: string;
  vehicleCategory: "lorry" | "van" | "truck" | string;
  imageUrl: string;
  weightPercentage: number;
  volumePercentage: number;
  allocatedWeightKg: number;
  allocatedVolumeCbm: number;
  maxWeightKg?: number;
  maxVolumeCbm?: number;
  hubName: string;
  stopsCount: number;
  nextStopName: string;
  isColdChain?: boolean;
}

export interface SharedVehicleCardProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect">,
    VariantProps<typeof vehicleCardVariants> {
  vehicle: VehicleCardData;
  isSelected?: boolean;
  onSelect?: (vehicle: VehicleCardData) => void;
}
