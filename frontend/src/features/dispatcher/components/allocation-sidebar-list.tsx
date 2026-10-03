import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  PauseCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllocationManifestCard } from "@/components/dispatcher/allocation-manifest-card";
import type { VehicleAllocation } from "../types";

export type AllocationStatusTab = "all" | "active" | "loading" | "idle" | "break_down";

interface AllocationSidebarListProps {
  searchQuery: string;
  statusFilter: AllocationStatusTab;
  allocations: VehicleAllocation[];
  selectedAllocationId: string;
  onSearchChange: (val: string) => void;
  onStatusFilterChange: (status: AllocationStatusTab) => void;
  onSelectAllocation: (alloc: VehicleAllocation) => void;
}

export function AllocationSidebarList({
  searchQuery,
  statusFilter,
  allocations,
  selectedAllocationId,
  onSearchChange,
  onStatusFilterChange,
  onSelectAllocation,
}: AllocationSidebarListProps) {
  return (
    <div className="lg:col-span-4 xl:col-span-4 border-r border-border/80 flex flex-col min-h-0 bg-card/30">
      <div className="p-3 pb-1 shrink-0 space-y-2.5">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search manifest entries..."
            className="pl-9 h-9 text-xs bg-background/80 rounded-xl"
          />
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={(val) => onStatusFilterChange(val as AllocationStatusTab)}
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

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {allocations.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No manifest vehicles match the filter criteria.
          </div>
        ) : (
          allocations.map((alloc) => (
            <AllocationManifestCard
              key={alloc.id}
              allocation={alloc}
              isSelected={alloc.id === selectedAllocationId}
              onSelect={onSelectAllocation}
            />
          ))
        )}
      </div>
    </div>
  );
}
