import type { VehicleAllocation } from "@/types";
import { VehicleCard, type VehicleCardData } from "@/components/shared";

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
  const isColdChain =
    allocation.temperatureZone === "frozen" || allocation.temperatureZone === "chilled";

  const cardData: VehicleCardData = {
    id: allocation.id,
    plateNumber: allocation.plateNumber,
    vehicleModel: allocation.vehicleModel,
    vehicleCategory: allocation.vehicleCategory,
    imageUrl: allocation.imageUrl,
    weightPercentage: allocation.weightPercentage,
    volumePercentage: allocation.volumePercentage,
    allocatedWeightKg: allocation.allocatedWeightKg,
    allocatedVolumeCbm: allocation.allocatedVolumeCbm,
    maxWeightKg: allocation.maxWeightKg,
    maxVolumeCbm: allocation.maxVolumeCbm,
    hubName: allocation.hubName,
    stopsCount: allocation.assignedStops.length,
    nextStopName: allocation.assignedStops[0]?.name || "Destination Depot",
    isColdChain,
  };

  return (
    <VehicleCard
      vehicle={cardData}
      variant="dispatcher"
      isSelected={isSelected}
      onSelect={() => onSelect?.(allocation)}
      className={className}
    />
  );
}

export default AllocationVehicleCard;
