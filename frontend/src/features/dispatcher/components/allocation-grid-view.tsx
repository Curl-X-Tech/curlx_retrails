import { AllocationVehicleCard } from "@/components/dispatcher/allocation-vehicle-card";
import type { VehicleAllocation } from "../types";

interface AllocationGridViewProps {
  allocations: VehicleAllocation[];
  onSelectAllocation: (alloc: VehicleAllocation) => void;
}

export function AllocationGridView({
  allocations,
  onSelectAllocation,
}: AllocationGridViewProps) {
  return (
    <div className="grid grid-cols-1 phone:grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4 wide:grid-cols-5 gutter-responsive">
      {allocations.map((alloc) => (
        <AllocationVehicleCard
          key={alloc.id}
          allocation={alloc}
          onSelect={onSelectAllocation}
        />
      ))}
    </div>
  );
}
