import * as React from "react";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  PauseCircleIcon,
  WarningCircleIcon,
  PackageIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllocationManifestCard } from "@/components/dispatcher/allocation-manifest-card";
import { AllocationDriverCard } from "@/components/dispatcher/allocation-driver-card";
import { AllocationVehicleSpecCard } from "@/components/dispatcher/allocation-vehicle-spec-card";
import { AllocationRouteMap } from "@/components/dispatcher/allocation-route-map";
import { AllocationPayloadCard } from "@/components/dispatcher/allocation-payload-card";
import { AllocationCargoList } from "@/components/dispatcher/allocation-cargo-list";
import { type VehicleAllocation, mockVehicleAllocations } from "@/data/mock-allocations";
import {
  type AllocationManifestDetail,
  mockAllocationManifests,
} from "@/data/mock-allocation-details";

type StatusFilter = "all" | "active" | "loading" | "idle" | "break_down";

interface AllocationDetailPageProps {
  initialAllocationId?: string;
  onSelectAllocation?: (allocation: VehicleAllocation) => void;
}

export function AllocationDetailPage({
  initialAllocationId,
  onSelectAllocation,
}: AllocationDetailPageProps) {
  const [allocations] = React.useState<VehicleAllocation[]>(mockVehicleAllocations);
  const [selectedAllocationId, setSelectedAllocationId] = React.useState<string>(
    initialAllocationId || mockVehicleAllocations[0]?.id || "alloc-01"
  );
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("active");
  const [isCargoListOpen, setIsCargoListOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (initialAllocationId) {
      setSelectedAllocationId(initialAllocationId);
    }
  }, [initialAllocationId]);

  const selectedAllocation =
    allocations.find((a) => a.id === selectedAllocationId) || allocations[0];

  // Retrieve or create manifest details for the selected allocation
  const currentManifest: AllocationManifestDetail = React.useMemo(() => {
    if (selectedAllocation && mockAllocationManifests[selectedAllocation.id]) {
      return mockAllocationManifests[selectedAllocation.id];
    }
    // Fallback dynamic manifest
    return {
      id: `mnf-${selectedAllocation.id}`,
      manifestCode: `MNF-${selectedAllocation.plateNumber.replace(/[^a-zA-Z0-9]/g, "")}`,
      allocationId: selectedAllocation.id,
      driver: {
        employeeCode: "DRV-301",
        name: selectedAllocation.driverName,
        email: "driver@curlx.tech",
        role: "driver",
        designation:
          selectedAllocation.vehicleCategory === "van"
            ? "Express Delivery Specialist"
            : "Heavy Commercial Pilot",
        licenseId: "DL-88291-WP-90",
        licenseClass: "Heavy Commercial (Class A)",
        licenseExpiryDate: "2028-11-15",
        bloodGroup: "O+",
        phone: selectedAllocation.driverPhone,
        avatarText: selectedAllocation.driverName
          .split(" ")
          .map((n) => n[0])
          .join(""),
      },
      specs: {
        unitId: selectedAllocation.code,
        model: selectedAllocation.vehicleModel,
        regNumber: selectedAllocation.plateNumber,
        sealNumber: "SL-80129-A",
        maxPayloadKg: selectedAllocation.maxWeightKg,
        boxVolumeCbm: selectedAllocation.maxVolumeCbm,
      },
      payloadKg: selectedAllocation.allocatedWeightKg,
      maxPayloadKg: selectedAllocation.maxWeightKg,
      payloadPercentage: selectedAllocation.weightPercentage,
      volumeCbm: selectedAllocation.allocatedVolumeCbm,
      maxVolumeCbm: selectedAllocation.maxVolumeCbm,
      volumePercentage: selectedAllocation.volumePercentage,
      vehiclePosition: {
        lat: 6.9482,
        lng: 79.872,
        heading: 190,
        speedKmH: 35,
        lastUpdated: "Live",
      },
      waypoints: [
        {
          seq: 1,
          name: `${selectedAllocation.hubName} (Origin)`,
          lat: 6.9654,
          lng: 79.9042,
          crates: 0,
          eta: selectedAllocation.departureTime,
          status: "completed",
        },
        ...selectedAllocation.assignedStops.map((stop, idx) => ({
          seq: idx + 2,
          name: stop.name,
          lat: 6.9366 + idx * 0.04,
          lng: 79.8454 + idx * 0.03,
          crates: stop.crates,
          eta: stop.deliveryWindow.split(" - ")[0],
          status: (idx === 0 ? "completed" : idx === 1 ? "upcoming" : "upcoming") as
            "completed" | "upcoming",
        })),
      ],
      cargoList: [
        {
          id: `cg-${selectedAllocation.id}-1`,
          code: `PKG${Math.floor(100000000 + Math.random() * 900000000)}-LK`,
          weightKg: Math.round(selectedAllocation.allocatedWeightKg * 0.35),
          store: "Store 1",
          stopSeq: 1,
          stopName: selectedAllocation.assignedStops[0]?.name || "Stop 1",
          destination: selectedAllocation.assignedStops[0]?.name || "Central Store",
          shc: selectedAllocation.temperatureZone === "frozen" ? "COL" : "GEN",
        },
        {
          id: `cg-${selectedAllocation.id}-2`,
          code: `PKG${Math.floor(100000000 + Math.random() * 900000000)}-LK`,
          weightKg: Math.round(selectedAllocation.allocatedWeightKg * 0.45),
          store: "Store 2",
          stopSeq: 2,
          stopName: selectedAllocation.assignedStops[1]?.name || "Stop 2",
          destination: selectedAllocation.assignedStops[1]?.name || "Retail Outlet",
          shc: "GEN",
        },
      ],
    };
  }, [selectedAllocation]);

  // Filter master list
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

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-muted/20 font-sans">
      {/* Main 2-Column Master-Detail Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Column: Master Manifest / Vehicle Allocations (lg:col-span-4 xl:col-span-4) */}
        <div className="lg:col-span-4 xl:col-span-4 border-r border-border/80 flex flex-col min-h-0 bg-card/30">
          {/* Search Bar & Status Tabs */}
          <div className="p-3 pb-1 shrink-0 space-y-2.5">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search manifest entries..."
                className="pl-9 h-9 text-xs bg-background/80 rounded-xl"
              />
            </div>

            {/* Status Tabs Bar with distinct icons and no extra separator */}
            <Tabs
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as StatusFilter)}
              className="w-full"
            >
              <TabsList
                variant="line"
                className="w-full justify-between !border-b-0 px-0.5 pt-1 pb-0 bg-transparent"
              >
                <TabsTrigger
                  value="active"
                  variant="line"
                  className="flex items-center gap-1.5 pb-2 text-xs font-semibold data-[state=active]:font-bold data-[state=active]:text-foreground data-[state=active]:border-foreground cursor-pointer px-1"
                >
                  <CheckCircleIcon className="size-3.5 shrink-0" weight="bold" />
                  <span>Active</span>
                </TabsTrigger>

                <TabsTrigger
                  value="loading"
                  variant="line"
                  className="flex items-center gap-1.5 pb-2 text-xs font-semibold data-[state=active]:font-bold data-[state=active]:text-foreground data-[state=active]:border-foreground cursor-pointer px-1"
                >
                  <ClockIcon className="size-3.5 shrink-0" weight="bold" />
                  <span>Loading</span>
                </TabsTrigger>

                <TabsTrigger
                  value="idle"
                  variant="line"
                  className="flex items-center gap-1.5 pb-2 text-xs font-semibold data-[state=active]:font-bold data-[state=active]:text-foreground data-[state=active]:border-foreground cursor-pointer px-1"
                >
                  <PauseCircleIcon className="size-3.5 shrink-0" weight="bold" />
                  <span>Idle</span>
                </TabsTrigger>

                <TabsTrigger
                  value="break_down"
                  variant="line"
                  className="flex items-center gap-1.5 pb-2 text-xs font-semibold data-[state=active]:font-bold data-[state=active]:text-foreground data-[state=active]:border-foreground cursor-pointer px-1"
                >
                  <WarningCircleIcon className="size-3.5 shrink-0" weight="bold" />
                  <span>Break Down</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Scrollable Vehicle Cards List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {filteredAllocations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No manifest vehicles match the filter criteria.
              </div>
            ) : (
              filteredAllocations.map((alloc) => (
                <AllocationManifestCard
                  key={alloc.id}
                  allocation={alloc}
                  isSelected={alloc.id === selectedAllocationId}
                  onSelect={(item) => {
                    setSelectedAllocationId(item.id);
                    onSelectAllocation?.(item);
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Detailed Workspace with Header & Exactly 4 Cards (lg:col-span-8 xl:col-span-8) */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3.5 relative">
          {/* Detail Workspace Header */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/60">
            <h2 className="font-heading font-black text-lg sm:text-xl text-foreground tracking-tight">
              {currentManifest.manifestCode}
            </h2>

            <Button
              variant="default"
              size="default"
              onClick={() => setIsCargoListOpen(true)}
              className="h-9.5 sm:h-10 px-4 sm:px-5 gap-2.5 text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
            >
              <PackageIcon className="size-4.5 shrink-0" weight="fill" />
              <span>Cargo Orders</span>
              <span className="px-2 py-0.5 rounded-md bg-primary-foreground/20 text-primary-foreground font-bold text-xs">
                {currentManifest.cargoList.length}
              </span>
            </Button>
          </div>

          {/* 4 Cards Grid - 2x2 Equal Rows on Tablet/Desktop filling available space */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 min-h-0 auto-rows-fr">
            {/* Card 1: Driver Profile */}
            <AllocationDriverCard
              driver={currentManifest.driver}
              className="h-full min-h-[260px] sm:min-h-[290px] flex flex-col justify-between"
            />

            {/* Card 2: Vehicle Specs */}
            <AllocationVehicleSpecCard
              specs={currentManifest.specs}
              className="h-full min-h-[260px] sm:min-h-[290px] flex flex-col justify-between"
            />

            {/* Card 3: Route Waypoint Map */}
            <AllocationRouteMap
              waypoints={currentManifest.waypoints}
              vehiclePosition={currentManifest.vehiclePosition}
              vehicleUnitId={currentManifest.specs.unitId}
              vehicleModel={selectedAllocation.vehicleModel}
              driverName={currentManifest.driver.name}
              className="h-full min-h-[260px] sm:min-h-[290px]"
            />

            {/* Card 4: Payload Visualizer */}
            <AllocationPayloadCard
              allocation={selectedAllocation}
              className="h-full min-h-[260px] sm:min-h-[290px] flex flex-col justify-between"
            />
          </div>

          {/* Cargo Orders Slide-Over Sheet */}
          <AllocationCargoList
            open={isCargoListOpen}
            onOpenChange={setIsCargoListOpen}
            cargoList={currentManifest.cargoList}
            manifestCode={currentManifest.manifestCode}
            unitId={currentManifest.specs.unitId}
          />
        </div>
      </div>
    </div>
  );
}
