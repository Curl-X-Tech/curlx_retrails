import * as React from "react";
import { Card } from "@/components/ui/card";
import { VehicleCargoVisualizer } from "@/components/shared";
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

  return (
    <Card
      className={`p-3 sm:p-4 bg-card rounded-2xl border border-border/80 shadow-xs flex flex-col justify-center min-w-0 ${
        className || ""
      }`}
    >
      <VehicleCargoVisualizer vehicle={allocation} mode={mode} onToggleMode={setMode} />
    </Card>
  );
}
