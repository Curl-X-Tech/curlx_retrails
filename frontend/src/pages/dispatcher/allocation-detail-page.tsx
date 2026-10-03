import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PackageIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { AllocationDriverCard } from "@/components/dispatcher/allocation-driver-card";
import { AllocationVehicleSpecCard } from "@/components/dispatcher/allocation-vehicle-spec-card";
import { AllocationRouteMap } from "@/components/dispatcher/allocation-route-map";
import { AllocationPayloadCard } from "@/components/dispatcher/allocation-payload-card";
import { AllocationCargoList } from "@/components/dispatcher/allocation-cargo-list";
import {
  useAllocations,
  useAllocationManifest,
  AllocationSidebarList,
  type AllocationStatusTab,
  type VehicleAllocation,
} from "@/features/dispatcher";

interface AllocationDetailPageProps {
  initialAllocationId?: string;
  onSelectAllocation?: (allocation: VehicleAllocation) => void;
}

export function AllocationDetailPage({
  initialAllocationId,
  onSelectAllocation,
}: AllocationDetailPageProps = {}) {
  const { id: paramAllocId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allocations } = useAllocations();

  const selectedAllocationId =
    paramAllocId || initialAllocationId || allocations[0]?.id || "";
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<AllocationStatusTab>("active");
  const [isCargoListOpen, setIsCargoListOpen] = React.useState<boolean>(false);

  const selectedAllocation =
    allocations.find((a) => a.id === selectedAllocationId) || allocations[0];

  const currentManifest = useAllocationManifest(selectedAllocation?.id ?? "");

  const filteredAllocations = React.useMemo(() => {
    return allocations.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.routeName.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === "active") {
        matchesStatus = item.status === "dispatched" || item.status === "allocated";
      } else if (statusFilter === "loading") {
        matchesStatus = item.status === "loading";
      } else if (statusFilter === "idle") {
        matchesStatus = item.status === "delayed" || item.status === "completed";
      } else if (statusFilter === "break_down") {
        matchesStatus = false;
      }

      return matchesSearch && matchesStatus;
    });
  }, [allocations, searchQuery, statusFilter]);

  const handleSelect = (alloc: VehicleAllocation) => {
    onSelectAllocation?.(alloc);
    navigate(`/dispatcher/allocations/${alloc.id}`);
  };

  if (!selectedAllocation || !currentManifest) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Loading allocation
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-muted/20 font-sans">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        <AllocationSidebarList
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          allocations={filteredAllocations}
          selectedAllocationId={selectedAllocationId}
          onSearchChange={setSearchQuery}
          onStatusFilterChange={setStatusFilter}
          onSelectAllocation={handleSelect}
        />

        <div className="lg:col-span-8 xl:col-span-8 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {currentManifest.manifestCode}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Trip #{currentManifest.tripSequence}
                </span>
              </div>
              <h2 className="text-base font-heading font-black text-foreground mt-1">
                {selectedAllocation.routeName}
              </h2>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCargoListOpen(true)}
              className="text-xs font-semibold gap-1.5 cursor-pointer rounded-xl bg-card self-start sm:self-auto"
            >
              <PackageIcon className="size-3.5 text-primary" />
              <span>Inspect Cargo List ({currentManifest.cargoList.length})</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AllocationDriverCard driver={currentManifest.driver} />
            <AllocationVehicleSpecCard specs={currentManifest.specs} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AllocationPayloadCard allocation={selectedAllocation} className="h-full" />
            <AllocationRouteMap
              key={selectedAllocationId}
              waypoints={currentManifest.waypoints}
              vehiclePosition={currentManifest.vehiclePosition}
              vehicleUnitId={currentManifest.specs.unitId}
              vehicleModel={currentManifest.specs.model}
              driverName={currentManifest.driver.name}
              className="h-full min-h-[300px]"
            />
          </div>
        </div>
      </div>

      <AllocationCargoList
        open={isCargoListOpen}
        onOpenChange={setIsCargoListOpen}
        cargoList={currentManifest.cargoList}
        manifestCode={currentManifest.manifestCode}
      />
    </div>
  );
}

export default AllocationDetailPage;
