import * as React from "react";
import {
  MagnifyingGlassIcon,
  ArrowsClockwiseIcon,
  StorefrontIcon,
  FunnelIcon,
  BuildingIcon,
  TruckIcon,
  CaretUpDownIcon,
  CaretUpIcon,
  CaretDownIcon,
  ClockIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import {
  useMasterOutlets,
  useMasterBrands,
  useMasterDepots,
  useMasterDistricts,
  type MasterOutlet,
} from "@/hooks/use-master-data";
import { useAdminStore } from "@/stores/use-admin-store";

type SortKey =
  "outletId" | "name" | "brand" | "district" | "dock" | "constraint" | "window";

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

export function AdminOutletsPage() {
  const { selectedHub, setSelectedHub, selectedBrand, setSelectedBrand } =
    useAdminStore();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dockFilter, setDockFilter] = React.useState<string>("all");
  const [constraintFilter, setConstraintFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey | null>("outletId");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const pageSize = 15;

  const {
    data: outlets,
    isLoading: isOutletsLoading,
    refetch: refetchOutlets,
  } = useMasterOutlets();
  const { data: brands, isLoading: isBrandsLoading } = useMasterBrands();
  const { data: depots, isLoading: isDepotsLoading } = useMasterDepots();
  const { data: districts, isLoading: isDistrictsLoading } = useMasterDistricts();

  const isLoading =
    isOutletsLoading || isBrandsLoading || isDepotsLoading || isDistrictsLoading;

  const getBrandCode = React.useCallback(
    (brandId: string) => {
      const b = brands?.find((item) => item.id === brandId);
      return b ? b.code : "N/A";
    },
    [brands]
  );

  const getDepotCode = React.useCallback(
    (depotId: string) => {
      const d = depots?.find((item) => item.id === depotId);
      return d ? d.code : "N/A";
    },
    [depots]
  );

  const getDistrictName = React.useCallback(
    (districtId: string) => {
      const dist = districts?.find((item) => item.id === districtId);
      return dist ? dist.name : "Unknown";
    },
    [districts]
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const filteredOutlets = React.useMemo(() => {
    if (!outlets) return [];
    let list = outlets.filter((outlet) => {
      // Hub filter
      if (selectedHub !== "ALL") {
        const depotMatch = depots?.find((d) => d.code === selectedHub);
        if (depotMatch && outlet.depot_id !== depotMatch.id) return false;
      }
      // Brand filter
      if (selectedBrand !== "ALL") {
        const brandMatch = brands?.find((b) => b.code === selectedBrand);
        if (brandMatch && outlet.brand_id !== brandMatch.id) return false;
      }
      // Dock filter
      if (dockFilter !== "all" && outlet.dock_type !== dockFilter) {
        return false;
      }
      // Vehicle Constraint filter
      if (constraintFilter !== "all" && outlet.parking_constraint !== constraintFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = outlet.name.toLowerCase().includes(q);
        const matchesId = outlet.outlet_id.toLowerCase().includes(q);
        const matchesDistrict = getDistrictName(outlet.district_id)
          .toLowerCase()
          .includes(q);
        if (!matchesName && !matchesId && !matchesDistrict) return false;
      }
      return true;
    });

    if (sortKey) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortKey === "outletId") {
          cmp = a.outlet_id.localeCompare(b.outlet_id);
        } else if (sortKey === "name") {
          cmp = a.name.localeCompare(b.name);
        } else if (sortKey === "brand") {
          cmp = getBrandCode(a.brand_id).localeCompare(getBrandCode(b.brand_id));
        } else if (sortKey === "district") {
          cmp = getDistrictName(a.district_id).localeCompare(
            getDistrictName(b.district_id)
          );
        } else if (sortKey === "dock") {
          cmp = a.dock_type.localeCompare(b.dock_type);
        } else if (sortKey === "constraint") {
          cmp = (a.parking_constraint || "").localeCompare(b.parking_constraint || "");
        } else if (sortKey === "window") {
          cmp = a.window_open_time.localeCompare(b.window_open_time);
        }
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [
    outlets,
    depots,
    brands,
    selectedHub,
    selectedBrand,
    dockFilter,
    constraintFilter,
    searchQuery,
    sortKey,
    sortDirection,
    getBrandCode,
    getDistrictName,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredOutlets.length / pageSize));
  const paginatedOutlets = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOutlets.slice(start, start + pageSize);
  }, [filteredOutlets, currentPage, pageSize]);

  const vanOnlyCount = React.useMemo(() => {
    return outlets?.filter((o) => o.parking_constraint === "van_only").length ?? 0;
  }, [outlets]);

  const mallBayCount = React.useMemo(() => {
    return outlets?.filter((o) => o.dock_type === "mall_bay").length ?? 0;
  }, [outlets]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* 1. Header Bar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
            Retail Outlets Directory
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Store delivery windows, unloading dock configurations, and vehicle access
            limits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={() => refetchOutlets()}
          >
            <ArrowsClockwiseIcon className="size-3 text-muted-foreground" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Strip */}
      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <StorefrontIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Total Stores:</span>
          <span className="font-bold text-foreground text-[11px]">
            {outlets?.length ?? 0}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <TruckIcon className="size-3.5 text-amber-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Van-Only Access:</span>
          <span className="font-bold text-foreground text-[11px]">
            {vanOnlyCount} Outlets
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <BuildingIcon className="size-3.5 text-sky-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Mall Bays:</span>
          <span className="font-bold text-foreground text-[11px]">
            {mallBayCount} Outlets
          </span>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search outlet ID, store name, district..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-7 h-7 text-xs bg-card"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Hub Filter */}
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
              <span>Hub: {selectedHub === "ALL" ? "All Hubs" : selectedHub}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Filter Hub</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={selectedHub}
                onValueChange={(val) => {
                  setSelectedHub((val as "ALL" | "PEL" | "KDY") || "ALL");
                  setCurrentPage(1);
                }}
              >
                <DropdownMenuRadioItem value="ALL" className="text-xs">
                  All Hubs
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="PEL" className="text-xs">
                  Peliyagoda (PEL)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="KDY" className="text-xs">
                  Kandy (KDY)
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Brand Filter */}
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
              <span>Brand: {selectedBrand === "ALL" ? "All Brands" : selectedBrand}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Filter Brand</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={selectedBrand}
                onValueChange={(val) => {
                  setSelectedBrand((val as "ALL" | "FRESH" | "STYLE" | "TECH") || "ALL");
                  setCurrentPage(1);
                }}
              >
                <DropdownMenuRadioItem value="ALL" className="text-xs">
                  All Brands
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="FRESH" className="text-xs">
                  Fresh
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="STYLE" className="text-xs">
                  Style
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="TECH" className="text-xs">
                  Tech
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dock Filter */}
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
                Dock: {dockFilter === "all" ? "All Docks" : dockFilter.replace("_", " ")}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Filter Dock</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={dockFilter}
                onValueChange={(val) => {
                  setDockFilter(val ?? "all");
                  setCurrentPage(1);
                }}
              >
                <DropdownMenuRadioItem value="all" className="text-xs">
                  All Docks
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="rear_dock" className="text-xs">
                  Rear Dock
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="street" className="text-xs">
                  Street Unload
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="mall_bay" className="text-xs">
                  Mall Bay
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Vehicle Restriction Filter */}
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
                Access:{" "}
                {constraintFilter === "all"
                  ? "All Vehicles"
                  : constraintFilter.replace("_", " ")}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Access Constraint</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={constraintFilter}
                onValueChange={(val) => {
                  setConstraintFilter(val ?? "all");
                  setCurrentPage(1);
                }}
              >
                <DropdownMenuRadioItem value="all" className="text-xs">
                  All Vehicles
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="van_only" className="text-xs">
                  Van Only Access
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="none" className="text-xs">
                  Standard Access
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 4. Table Container */}
      <div className="flex-1 min-h-0 margin-responsive py-3 sm:py-4 overflow-hidden flex flex-col">
        {isLoading ? (
          <TableSkeleton columns={7} rowCount={8} />
        ) : filteredOutlets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <StorefrontIcon className="size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">
              No matching retail outlets found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              No store records match your current filter and search parameters.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-xs"
              onClick={() => {
                setSearchQuery("");
                setSelectedHub("ALL");
                setSelectedBrand("ALL");
                setDockFilter("all");
                setConstraintFilter("all");
                setCurrentPage(1);
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
            {/* Top Table Bar with Count & Top Pagination */}
            <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="text-muted-foreground text-[11px]">
                Showing{" "}
                <span className="font-bold text-foreground">
                  {filteredOutlets.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-foreground">
                  {Math.min(currentPage * pageSize, filteredOutlets.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-foreground">
                  {filteredOutlets.length}
                </span>{" "}
                outlets
              </div>

              {/* Standard Pagination Controls */}
              {totalPages > 1 && (
                <Pagination className="mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage <= 1}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
                      )
                      .map((page, idx, arr) => (
                        <React.Fragment key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <PaginationItem>
                              <span className="px-1 text-muted-foreground text-xs">
                                ...
                              </span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              isActive={currentPage === page}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage >= totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>

            <TooltipProvider delay={100}>
              <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <TableHeader className="sticky top-0 z-20 bg-card shadow-2xs border-b border-border/80">
                    <TableRow className="border-b border-border/80 hover:bg-transparent">
                      <TableHead
                        className="w-[180px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs pl-4"
                        onClick={() => handleSort("outletId")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Store ID & Name</span>
                          <SortHeaderIcon
                            active={sortKey === "outletId" || sortKey === "name"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[110px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("brand")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Brand</span>
                          <SortHeaderIcon
                            active={sortKey === "brand"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[160px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("district")}
                      >
                        <div className="flex items-center gap-1">
                          <span>District & Hub</span>
                          <SortHeaderIcon
                            active={sortKey === "district"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[120px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("dock")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Dock Type</span>
                          <SortHeaderIcon
                            active={sortKey === "dock"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[140px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("constraint")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Vehicle Restriction</span>
                          <SortHeaderIcon
                            active={sortKey === "constraint"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[130px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("window")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Delivery Window</span>
                          <SortHeaderIcon
                            active={sortKey === "window"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead className="w-[90px] text-right font-bold text-foreground text-xs pr-4">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedOutlets.map((outlet: MasterOutlet) => (
                      <TableRow
                        key={outlet.id}
                        className="border-border/30 hover:bg-muted/30 transition-colors text-xs"
                      >
                        <TableCell className="font-bold text-foreground py-2.5 pl-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <StorefrontIcon className="size-3.5 text-primary shrink-0" />
                            <div>
                              <div className="font-bold text-xs text-foreground">
                                {outlet.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {outlet.outlet_id}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-2.5 whitespace-nowrap">
                          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {getBrandCode(outlet.brand_id)}
                          </span>
                        </TableCell>

                        <TableCell className="py-2.5 whitespace-nowrap">
                          <div className="text-xs text-foreground font-semibold">
                            {getDistrictName(outlet.district_id)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Hub: {getDepotCode(outlet.depot_id)}
                          </div>
                        </TableCell>

                        <TableCell className="py-2.5 text-xs capitalize text-foreground whitespace-nowrap">
                          {outlet.dock_type === "mall_bay" ? (
                            <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold text-[11px]">
                              Mall Bay
                            </span>
                          ) : (
                            outlet.dock_type.replace("_", " ")
                          )}
                        </TableCell>

                        <TableCell className="py-2.5 whitespace-nowrap">
                          {outlet.parking_constraint === "van_only" ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase">
                              Van Only
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Standard
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="py-2.5 text-xs text-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <ClockIcon className="size-3 text-muted-foreground shrink-0" />
                            <span>
                              {outlet.window_open_time.slice(0, 5)} -{" "}
                              {outlet.window_close_time.slice(0, 5)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="pr-4 py-2.5 text-right whitespace-nowrap">
                          {outlet.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>
              </div>
            </TooltipProvider>

            {/* Bottom Pagination Bar */}
            <div className="px-4 py-2 bg-muted/20 border-t border-border/50 shrink-0 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">
                Page {currentPage} of {totalPages}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-6 text-[11px] px-2 cursor-pointer"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-6 text-[11px] px-2 cursor-pointer"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AdminOutletsPage;
