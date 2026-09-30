import * as React from "react";
import {
  MagnifyingGlassIcon,
  SquaresFourIcon,
  ListBulletsIcon,
  FunnelIcon,
  FileTextIcon,
  PackageIcon,
  ScalesIcon,
  CubeIcon,
  CurrencyDollarIcon,
  WarningOctagonIcon,
  StorefrontIcon,
  ArrowSquareOutIcon,
  SnowflakeIcon,
  SunIcon,
  CaretUpDownIcon,
  CaretUpIcon,
  CaretDownIcon,
  TruckIcon,
  MapPinIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  mockQueuedOrders,
  getStoreGroupedOrders,
  computeOrderQueueKPIs,
} from "@/data/mock-orders";
import type { QueuedOrder } from "@/types";
import { OrderDetailSheet } from "@/components/dispatcher/order-detail-sheet";
import { OrderCard } from "@/components/dispatcher/order-card";

type ViewMode = "table" | "grid";
type SortKey = "orderRef" | "outlet" | "weight" | "volume" | "value" | "window";

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

interface OrderQueuePageProps {
  onNavigateToAllocation?: () => void;
}

export function OrderQueuePage({ onNavigateToAllocation }: OrderQueuePageProps = {}) {
  const [orders] = React.useState<QueuedOrder[]>(mockQueuedOrders);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("table");
  const [groupByStore, setGroupByStore] = React.useState<boolean>(true);
  const [brandFilter, setBrandFilter] = React.useState<string>("all");
  const [tempFilter, setTempFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [dockFilter, setDockFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [selectedOrder, setSelectedOrder] = React.useState<QueuedOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(1);

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
  };

  const filteredOrders = React.useMemo(() => {
    return orders.filter((ord) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        ord.orderRef.toLowerCase().includes(q) ||
        ord.outletName.toLowerCase().includes(q) ||
        ord.outletId.toLowerCase().includes(q) ||
        ord.outletAddress.toLowerCase().includes(q) ||
        ord.items.some(
          (i) =>
            i.itemName.toLowerCase().includes(q) ||
            i.packageCode.toLowerCase().includes(q) ||
            i.itemId.toLowerCase().includes(q)
        );

      const matchesBrand = brandFilter === "all" || ord.brand === brandFilter;
      const matchesTemp = tempFilter === "all" || ord.tempRequirement === tempFilter;

      let matchesStatus = true;
      if (statusFilter === "urgent") matchesStatus = ord.isUrgent;
      else if (statusFilter === "deferred") matchesStatus = ord.deferredYesterday === 1;

      const matchesDock = dockFilter === "all" || ord.dockType === dockFilter;

      return matchesSearch && matchesBrand && matchesTemp && matchesStatus && matchesDock;
    });
  }, [orders, searchQuery, brandFilter, tempFilter, statusFilter, dockFilter]);

  const sortedOrders = React.useMemo(() => {
    if (!sortKey) return filteredOrders;

    return [...filteredOrders].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "orderRef":
          cmp = a.orderRef.localeCompare(b.orderRef);
          break;
        case "outlet":
          cmp = a.outletName.localeCompare(b.outletName);
          break;
        case "weight":
          cmp = a.totalWeightKg - b.totalWeightKg;
          break;
        case "volume":
          cmp = a.totalVolumeM3 - b.totalVolumeM3;
          break;
        case "value":
          cmp = a.totalOrderValueLkr - b.totalOrderValueLkr;
          break;
        case "window":
          cmp = a.deliveryWindow.localeCompare(b.deliveryWindow);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filteredOrders, sortKey, sortDirection]);

  const storeGroups = React.useMemo(() => {
    return getStoreGroupedOrders(filteredOrders);
  }, [filteredOrders]);

  const kpis = React.useMemo(() => {
    return computeOrderQueueKPIs(filteredOrders);
  }, [filteredOrders]);

  const gridPageSize = 8;
  const groupPageSize = 4;
  const flatPageSize = 10;

  const totalPages = React.useMemo(() => {
    if (viewMode === "grid") {
      return Math.max(1, Math.ceil(sortedOrders.length / gridPageSize));
    }
    if (groupByStore) {
      return Math.max(1, Math.ceil(storeGroups.length / groupPageSize));
    }
    return Math.max(1, Math.ceil(sortedOrders.length / flatPageSize));
  }, [viewMode, groupByStore, sortedOrders.length, storeGroups.length]);

  const paginatedGridOrders = React.useMemo(() => {
    const start = (currentPage - 1) * gridPageSize;
    return sortedOrders.slice(start, start + gridPageSize);
  }, [sortedOrders, currentPage]);

  const paginatedStoreGroups = React.useMemo(() => {
    const start = (currentPage - 1) * groupPageSize;
    return storeGroups.slice(start, start + groupPageSize);
  }, [storeGroups, currentPage]);

  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * flatPageSize;
    return sortedOrders.slice(start, start + flatPageSize);
  }, [sortedOrders, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    viewMode,
    groupByStore,
    searchQuery,
    brandFilter,
    tempFilter,
    statusFilter,
    dockFilter,
    sortKey,
    sortDirection,
  ]);

  const handleOpenDetail = (order: QueuedOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleExportOrders = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(filteredOrders, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `order_queue_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
            Order Queue
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Peliyagoda Depot • Western Province Delivery Planning (4:00 PM Order Cutoff)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={handleExportOrders}
          >
            <FileTextIcon className="size-3 text-muted-foreground" />
            <span>Export Orders</span>
          </Button>

          {onNavigateToAllocation && (
            <Button
              variant="default"
              size="xs"
              className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
              onClick={onNavigateToAllocation}
            >
              <TruckIcon className="size-3" />
              <span>Proceed to Allocation</span>
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-3 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <PackageIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Orders:</span>
          <span className="font-bold text-foreground text-[11px]">
            {kpis.totalOrders}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <StorefrontIcon className="size-3.5 text-sky-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Outlets:</span>
          <span className="font-bold text-foreground text-[11px]">
            {kpis.totalStores}
          </span>
        </div>

        {kpis.deferredYesterdayOrders > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg shadow-2xs">
            <WarningOctagonIcon
              className="size-3.5 text-rose-600 shrink-0"
              weight="bold"
            />
            <span className="text-rose-700 dark:text-rose-300 text-[11px] font-bold">
              Yesterday Skips:
            </span>
            <span className="font-black text-rose-700 dark:text-rose-300 text-[11px]">
              {kpis.deferredYesterdayOrders}
            </span>
          </div>
        )}

        {kpis.urgentOrders > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg shadow-2xs">
            <span className="text-amber-700 dark:text-amber-300 text-[11px] font-bold">
              Urgent:
            </span>
            <span className="font-black text-amber-700 dark:text-amber-300 text-[11px]">
              {kpis.urgentOrders}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Weight:</span>
          <span className="font-bold text-foreground text-[11px]">
            {(kpis.totalWeightKg / 1000).toFixed(1)} t
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            ({kpis.totalWeightKg.toLocaleString()} kg)
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Volume:</span>
          <span className="font-bold text-foreground text-[11px]">
            {kpis.totalVolumeCbm} m³
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <CurrencyDollarIcon className="size-3.5 text-amber-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Total Value:</span>
          <span className="font-bold text-foreground text-[11px]">
            LKR {kpis.totalValueLkr.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search order ref, outlet, SKU, package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-7 text-xs bg-card"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
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
              <StorefrontIcon className="size-3 text-muted-foreground" />
              <span className="capitalize">
                Brand: {brandFilter === "all" ? "All Brands" : brandFilter}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Filter Brand</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={brandFilter}
                onValueChange={(val) => setBrandFilter(val ?? "all")}
              >
                <DropdownMenuRadioItem value="all" className="text-xs">
                  All Brands
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Fresh" className="text-xs">
                  Waypoint Fresh
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Style" className="text-xs">
                  Waypoint Style
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Tech" className="text-xs">
                  Waypoint Tech
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
              <SnowflakeIcon className="size-3 text-muted-foreground" />
              <span className="capitalize">
                Temp: {tempFilter === "all" ? "All Zones" : tempFilter}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuLabel className="text-xs">Temperature</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={tempFilter}
                onValueChange={(val) => setTempFilter(val ?? "all")}
              >
                <DropdownMenuRadioItem value="all" className="text-xs">
                  All Zones
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="chilled" className="text-xs">
                  Chilled
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ambient" className="text-xs">
                  Ambient
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
              <FunnelIcon className="size-3 text-muted-foreground" />
              <span className="capitalize">
                Status: {statusFilter === "all" ? "All Statuses" : statusFilter}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs">Priority & Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val ?? "all")}
              >
                <DropdownMenuRadioItem value="all" className="text-xs">
                  All Statuses
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="urgent" className="text-xs">
                  Urgent Only
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="deferred" className="text-xs">
                  Deferred Yesterday
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {viewMode === "table" && (
            <Button
              variant={groupByStore ? "default" : "outline"}
              size="xs"
              onClick={() => setGroupByStore(!groupByStore)}
              className="h-7 px-2.5 text-[11px] font-semibold cursor-pointer rounded-lg"
            >
              <MapPinIcon className="size-3 mr-1" />
              Group by Store
            </Button>
          )}

          <div className="flex items-center border border-border/70 rounded-lg p-0.5 bg-card">
            <IconButton
              variant={viewMode === "table" ? "default" : "ghost"}
              size="xs"
              onClick={() => setViewMode("table")}
              className="size-6 rounded-md cursor-pointer"
              title="Table View"
            >
              <ListBulletsIcon className="size-3.5" />
            </IconButton>

            <IconButton
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="xs"
              onClick={() => setViewMode("grid")}
              className="size-6 rounded-md cursor-pointer"
              title="Card Grid View"
            >
              <SquaresFourIcon className="size-3.5" />
            </IconButton>
          </div>
        </div>
      </div>

      <div
        className={`flex-1 min-h-0 p-4 sm:p-6 ${
          viewMode === "grid" ? "overflow-y-auto" : "overflow-hidden flex flex-col"
        }`}
      >
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PackageIcon className="size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">
              No queued orders found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              No customer store orders match your current filter and search parameters.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-xs"
              onClick={() => {
                setSearchQuery("");
                setBrandFilter("all");
                setTempFilter("all");
                setStatusFilter("all");
                setDockFilter("all");
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedGridOrders.map((order) => (
                <OrderCard key={order.id} order={order} onSelect={handleOpenDetail} />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs">
              <span className="text-muted-foreground text-xs">
                Showing {(currentPage - 1) * gridPageSize + 1} to{" "}
                {Math.min(currentPage * gridPageSize, sortedOrders.length)} of{" "}
                {sortedOrders.length} orders
              </span>

              {totalPages > 1 && (
                <Pagination className="mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage <= 1}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
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
          </div>
        ) : (
          <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="text-muted-foreground text-xs">
                {groupByStore ? (
                  <span>
                    Showing{" "}
                    <strong className="text-foreground">
                      {(currentPage - 1) * groupPageSize + 1}
                    </strong>{" "}
                    to{" "}
                    <strong className="text-foreground">
                      {Math.min(currentPage * groupPageSize, storeGroups.length)}
                    </strong>{" "}
                    of <strong className="text-foreground">{storeGroups.length}</strong>{" "}
                    retail destinations ({filteredOrders.length} total orders)
                  </span>
                ) : (
                  <span>
                    Showing{" "}
                    <span className="font-bold text-foreground">
                      {sortedOrders.length === 0
                        ? 0
                        : (currentPage - 1) * flatPageSize + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-foreground">
                      {Math.min(currentPage * flatPageSize, sortedOrders.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-foreground">
                      {sortedOrders.length}
                    </span>{" "}
                    orders
                  </span>
                )}
              </div>

              {totalPages > 1 && (
                <Pagination className="mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage <= 1}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
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
                        className="w-[150px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("orderRef")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Order</span>
                          <SortHeaderIcon
                            active={sortKey === "orderRef"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      {!groupByStore && (
                        <TableHead
                          className="w-[200px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                          onClick={() => handleSort("outlet")}
                        >
                          <div className="flex items-center gap-1">
                            <span>Destination</span>
                            <SortHeaderIcon
                              active={sortKey === "outlet"}
                              direction={sortDirection}
                            />
                          </div>
                        </TableHead>
                      )}

                      <TableHead className="w-[100px] font-bold text-foreground text-xs">
                        Temp Zone
                      </TableHead>
                      <TableHead className="w-[85px] text-center font-bold text-foreground text-xs">
                        Packages
                      </TableHead>

                      <TableHead
                        className="w-[120px] text-right cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("weight")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Total Weight</span>
                          <SortHeaderIcon
                            active={sortKey === "weight"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[110px] text-right cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("volume")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Volume</span>
                          <SortHeaderIcon
                            active={sortKey === "volume"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[130px] text-right cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("value")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Order Value</span>
                          <SortHeaderIcon
                            active={sortKey === "value"}
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

                      <TableHead className="w-[50px] text-right font-bold text-foreground text-xs">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {groupByStore
                      ? paginatedStoreGroups.map((group) => (
                          <React.Fragment key={group.outletId}>
                            <TableRow className="bg-muted/40 hover:bg-muted/40 border-t-2 border-b border-border/70">
                              <TableCell
                                colSpan={8}
                                className="py-2.5 px-4 text-xs font-heading font-bold text-foreground"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <StorefrontIcon className="size-4 text-primary shrink-0" />
                                    <span className="text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      {group.outletId}
                                    </span>
                                    <span className="font-heading font-black text-sm text-foreground">
                                      {group.outletName}
                                    </span>
                                    <span className="text-xs font-semibold text-primary">
                                      Waypoint {group.brand}
                                    </span>
                                    <span className="text-muted-foreground text-xs font-normal">
                                      ({group.orders.length}{" "}
                                      {group.orders.length === 1 ? "order" : "orders"})
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-normal">
                                    <span>{group.outletAddress}</span>
                                    <span>•</span>
                                    <span className="capitalize">
                                      {group.dockType.replace("_", " ")}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>

                            {group.orders.map((ord) => {
                              const isChilled = ord.tempRequirement === "chilled";
                              return (
                                <TableRow
                                  key={ord.id}
                                  onClick={() => handleOpenDetail(ord)}
                                  className={`border-border/30 hover:bg-muted/30 cursor-pointer text-xs ${
                                    ord.deferredYesterday === 1
                                      ? "bg-[var(--status-skip-bg)]/20"
                                      : ""
                                  }`}
                                >
                                  <TableCell className="font-bold text-foreground py-2 px-4 whitespace-nowrap relative">
                                    {ord.deferredYesterday === 1 ? (
                                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[var(--status-skip)] rounded-r" />
                                    ) : ord.isUrgent ? (
                                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[var(--status-urgent)] rounded-r" />
                                    ) : null}
                                    <Tooltip>
                                      <TooltipTrigger
                                        render={
                                          <div className="flex items-center gap-2 pl-1 cursor-help group/ref">
                                            <span
                                              className={`size-1.5 rounded-full shrink-0 ${
                                                ord.deferredYesterday === 1
                                                  ? "bg-[var(--status-skip)]"
                                                  : ord.isUrgent
                                                    ? "bg-[var(--status-urgent)]"
                                                    : "bg-primary"
                                              }`}
                                            />
                                            <span className="group-hover/ref:text-primary transition-colors">
                                              #{ord.orderRef}
                                            </span>
                                          </div>
                                        }
                                      />
                                      <TooltipContent className="flex items-center gap-1.5 p-1.5">
                                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                          Waypoint {ord.brand}
                                        </span>
                                        {ord.deferredYesterday === 1 && (
                                          <span className="text-[var(--status-skip)] bg-[var(--status-skip-bg)] text-[11px] font-bold px-1.5 py-0.5 rounded border border-[var(--status-skip-border)] flex items-center gap-0.5">
                                            <WarningOctagonIcon
                                              className="size-2.5"
                                              weight="bold"
                                            />
                                            Yesterday Skip
                                          </span>
                                        )}
                                        {ord.isUrgent && (
                                          <span className="text-[var(--status-urgent)] bg-[var(--status-urgent-bg)] text-[11px] font-bold px-1.5 py-0.5 rounded border border-[var(--status-urgent-border)]">
                                            Urgent
                                          </span>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TableCell>

                                  <TableCell className="py-2 px-4 whitespace-nowrap">
                                    <Tooltip>
                                      <TooltipTrigger
                                        render={
                                          <div className="flex items-center gap-1 text-xs font-semibold cursor-help">
                                            {isChilled ? (
                                              <>
                                                <SnowflakeIcon
                                                  className="size-3 text-[var(--status-chilled)] shrink-0"
                                                  weight="bold"
                                                />
                                                <span className="text-[var(--status-chilled)] text-[11px]">
                                                  Chilled
                                                </span>
                                              </>
                                            ) : (
                                              <>
                                                <SunIcon
                                                  className="size-3 text-[var(--status-ambient)] shrink-0"
                                                  weight="bold"
                                                />
                                                <span className="text-[var(--status-ambient)] text-[11px]">
                                                  Ambient
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        }
                                      />
                                      <TooltipContent>
                                        <span>
                                          {isChilled
                                            ? "Reefer vehicle required (0°C to 4°C cold chain)"
                                            : "Ambient dry freight compartment"}
                                        </span>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TableCell>

                                  <TableCell className="text-center font-bold text-foreground py-2 px-3 whitespace-nowrap">
                                    {ord.items.length} pkgs
                                  </TableCell>

                                  <TableCell className="text-right font-medium text-foreground py-2 px-4 whitespace-nowrap">
                                    {ord.totalWeightKg.toLocaleString()} kg
                                  </TableCell>

                                  <TableCell className="text-right font-medium text-foreground py-2 px-4 whitespace-nowrap">
                                    {ord.totalVolumeM3.toFixed(2)} m³
                                  </TableCell>

                                  <TableCell className="text-right font-bold text-foreground py-2 px-4 whitespace-nowrap">
                                    LKR {ord.totalOrderValueLkr.toLocaleString()}
                                  </TableCell>

                                  <TableCell className="text-xs font-medium text-foreground py-2 px-4 whitespace-nowrap">
                                    {ord.deliveryWindow}
                                  </TableCell>

                                  <TableCell className="text-right py-2 px-4 whitespace-nowrap">
                                    <IconButton
                                      variant="ghost"
                                      size="xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDetail(ord);
                                      }}
                                      className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                                      title="Inspect Order Details"
                                    >
                                      <ArrowSquareOutIcon className="size-3.5" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              );
                            })}

                            <TableRow className="bg-muted/20 border-b-2 border-border/80 text-xs font-semibold">
                              <TableCell className="py-2 px-4 font-bold text-[11px] text-muted-foreground whitespace-nowrap">
                                <span className="pl-2">
                                  TOTAL ({group.totalOrders}{" "}
                                  {group.totalOrders === 1 ? "order" : "orders"})
                                </span>
                              </TableCell>

                              <TableCell className="py-2 px-4" />

                              <TableCell className="text-center font-black text-foreground py-2 px-3 whitespace-nowrap">
                                {group.totalPackages} pkgs
                              </TableCell>

                              <TableCell className="text-right font-black text-foreground py-2 px-4 whitespace-nowrap">
                                {group.totalWeightKg.toLocaleString()} kg
                              </TableCell>

                              <TableCell className="text-right font-black text-foreground py-2 px-4 whitespace-nowrap">
                                {group.totalVolumeM3.toFixed(2)} m³
                              </TableCell>

                              <TableCell className="text-right font-black text-primary py-2 px-4 whitespace-nowrap">
                                LKR {group.totalValueLkr.toLocaleString()}
                              </TableCell>

                              <TableCell className="text-xs font-medium text-muted-foreground py-2 px-4 whitespace-nowrap">
                                {group.deliveryWindow}
                              </TableCell>

                              <TableCell className="py-2 px-4" />
                            </TableRow>
                          </React.Fragment>
                        ))
                      : paginatedOrders.map((ord) => {
                          const isChilled = ord.tempRequirement === "chilled";
                          return (
                            <TableRow
                              key={ord.id}
                              onClick={() => handleOpenDetail(ord)}
                              className={`hover:bg-muted/30 cursor-pointer ${
                                ord.deferredYesterday === 1
                                  ? "bg-[var(--status-skip-bg)]/20"
                                  : ""
                              }`}
                            >
                              <TableCell className="font-bold text-foreground py-2 px-4 whitespace-nowrap relative">
                                {ord.deferredYesterday === 1 ? (
                                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[var(--status-skip)] rounded-r" />
                                ) : ord.isUrgent ? (
                                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[var(--status-urgent)] rounded-r" />
                                ) : null}
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <div className="flex items-center gap-2 pl-1 cursor-help group/ref">
                                        <span
                                          className={`size-1.5 rounded-full shrink-0 ${
                                            ord.deferredYesterday === 1
                                              ? "bg-[var(--status-skip)]"
                                              : ord.isUrgent
                                                ? "bg-[var(--status-urgent)]"
                                                : "bg-primary"
                                          }`}
                                        />
                                        <span className="group-hover/ref:text-primary transition-colors">
                                          #{ord.orderRef}
                                        </span>
                                      </div>
                                    }
                                  />
                                  <TooltipContent className="flex items-center gap-1.5 p-1.5">
                                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                      Waypoint {ord.brand}
                                    </span>
                                    {ord.deferredYesterday === 1 && (
                                      <span className="text-[var(--status-skip)] bg-[var(--status-skip-bg)] text-[11px] font-bold px-1.5 py-0.5 rounded border border-[var(--status-skip-border)] flex items-center gap-0.5">
                                        <WarningOctagonIcon
                                          className="size-2.5"
                                          weight="bold"
                                        />
                                        Yesterday Skip
                                      </span>
                                    )}
                                    {ord.isUrgent && (
                                      <span className="text-[var(--status-urgent)] bg-[var(--status-urgent-bg)] text-[11px] font-bold px-1.5 py-0.5 rounded border border-[var(--status-urgent-border)]">
                                        Urgent
                                      </span>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>

                              <TableCell>
                                <div>
                                  <span className="font-bold text-xs text-foreground truncate max-w-[150px] block">
                                    {ord.outletName}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground truncate block">
                                    {ord.outletAddress}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <div className="flex items-center gap-1 text-xs font-semibold cursor-help">
                                        {isChilled ? (
                                          <>
                                            <SnowflakeIcon
                                              className="size-3 text-[var(--status-chilled)] shrink-0"
                                              weight="bold"
                                            />
                                            <span className="text-[var(--status-chilled)] text-[11px]">
                                              Chilled
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <SunIcon
                                              className="size-3 text-[var(--status-ambient)] shrink-0"
                                              weight="bold"
                                            />
                                            <span className="text-[var(--status-ambient)] text-[11px]">
                                              Ambient
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    }
                                  />
                                  <TooltipContent>
                                    <span>
                                      {isChilled
                                        ? "Reefer vehicle required (0°C to 4°C)"
                                        : "Ambient dry freight compartment"}
                                    </span>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>

                              <TableCell className="text-center font-bold text-foreground">
                                {ord.items.length} pkgs
                              </TableCell>

                              <TableCell className="text-right font-medium text-foreground">
                                {ord.totalWeightKg.toLocaleString()} kg
                              </TableCell>

                              <TableCell className="text-right font-medium text-foreground">
                                {ord.totalVolumeM3.toFixed(2)} m³
                              </TableCell>

                              <TableCell className="text-right font-bold text-foreground">
                                LKR {ord.totalOrderValueLkr.toLocaleString()}
                              </TableCell>

                              <TableCell className="text-xs font-medium text-foreground">
                                {ord.deliveryWindow}
                              </TableCell>

                              <TableCell className="text-right">
                                <IconButton
                                  variant="ghost"
                                  size="xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDetail(ord);
                                  }}
                                  className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                                  title="Inspect Order Details"
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

      <OrderDetailSheet
        order={selectedOrder}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}

export default OrderQueuePage;
