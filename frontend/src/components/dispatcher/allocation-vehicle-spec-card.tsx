import {
  IdentificationCardIcon,
  LockKeyIcon,
  ArrowsOutCardinalIcon,
  CubeIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import type { AllocationVehicleSpec } from "@/data/mock-allocation-details";

interface AllocationVehicleSpecCardProps {
  specs: AllocationVehicleSpec;
  className?: string;
}

export function AllocationVehicleSpecCard({
  specs,
  className,
}: AllocationVehicleSpecCardProps) {
  return (
    <Card
      className={`p-4 bg-card rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between min-w-0 ${
        className || ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-black text-lg text-foreground tracking-tight">
            Unit {specs.unitId}
          </h3>
          <p className="text-xs font-semibold text-primary mt-0.5">{specs.model}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-around text-xs mt-2.5">
        <div className="flex items-center justify-between py-1.5 border-b border-border/40">
          <div className="flex items-center gap-2 text-muted-foreground">
            <IdentificationCardIcon
              className="size-4 text-primary shrink-0"
              weight="regular"
            />
            <span>Registration</span>
          </div>
          <span className="font-bold text-foreground font-mono">{specs.regNumber}</span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-border/40">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LockKeyIcon className="size-4 text-primary shrink-0" weight="regular" />
            <span>Security Seal</span>
          </div>
          <span className="font-semibold text-primary font-mono">{specs.sealNumber}</span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-border/40">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowsOutCardinalIcon
              className="size-4 text-primary shrink-0"
              weight="regular"
            />
            <span>Max Payload</span>
          </div>
          <span className="font-semibold text-foreground">
            {specs.maxPayloadKg.toLocaleString()} kg
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CubeIcon className="size-4 text-primary shrink-0" weight="regular" />
            <span>Box Volume</span>
          </div>
          <span className="font-semibold text-foreground">
            {specs.boxVolumeCbm.toFixed(1)} m³
          </span>
        </div>
      </div>
    </Card>
  );
}
