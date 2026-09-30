import * as React from "react";
import {
  MagnifyingGlassIcon,
  SquaresFourIcon,
  ListBulletsIcon,
  TruckIcon,
  FunnelIcon,
  ArrowSquareOutIcon,
  FileTextIcon,
  ArrowsClockwiseIcon,
  PackageIcon,
  ScalesIcon,
  CubeIcon,
  ChartPieIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  mockVehicleAllocations,
  mockAllocationKPIs,
  type VehicleAllocation,
} from "@/data/mock-allocations";
import { AllocationVehicleCard } from "@/components/dispatcher/allocation-vehicle-card";

export function AllocationSummaryPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

  // Filtered allocations
  const filteredAllocations = React.useMemo(() => {
    return mockVehicleAllocations.filter((alloc) => {
      const matchesSearch =
        alloc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alloc.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alloc.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alloc.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || alloc.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "van" && alloc.vehicleCategory === "van") ||
        (categoryFilter === "lorry" &&
          (alloc.vehicleCategory === "dry_lorry" ||
            alloc.vehicleCategory === "freeze_lorry"));

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchQuery, statusFilter, categoryFilter]);

  const getStatusBadge = (status: VehicleAllocation["status"]) => {
    switch (status) {
      case "dispatched":
        return (
          <Badge variant="default" className="text-[10px] h-5 px-2 font-semibold">
            Dispatched
          </Badge>
        );
      case "loading":
        return (
          <Badge variant="warning" className="text-[10px] h-5 px-2 font-semibold">
            Loading Bay
          </Badge>
        );
      case "allocated":
        return (
          <Badge variant="secondary" className="text-[10px] h-5 px-2 font-semibold">
            Allocated
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="success" className="text-[10px] h-5 px-2 font-semibold">
            Completed
          </Badge>
        );
      case "delayed":
        return (
          <Badge variant="destructive" className="text-[10px] h-5 px-2 font-semibold">
            Delayed
          </Badge>
        );
      default:
        return null;
    }
  };

  const getLoadProgressBarColor = (pct: number) => {
    if (pct >= 90) return "bg-red-500";
    if (pct >= 75) return "bg-orange-500";
    return "bg-emerald-500";
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* 1. Slim Header Bar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
            Allocation Summary
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Peliyagoda Depot | Dispatch Wave 1 (Morning Shift)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={() => {}}
          >
            <FileTextIcon className="size-3 text-muted-foreground" />
            <span>Export Manifest</span>
          </Button>
          <Button
            variant="default"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={() => {}}
          >
            <ArrowsClockwiseIcon className="size-3" />
            <span>Re-optimize</span>
          </Button>
        </div>
      </div>

      {/* 2. Compact Space-Saving KPI Metrics Strip */}
      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        {/* Vehicles */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <TruckIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Vehicles:</span>
          <span className="font-bold text-foreground text-[11px]">
            {mockAllocationKPIs.activeAllocations}/{mockAllocationKPIs.totalVehicles}
          </span>
        </div>

        {/* Crates */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <PackageIcon className="size-3.5 text-sky-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Crates:</span>
          <span className="font-bold text-foreground text-[11px]">
            {mockAllocationKPIs.totalCratesAllocated}
          </span>
        </div>

        {/* Weight */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Weight:</span>
          <span className="font-bold text-foreground text-[11px]">
            {(mockAllocationKPIs.totalWeightKg / 1000).toFixed(1)} t
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            ({mockAllocationKPIs.totalWeightKg.toLocaleString()} kg)
          </span>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Volume:</span>
          <span className="font-bold text-foreground text-[11px]">
            {mockAllocationKPIs.totalVolumeCbm} m³
          </span>
        </div>

        {/* Fleet Utilization */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <ChartPieIcon className="size-3.5 text-amber-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Avg Load:</span>
          <span className="font-bold text-primary text-[11px]">
            {mockAllocationKPIs.averageCapacityPercentage}%
          </span>
        </div>
      </div>

      {/* 3. Compact Filter and View Mode Toolbar */}
      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search vehicle, route, driver, plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-7 text-xs bg-card"
            />
          </div>
        </div>

        {/* Filter Dropdowns and View Toggle */}
        <div className="flex items-center gap-1.5">
          {/* Status Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="xs"
                  className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
                />
              }
            >
              <FunnelIcon className="size-3 text-muted-foreground" />
              <span className="capitalize">
                Status: {statusFilter === "all" ? "All" : statusFilter}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Filter Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val ?? "all")}
              >
                <DropdownMenuRadioItem value="all" className="text-xs">
                  All Statuses
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="allocated" className="text-xs">
                  Allocated
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="loading" className="text-xs">
                  Loading Bay
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dispatched" className="text-xs">
                  Dispatched
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Vehicle Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="xs"
                  className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
                />
              }
            >
              <TruckIcon className="size-3 text-muted-foreground" />
              <span className="capitalize">
                Type: {categoryFilter === "all" ? "All" : categoryFilter}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuLabel className="text-xs">Vehicle Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={categoryFilter}
                onValueChange={(val) => setCategoryFilter(val ?? "all")}
              >
                <DropdownMenuRadioItem value="all" className="text-xs">
                  All Types
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="lorry" className="text-xs">
                  Lorries (14ft / 16ft)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="van" className="text-xs">
                  Vans
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle Buttons (Grid vs Table) */}
          <div className="flex items-center border border-border/70 rounded-lg p-0.5 bg-card">
            <IconButton
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="xs"
              onClick={() => setViewMode("grid")}
              className="size-6 rounded-md cursor-pointer"
              title="Grid View"
            >
              <SquaresFourIcon className="size-3.5" />
            </IconButton>
            <IconButton
              variant={viewMode === "table" ? "default" : "ghost"}
              size="xs"
              onClick={() => setViewMode("table")}
              className="size-6 rounded-md cursor-pointer"
              title="Table View"
            >
              <ListBulletsIcon className="size-3.5" />
            </IconButton>
          </div>
        </div>
      </div>

      {/* 4. Main Content Area: Maximum Viewport Height for Cards */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {filteredAllocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <TruckIcon className="size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">
              No allocations found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              No vehicle allocations match your current search and filter criteria.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-xs"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View Layout matching user's reference mockup */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredAllocations.map((alloc) => (
              <AllocationVehicleCard
                key={alloc.id}
                allocation={alloc}
                onSelect={() => {}}
              />
            ))}
          </div>
        ) : (
          /* Table View Layout */
          <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[120px]">Vehicle</TableHead>
                  <TableHead className="w-[180px]">Route</TableHead>
                  <TableHead className="w-[140px]">Driver</TableHead>
                  <TableHead className="w-[90px] text-center">Crates</TableHead>
                  <TableHead className="w-[170px]">Weight Load</TableHead>
                  <TableHead className="w-[170px]">Volume Load</TableHead>
                  <TableHead className="w-[100px]">Departure</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[70px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAllocations.map((alloc) => {
                  const weightColor = getLoadProgressBarColor(alloc.weightPercentage);
                  const volumeColor = getLoadProgressBarColor(alloc.volumePercentage);

                  return (
                    <TableRow key={alloc.id} className="hover:bg-muted/30">
                      {/* Vehicle Code & Plate */}
                      <TableCell>
                        <div>
                          <span className="font-heading font-black text-xs text-foreground">
                            {alloc.code}
                          </span>
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                            {alloc.plateNumber}
                          </p>
                        </div>
                      </TableCell>

                      {/* Route & Stops */}
                      <TableCell>
                        <div>
                          <span className="font-medium text-xs text-foreground block truncate max-w-[170px]">
                            {alloc.routeName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {alloc.assignedStops.length} stops scheduled
                          </span>
                        </div>
                      </TableCell>

                      {/* Driver & Phone */}
                      <TableCell>
                        <div>
                          <span className="font-medium text-xs text-foreground block truncate">
                            {alloc.driverName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {alloc.driverPhone}
                          </span>
                        </div>
                      </TableCell>

                      {/* Crates Count */}
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-bold px-2 py-0.5"
                        >
                          {alloc.cratesAllocated}
                        </Badge>
                      </TableCell>

                      {/* Weight Progress & Figures */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="font-bold text-foreground">
                              {alloc.allocatedWeightKg.toLocaleString()} kg
                            </span>
                            <span className="text-muted-foreground font-semibold">
                              {alloc.weightPercentage}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${weightColor}`}
                              style={{
                                width: `${Math.min(alloc.weightPercentage, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Volume Progress & Figures */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="font-bold text-foreground">
                              {alloc.allocatedVolumeCbm} m³
                            </span>
                            <span className="text-muted-foreground font-semibold">
                              {alloc.volumePercentage}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${volumeColor}`}
                              style={{
                                width: `${Math.min(alloc.volumePercentage, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Departure */}
                      <TableCell>
                        <span className="text-xs font-medium text-foreground">
                          {alloc.departureTime}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusBadge(alloc.status)}</TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <IconButton
                          variant="ghost"
                          size="xs"
                          className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          title="View Details"
                        >
                          <ArrowSquareOutIcon className="size-3.5" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AllocationSummaryPage;
