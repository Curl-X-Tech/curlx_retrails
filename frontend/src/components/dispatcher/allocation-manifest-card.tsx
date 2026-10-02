import type { VehicleAllocation } from "@/data/mock-allocations";
import { ManifestVehicleCard, type ManifestVehicleCardData } from "@/components/shared";

interface AllocationManifestCardProps {
  allocation: VehicleAllocation;
  isSelected?: boolean;
  onSelect?: (allocation: VehicleAllocation) => void;
  className?: string;
}

export function AllocationManifestCard({
  allocation,
  isSelected = false,
  onSelect,
  className,
}: AllocationManifestCardProps) {
  const isColdChain =
    allocation.temperatureZone === "frozen" ||
    allocation.temperatureZone === "chilled" ||
    allocation.vehicleCategory === "freeze_lorry";

  const nextStopName = allocation.assignedStops[0]?.name || "Waypoint Fresh Wattala";

  const cardData: ManifestVehicleCardData = {
    id: allocation.id,
    plateNumber: allocation.plateNumber,
    vehicleModel: allocation.vehicleModel,
    imageUrl: allocation.imageUrl,
    hubName: allocation.hubName,
    stopsCount: allocation.assignedStops.length,
    nextStopName,
    isColdChain,
  };

  return (
    <ManifestVehicleCard
      vehicle={cardData}
      variant="dispatcher"
      isSelected={isSelected}
      onSelect={() => onSelect?.(allocation)}
      className={className}
    />
  );
}

export default AllocationManifestCard;
