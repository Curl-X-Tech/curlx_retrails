import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  SnowflakeIcon,
  CaretUpDownIcon,
  CaretUpIcon,
  CaretDownIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  mockVehicleAllocations,
  mockAllocationKPIs,
  type VehicleAllocation,
} from "@/data/mock-allocations";
import { AllocationVehicleCard } from "@/components/dispatcher/allocation-vehicle-card";

function CircularProgressRing({
  value,
  size = 22,
  strokeWidth = 3,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct >= 90) return "text-red-500";
    if (pct >= 75) return "text-orange-500";
    return "text-emerald-500";
  };

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform-gpu"
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted/60"
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-500 ease-out ${getColor(clamped)}`}
        />
      </svg>
    </div>
  );
}

function SortHeaderIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) {
  if (!active) {
    return (
      <CaretUpDownIcon className="size-3 text-muted-foreground/40 shrink-0 ml-0.5" />
    );
  }
  return direction === "asc" ? (
    <CaretUpIcon className="size-3 text-primary shrink-0 ml-0.5 font-bold" />
  ) : (
    <CaretDownIcon className="size-3 text-primary shrink-0 ml-0.5 font-bold" />
  );
}

type SortKey = "plateNumber" | "crates" | "weight" | "volume" | "departure" | "status";

interface AllocationSummaryPageProps {
  onSelectAllocation?: (allocation: VehicleAllocation) => void;
}

export function AllocationSummaryPage({
  onSelectAllocation,
}: AllocationSummaryPageProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get("search") || searchParams.get("q") || "";
  const viewMode = (searchParams.get("view") as "grid" | "table") || "grid";
  const statusFilter = searchParams.get("status") || "all";
  const categoryFilter = searchParams.get("category") || "all";
  const sortKey = (searchParams.get("sort") as SortKey) || null;
  const sortDirection = (searchParams.get("dir") as "asc" | "desc") || "asc";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 5;

  const updateQueryParams = React.useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, val]) => {
            if (
              val === null ||
              val === undefined ||
              val === "" ||
              val === "all" ||
              (key === "view" && val === "grid") ||
              (key === "page" && Number(val) <= 1)
            ) {
              next.delete(key);
            } else {
              next.set(key, String(val));
            }
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        updateQueryParams({ sort: key, dir: "desc" });
      } else {
        updateQueryParams({ sort: null, dir: null });
      }
    } else {
      updateQueryParams({ sort: key, dir: "asc" });
    }
  };

  const handleSelect = (alloc: VehicleAllocation) => {
    onSelectAllocation?.(alloc);
    navigate(`/dispatcher/allocations/${alloc.id}`);
  };

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

  // Sorted allocations
  const sortedAllocations = React.useMemo(() => {
    if (!sortKey) return filteredAllocations;

    return [...filteredAllocations].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "plateNumber":
          comparison = a.plateNumber.localeCompare(b.plateNumber);
          break;
        case "crates":
          comparison = a.cratesAllocated - b.cratesAllocated;
          break;
        case "weight":
          comparison = a.allocatedWeightKg - b.allocatedWeightKg;
          break;
        case "volume":
          comparison = a.allocatedVolumeCbm - b.allocatedVolumeCbm;
          break;
        case "departure":
          comparison = a.departureTime.localeCompare(b.departureTime);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredAllocations, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedAllocations.length / pageSize));

  const paginatedAllocations = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAllocations.slice(start, start + pageSize);
  }, [sortedAllocations, currentPage, pageSize]);

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
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

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <TruckIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Vehicles:</span>
          <span className="font-bold text-foreground text-[11px]">
            {mockAllocationKPIs.activeAllocations}/{mockAllocationKPIs.totalVehicles}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <PackageIcon className="size-3.5 text-sky-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Crates:</span>
          <span className="font-bold text-foreground text-[11px]">
            {mockAllocationKPIs.totalCratesAllocated}
          </span>
        </div>

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

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Volume:</span>
          <span className="font-bold text-foreground text-[11px]">
            {mockAllocationKPIs.totalVolumeCbm} m³
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <ChartPieIcon className="size-3.5 text-amber-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Avg Load:</span>
          <span className="font-bold text-primary text-[11px]">
            {mockAllocationKPIs.averageCapacityPercentage}%
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search vehicle, route, driver, plate..."
              value={searchQuery}
              onChange={(e) => updateQueryParams({ search: e.target.value, page: 1 })}
              className="pl-7 h-7 text-xs bg-card"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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
                onValueChange={(val) =>
                  updateQueryParams({ status: val ?? "all", page: 1 })
                }
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
                Type: {categoryFilter === "all" ? "All Types" : categoryFilter}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuLabel className="text-xs">Vehicle Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={categoryFilter}
                onValueChange={(val) =>
                  updateQueryParams({ category: val ?? "all", page: 1 })
                }
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

          <div className="flex items-center border border-border/70 rounded-lg p-0.5 bg-card">
            <IconButton
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="xs"
              onClick={() => updateQueryParams({ view: "grid" })}
              className="size-6 rounded-md cursor-pointer"
              title="Grid View"
            >
              <SquaresFourIcon className="size-3.5" />
            </IconButton>
            <IconButton
              variant={viewMode === "table" ? "default" : "ghost"}
              size="xs"
              onClick={() => updateQueryParams({ view: "table" })}
              className="size-6 rounded-md cursor-pointer"
              title="Table View"
            >
              <ListBulletsIcon className="size-3.5" />
            </IconButton>
          </div>
        </div>
      </div>

      <div
        className={`flex-1 min-h-0 p-4 sm:p-6 ${
          viewMode === "grid" ? "overflow-y-auto" : "overflow-hidden flex flex-col"
        }`}
      >
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
                updateQueryParams({
                  search: null,
                  status: null,
                  category: null,
                  page: 1,
                });
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedAllocations.map((alloc) => (
              <AllocationVehicleCard
                key={alloc.id}
                allocation={alloc}
                onSelect={(item) => handleSelect(item)}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
            {/* Top Table Bar with Item Count & Top Pagination */}
            <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="text-muted-foreground text-[11px]">
                Showing{" "}
                <span className="font-bold text-foreground">
                  {sortedAllocations.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-foreground">
                  {Math.min(currentPage * pageSize, sortedAllocations.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-foreground">
                  {sortedAllocations.length}
                </span>{" "}
                vehicles
              </div>

              {/* Standard shadcn Top Pagination Controls */}
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        updateQueryParams({ page: Math.max(currentPage - 1, 1) })
                      }
                      disabled={currentPage <= 1}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => updateQueryParams({ page })}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        updateQueryParams({ page: Math.min(currentPage + 1, totalPages) })
                      }
                      disabled={currentPage >= totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>

            <TooltipProvider delay={100}>
              <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <TableHeader className="sticky top-0 z-20 bg-card shadow-2xs border-b border-border/80">
                    <TableRow className="border-b border-border/80 hover:bg-transparent">
                      <TableHead
                        className="w-[130px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("plateNumber")}
                        title="Sort by Vehicle Plate"
                      >
                        <div className="flex items-center gap-1">
                          <span>Vehicle</span>
                          <SortHeaderIcon
                            active={sortKey === "plateNumber"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead className="w-[190px] font-bold text-foreground text-xs">
                        Route
                      </TableHead>
                      <TableHead className="w-[150px] font-bold text-foreground text-xs">
                        Driver
                      </TableHead>

                      <TableHead
                        className="w-[80px] text-center cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("crates")}
                        title="Sort by Crates"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Crates</span>
                          <SortHeaderIcon
                            active={sortKey === "crates"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[180px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("weight")}
                        title="Sort by Weight Load"
                      >
                        <div className="flex items-center gap-1">
                          <span>Weight Load</span>
                          <SortHeaderIcon
                            active={sortKey === "weight"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[180px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("volume")}
                        title="Sort by Volume Load"
                      >
                        <div className="flex items-center gap-1">
                          <span>Volume Load</span>
                          <SortHeaderIcon
                            active={sortKey === "volume"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[100px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("departure")}
                        title="Sort by Departure Time"
                      >
                        <div className="flex items-center gap-1">
                          <span>Departure</span>
                          <SortHeaderIcon
                            active={sortKey === "departure"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[100px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("status")}
                        title="Sort by Status"
                      >
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          <SortHeaderIcon
                            active={sortKey === "status"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead className="w-[60px] text-right font-bold text-foreground text-xs">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAllocations.map((alloc) => {
                      const isColdChain =
                        alloc.temperatureZone === "frozen" ||
                        alloc.temperatureZone === "chilled" ||
                        alloc.vehicleCategory === "freeze_lorry";

                      return (
                        <TableRow
                          key={alloc.id}
                          onClick={() => onSelectAllocation?.(alloc)}
                          className="hover:bg-muted/30 cursor-pointer border-border/30"
                        >
                          {/* Vehicle Code & Plate */}
                          <TableCell className="whitespace-nowrap relative">
                            {alloc.status === "delayed" ? (
                              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-destructive rounded-r" />
                            ) : alloc.status === "loading" ? (
                              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r" />
                            ) : alloc.status === "dispatched" ? (
                              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" />
                            ) : alloc.status === "completed" ? (
                              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-500 rounded-r" />
                            ) : null}
                            <div className="min-w-0 pl-1">
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className="font-heading font-black text-xs text-foreground shrink-0">
                                  # {alloc.plateNumber}
                                </span>
                                {isColdChain && (
                                  <Tooltip>
                                    <TooltipTrigger
                                      render={
                                        <div className="size-4 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 cursor-help">
                                          <SnowflakeIcon
                                            weight="fill"
                                            className="size-2.5"
                                          />
                                        </div>
                                      }
                                    />
                                    <TooltipContent>
                                      <span>
                                        Reefer Cold Chain Compartment (0°C to 4°C)
                                      </span>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground font-medium mt-0.5 truncate max-w-[130px]">
                                {alloc.vehicleModel}
                              </p>
                            </div>
                          </TableCell>

                          {/* Route & Stops */}
                          <TableCell>
                            <div>
                              <span className="font-medium text-xs text-foreground block truncate max-w-[180px]">
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

                          {/* Weight Load with Circular Progress Ring */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <CircularProgressRing
                                value={alloc.weightPercentage}
                                size={22}
                                strokeWidth={3}
                              />
                              <div>
                                <span className="font-bold text-xs text-foreground block leading-tight">
                                  {alloc.allocatedWeightKg.toLocaleString()} kg
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium block">
                                  {alloc.weightPercentage}% of{" "}
                                  {alloc.maxWeightKg.toLocaleString()} kg
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Volume Load with Circular Progress Ring */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <CircularProgressRing
                                value={alloc.volumePercentage}
                                size={22}
                                strokeWidth={3}
                              />
                              <div>
                                <span className="font-bold text-xs text-foreground block leading-tight">
                                  {alloc.allocatedVolumeCbm} m³
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium block">
                                  {alloc.volumePercentage}% of {alloc.maxVolumeCbm} m³
                                </span>
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

                          {/* Action */}
                          <TableCell className="text-right">
                            <IconButton
                              variant="ghost"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(alloc);
                              }}
                              className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                              title="View Details"
                            >
                              <ArrowSquareOutIcon className="size-3.5" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </table>
              </div>
            </TooltipProvider>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AllocationSummaryPage;
