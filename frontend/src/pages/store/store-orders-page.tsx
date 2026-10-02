import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  SlidersHorizontalIcon,
  ColumnsIcon,
  ArrowClockwiseIcon,
  DotsThreeVerticalIcon,
  PlusIcon,
  PrinterIcon,
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { getStoreOrders, type StoreOrderRecord } from "@/data/mock-store-orders";

export function StoreOrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = React.useState<StoreOrderRecord[]>(() => getStoreOrders());
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [activeDetailOrder, setActiveDetailOrder] =
    React.useState<StoreOrderRecord | null>(null);

  const searchQuery = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";
  const hubFilter = searchParams.get("hub") || "all";
  const dateFilter = searchParams.get("date") || "today";

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const next = new URLSearchParams(searchParams);
    if (val) next.set("q", val);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const handleStatusSelect = (status: string) => {
    const next = new URLSearchParams(searchParams);
    if (status === "all") next.delete("status");
    else next.set("status", status);
    setSearchParams(next, { replace: true });
  };

  const handleHubSelect = (hub: string) => {
    const next = new URLSearchParams(searchParams);
    if (hub === "all") next.delete("hub");
    else next.set("hub", hub);
    setSearchParams(next, { replace: true });
  };

  const handleRefresh = () => {
    setOrders([...getStoreOrders()]);
  };

  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchRef = order.orderRef.toLowerCase().includes(q);
        const matchTrip = order.tripId?.toLowerCase().includes(q) || false;
        const matchOutlet = order.outletName.toLowerCase().includes(q);
        const matchDistrict = order.district.toLowerCase().includes(q);
        if (!matchRef && !matchTrip && !matchOutlet && !matchDistrict) return false;
      }
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }
      if (hubFilter !== "all" && order.depot.toLowerCase() !== hubFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter, hubFilter]);

  const allSelected =
    filteredOrders.length > 0 && filteredOrders.every((o) => selectedIds.includes(o.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: StoreOrderRecord["status"]) => {
    switch (status) {
      case "in_transit":
        return (
          <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20 font-medium">
            <TruckIcon className="size-3.5 mr-1 shrink-0" />
            In Transit
          </Badge>
        );
      case "loading":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20 font-medium">
            <ClockIcon className="size-3.5 mr-1 shrink-0" />
            Loading
          </Badge>
        );
      case "served":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-medium">
            <CheckCircleIcon className="size-3.5 mr-1 shrink-0" />
            Served
          </Badge>
        );
      case "deferred":
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20 font-medium">
            <WarningCircleIcon className="size-3.5 mr-1 shrink-0" />
            Deferred
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge className="bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border-neutral-500/20 font-medium">
            <ClockIcon className="size-3.5 mr-1 shrink-0" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background font-sans">
      {/* Top Filter Bar strictly matching Reference 1 */}
      <div className="border-b border-border bg-card px-4 py-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left search & filter controls */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by Batch ID, Vehicle No., or Route..."
                className="pl-9 h-9 text-xs rounded-lg bg-muted/40 border-border focus-visible:bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.delete("q");
                    setSearchParams(next);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>

            {/* Date filter button */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-xs gap-1.5 rounded-lg border-border font-normal text-muted-foreground hover:text-foreground cursor-pointer"
                  />
                }
              >
                <CalendarBlankIcon className="size-4 text-primary shrink-0" />
                <span className="font-medium text-foreground">
                  {dateFilter === "today" ? "Today, Oct 01" : "All Dates"}
                </span>
                <CaretDownIcon className="size-3 text-muted-foreground ml-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44 text-xs">
                <DropdownMenuItem
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set("date", "today");
                    setSearchParams(next);
                  }}
                >
                  Today, Oct 01
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set("date", "tomorrow");
                    setSearchParams(next);
                  }}
                >
                  Tomorrow, Oct 02
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set("date", "all");
                    setSearchParams(next);
                  }}
                >
                  All Upcoming Runs
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-xs gap-1.5 rounded-lg border-border font-normal text-muted-foreground hover:text-foreground cursor-pointer"
                  />
                }
              >
                <span>Status:</span>
                <span className="font-medium text-foreground capitalize">
                  {statusFilter === "all"
                    ? "All Statuses"
                    : statusFilter.replace("_", " ")}
                </span>
                <CaretDownIcon className="size-3 text-muted-foreground ml-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44 text-xs">
                <DropdownMenuItem onClick={() => handleStatusSelect("all")}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusSelect("pending")}>
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusSelect("loading")}>
                  Loading
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusSelect("in_transit")}>
                  In Transit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusSelect("served")}>
                  Served
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusSelect("deferred")}>
                  Deferred
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hubs Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-xs gap-1.5 rounded-lg border-border font-normal text-muted-foreground hover:text-foreground cursor-pointer"
                  />
                }
              >
                <span>Hubs:</span>
                <span className="font-medium text-foreground capitalize">
                  {hubFilter === "all" ? "All Depots" : `${hubFilter} Depot`}
                </span>
                <CaretDownIcon className="size-3 text-muted-foreground ml-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44 text-xs">
                <DropdownMenuItem onClick={() => handleHubSelect("all")}>
                  All Depots
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleHubSelect("peliyagoda")}>
                  Peliyagoda Depot
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleHubSelect("kandy")}>
                  Kandy Depot
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right utility buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5 text-xs gap-1.5 rounded-lg border-border font-medium cursor-pointer"
              onClick={() => {}}
            >
              <SlidersHorizontalIcon className="size-4 text-muted-foreground" />
              <span className="hidden sm:inline">Advanced</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5 text-xs gap-1.5 rounded-lg border-border font-medium cursor-pointer"
              onClick={() => {}}
            >
              <ColumnsIcon className="size-4 text-muted-foreground" />
              <span className="hidden sm:inline">Columns</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 rounded-lg border-border cursor-pointer"
              onClick={handleRefresh}
              title="Refresh Queue"
            >
              <ArrowClockwiseIcon className="size-4 text-muted-foreground" />
            </Button>

            {/* Mobile / Direct Create Order Action */}
            <Button
              onClick={() => navigate("/store/orders/new")}
              size="sm"
              className="h-9 px-3 text-xs gap-1.5 rounded-lg bg-primary text-primary-foreground font-semibold cursor-pointer ml-1 sm:hidden"
            >
              <PlusIcon className="size-4 font-bold" />
              <span>Create Order</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content: Table View (Desktop & Tablet) & Card View (Mobile) */}
      <div className="flex-1 overflow-auto p-4">
        {/* Desktop & Tablet Table */}
        <div className="hidden md:block rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 px-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground">
                  Trip ID
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground">
                  Order
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground">
                  Outlet
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground">
                  District
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground">
                  ETA
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground text-right">
                  Weight
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground text-right">
                  Volume
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground text-center">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold text-foreground text-right pr-4">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-48 text-center text-muted-foreground text-xs"
                  >
                    No orders found matching the filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const isChecked = selectedIds.includes(order.id);
                  return (
                    <TableRow
                      key={order.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setActiveDetailOrder(order)}
                    >
                      <TableCell
                        className="px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectRow(order.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(order.id)}
                          className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-primary hover:underline">
                        {order.tripId || "-"}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {order.orderRef}
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        {order.outletName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.district}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium">
                        {order.eta || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {order.totalWeightKg.toFixed(1)} kg
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {order.totalVolumeM3.toFixed(2)} m³
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell
                        className="text-right pr-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <button
                                type="button"
                                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                              />
                            }
                          >
                            <DotsThreeVerticalIcon className="size-4" weight="bold" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 text-xs shadow-lg rounded-xl"
                          >
                            <DropdownMenuItem
                              onClick={() => setActiveDetailOrder(order)}
                              className="gap-2 cursor-pointer"
                            >
                              <EyeIcon className="size-4 text-muted-foreground" />
                              View Order Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.print()}
                              className="gap-2 cursor-pointer"
                            >
                              <PrinterIcon className="size-4 text-muted-foreground" />
                              Print Manifest Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate("/dispatcher/live-map")}
                              className="gap-2 cursor-pointer"
                            >
                              <TruckIcon className="size-4 text-muted-foreground" />
                              Track in Live Map
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View: Card Stack */}
        <div className="md:hidden space-y-3">
          {filteredOrders.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground text-xs">
              No orders found matching the filter criteria.
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card
                key={order.id}
                onClick={() => setActiveDetailOrder(order)}
                className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3 cursor-pointer hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-primary">
                        {order.tripId || order.orderRef}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="font-semibold text-foreground text-sm mt-1">
                      {order.outletName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.district} • {order.depot} Depot
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">ETA</span>
                    <span className="font-semibold text-xs text-foreground">
                      {order.eta || "Pending"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center text-xs">
                  <div className="bg-muted/40 p-1.5 rounded-lg">
                    <span className="text-[10px] text-muted-foreground block">Items</span>
                    <span className="font-bold text-foreground">
                      {order.totalItems} pkgs
                    </span>
                  </div>
                  <div className="bg-muted/40 p-1.5 rounded-lg">
                    <span className="text-[10px] text-muted-foreground block">
                      Weight
                    </span>
                    <span className="font-bold text-foreground">
                      {order.totalWeightKg.toFixed(1)} kg
                    </span>
                  </div>
                  <div className="bg-muted/40 p-1.5 rounded-lg">
                    <span className="text-[10px] text-muted-foreground block">
                      Valuation
                    </span>
                    <span className="font-bold text-foreground">
                      LKR {(order.totalOrderValueLkr / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Pagination Footer matching Reference 1 */}
      <div className="border-t border-border bg-card px-4 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>
          Showing 1 - {filteredOrders.length} of {filteredOrders.length} allocation runs
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Rows per page:</span>
            <span className="font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
              10
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-7 w-7 p-0 rounded border-border text-muted-foreground cursor-not-allowed"
            >
              &lt;
            </Button>
            <Button
              size="sm"
              className="h-7 w-7 p-0 rounded bg-primary text-primary-foreground font-bold"
            >
              1
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-7 w-7 p-0 rounded border-border text-muted-foreground cursor-not-allowed"
            >
              &gt;
            </Button>
          </div>
        </div>
      </div>

      {/* Order Detail Sheet / Inspection Drawer */}
      <Sheet
        open={!!activeDetailOrder}
        onOpenChange={(open) => !open && setActiveDetailOrder(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-card"
        >
          {activeDetailOrder && (
            <>
              <SheetHeader className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                    Order Details
                  </span>
                  {getStatusBadge(activeDetailOrder.status)}
                </div>
                <SheetTitle className="text-lg font-bold text-foreground mt-1">
                  {activeDetailOrder.orderRef} (
                  {activeDetailOrder.tripId || "No Trip Assigned"})
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  {activeDetailOrder.outletName} • {activeDetailOrder.outletAddress}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Meta summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-muted/40 p-3 rounded-xl border border-border">
                    <span className="text-[11px] text-muted-foreground block">
                      Order Date
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {activeDetailOrder.orderDate}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-xl border border-border">
                    <span className="text-[11px] text-muted-foreground block">ETA</span>
                    <span className="text-xs font-semibold text-foreground">
                      {activeDetailOrder.eta || "Pending"}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-xl border border-border">
                    <span className="text-[11px] text-muted-foreground block">
                      Gross Weight
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {activeDetailOrder.totalWeightKg.toFixed(1)} kg
                    </span>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-xl border border-border">
                    <span className="text-[11px] text-muted-foreground block">
                      Total LKR
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      LKR {activeDetailOrder.totalOrderValueLkr.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Items list */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Allocated Line Items ({activeDetailOrder.items.length})
                  </h4>
                  <div className="space-y-2">
                    {activeDetailOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-border bg-card flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground truncate">
                              {item.name}
                            </span>
                            {item.specialHandlingCode && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4"
                              >
                                {item.specialHandlingCode}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {item.sku} • {item.category}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-foreground block">
                            {item.quantity} {item.unit}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            LKR {item.totalPriceLkr.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 cursor-pointer rounded-xl"
                >
                  <PrinterIcon className="size-4" />
                  Print Manifest
                </Button>
                <Button
                  size="sm"
                  onClick={() => setActiveDetailOrder(null)}
                  className="rounded-xl cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
