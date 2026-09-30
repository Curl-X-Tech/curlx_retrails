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
      className={`p-4 bg-card rounded-2xl border border-border/80 shadow-xs space-y-3 min-w-0 ${className || ""}`}
    >
      <div className="leading-tight">
        <h3 className="font-heading font-black text-lg text-foreground tracking-tight">
          {specs.unitId}
        </h3>
        <p className="text-xs font-semibold text-[#0070BA] mt-0.5">{specs.model}</p>
      </div>

      <div className="space-y-1.5 text-xs">
        {/* Reg */}
        <div className="flex items-center justify-between py-1 border-b border-border/40">
          <div className="flex items-center gap-2 text-muted-foreground">
            <IdentificationCardIcon
              className="size-4 text-[#0070BA] shrink-0"
              weight="regular"
            />
            <span>Reg</span>
          </div>
          <span className="font-mono font-bold text-foreground">{specs.regNumber}</span>
        </div>

        {/* Seal */}
        <div className="flex items-center justify-between py-1 border-b border-border/40">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LockKeyIcon className="size-4 text-[#0070BA] shrink-0" weight="regular" />
            <span>Seal</span>
          </div>
          <span className="font-mono font-semibold text-[#0070BA] hover:underline cursor-pointer">
            {specs.sealNumber}
          </span>
        </div>

        {/* Max Payload */}
        <div className="flex items-center justify-between py-1 border-b border-border/40">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowsOutCardinalIcon
              className="size-4 text-[#0070BA] shrink-0"
              weight="regular"
            />
            <span>Max. Payload</span>
          </div>
          <span className="font-mono font-semibold text-foreground">
            {specs.maxPayloadKg.toLocaleString()} kg
          </span>
        </div>

        {/* Box Volume */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CubeIcon className="size-4 text-[#0070BA] shrink-0" weight="regular" />
            <span>Box Volume</span>
          </div>
          <span className="font-mono font-semibold text-foreground">
            {specs.boxVolumeCbm.toFixed(1)} m³
          </span>
        </div>
      </div>
    </Card>
  );
}
