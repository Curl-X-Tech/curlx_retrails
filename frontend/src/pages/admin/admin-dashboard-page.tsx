import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  WarehouseIcon,
  StorefrontIcon,
  PackageIcon,
  CalendarIcon,
  TrendUpIcon,
  MapPinIcon,
  ArrowRightIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMasterDepots,
  useMasterBrands,
  useMasterOutlets,
  useMasterItems,
  useDemandSurge,
  useUpcomingOperatingDays,
} from "@/hooks/use-master-data";
import { useAdminStore } from "@/stores/use-admin-store";

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { selectedHub, setSelectedHub } = useAdminStore();

  const {
    data: depots,
    isLoading: isDepotsLoading,
    refetch: refetchDepots,
  } = useMasterDepots();
  const { data: brands, isLoading: isBrandsLoading } = useMasterBrands();
  const {
    data: outlets,
    isLoading: isOutletsLoading,
    refetch: refetchOutlets,
  } = useMasterOutlets();
  const { data: items, isLoading: isItemsLoading } = useMasterItems();
  const { data: surgeData, isLoading: isSurgeLoading } = useDemandSurge();
  const { data: operatingDays, isLoading: isOperatingDaysLoading } =
    useUpcomingOperatingDays(7);

  const isLoading =
    isDepotsLoading ||
    isBrandsLoading ||
    isOutletsLoading ||
    isItemsLoading ||
    isSurgeLoading ||
    isOperatingDaysLoading;

  const filteredOutlets = React.useMemo(() => {
    if (!outlets) return [];
    if (selectedHub === "ALL") return outlets;
    const depotMatch = depots?.find((d) => d.code === selectedHub);
    if (!depotMatch) return outlets;
    return outlets.filter((o) => o.depot_id === depotMatch.id);
  }, [outlets, depots, selectedHub]);

  const brandBreakdown = React.useMemo(() => {
    if (!outlets || !brands) return [];
    return brands.map((b) => {
      const count = outlets.filter((o) => o.brand_id === b.id).length;
      return {
        code: b.code,
        name: b.name,
        count,
        requiresColdChain: b.requires_cold_chain,
        deliveryWindowType: b.delivery_window_type,
        timeBudget: b.daily_time_budget_min,
      };
    });
  }, [outlets, brands]);

  const nextSurgeDay = React.useMemo(() => {
    if (!surgeData || surgeData.length === 0) return null;
    return [...surgeData].sort((a, b) => b.surge_multiplier - a.surge_multiplier)[0];
  }, [surgeData]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* 1. Page Header matching Dispatcher & Store pages */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
            Master System Administration
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Central repository configuration, retail outlets, SKUs, and delivery calendar
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Hub Selector */}
          <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/40 text-xs">
            {(
              [
                { label: "All Hubs", value: "ALL" },
                { label: "Peliyagoda", value: "PEL" },
                { label: "Kandy", value: "KDY" },
              ] as const
            ).map((hub) => (
              <button
                key={hub.value}
                onClick={() => setSelectedHub(hub.value)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  selectedHub === hub.value
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {hub.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={() => {
              refetchDepots();
              refetchOutlets();
            }}
          >
            <ArrowsClockwiseIcon className="size-3 text-muted-foreground" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics Strip */}
      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <WarehouseIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Hubs:</span>
          <span className="font-bold text-foreground text-[11px]">
            {depots?.length ?? 0} Active
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <StorefrontIcon className="size-3.5 text-sky-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Outlets:</span>
          <span className="font-bold text-foreground text-[11px]">
            {filteredOutlets.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <PackageIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Catalog SKUs:</span>
          <span className="font-bold text-foreground text-[11px]">
            {items?.length ?? 0}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            ({items?.filter((i) => i.requires_cold_chain).length ?? 0} cold chain)
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <CalendarIcon className="size-3.5 text-amber-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Schedule:</span>
          <span className="font-bold text-foreground text-[11px]">
            {operatingDays?.length ?? 0} Days Planned
          </span>
        </div>

        {nextSurgeDay && nextSurgeDay.surge_multiplier > 1.0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-primary/40 rounded-lg shadow-2xs">
            <TrendUpIcon className="size-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground text-[11px]">Peak Surge:</span>
            <span className="font-bold text-primary text-[11px]">
              {nextSurgeDay.surge_multiplier.toFixed(2)}x ({nextSurgeDay.dow_name})
            </span>
          </div>
        )}
      </div>

      {/* 3. Main Body Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Left 2 Cols: Depots & Brands */}
          <div className="lg:col-span-2 space-y-6">
            {/* Depots Card */}
            <Card className="border-border shadow-xs">
              <CardHeader className="border-b border-border/60 pb-3 px-5 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      Distribution Depots
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Primary fleet staging bases and home return depots
                    </CardDescription>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {depots?.length ?? 0} Depots
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border/60">
                {isLoading ? (
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  depots?.map((depot) => {
                    const count =
                      outlets?.filter((o) => o.depot_id === depot.id).length ?? 0;

                    return (
                      <div
                        key={depot.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/15 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs bg-muted px-2 py-0.5 rounded border border-border/60 text-foreground">
                              {depot.code}
                            </span>
                            <span className="font-semibold text-xs text-foreground">
                              {depot.name} Distribution Center
                            </span>
                            {depot.is_active && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Online
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPinIcon className="size-3" />
                            {depot.address || "Sri Lanka"} ({depot.latitude.toFixed(3)},{" "}
                            {depot.longitude.toFixed(3)})
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-bold text-xs text-foreground">
                            {count} Outlets
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Assigned Stores
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Brand Networks */}
            <Card className="border-border shadow-xs">
              <CardHeader className="border-b border-border/60 pb-3 px-5 pt-4">
                <CardTitle className="text-sm font-semibold">
                  Retail Brand Specifications
                </CardTitle>
                <CardDescription className="text-xs">
                  Waypoint Fresh, Style, and Tech routing rules and time budgets
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {brandBreakdown.map((brand) => (
                    <div
                      key={brand.code}
                      className="p-3.5 rounded-lg border border-border/70 bg-card/60 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs bg-muted px-2 py-0.5 rounded border border-border/60">
                          {brand.code}
                        </span>
                        <span className="font-bold text-base text-foreground">
                          {brand.count}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-foreground">
                        {brand.name}
                      </div>
                      <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground space-y-1">
                        <div>Window: {brand.deliveryWindowType}</div>
                        <div>Budget: {brand.timeBudget} mins</div>
                        <div>
                          Cold Chain: {brand.requiresColdChain ? "Required" : "Ambient"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Col: Demand Surge & Navigation Quick Links */}
          <div className="space-y-6">
            {/* Surge Overview */}
            <Card className="border-border shadow-xs">
              <CardHeader className="pb-3 px-5 pt-4 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <TrendUpIcon className="size-4 text-primary" />
                    Demand Surges
                  </CardTitle>
                  <span className="text-[11px] text-muted-foreground">2026 Calendar</span>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                {nextSurgeDay ? (
                  <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground">
                        {nextSurgeDay.festival || "Payday Peak"}
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {nextSurgeDay.surge_multiplier.toFixed(2)}x
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {nextSurgeDay.date} ({nextSurgeDay.dow_name})
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Baseline standard demand operating.
                  </p>
                )}

                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Upcoming Days
                  </div>
                  <div className="space-y-1.5">
                    {surgeData?.slice(0, 5).map((d) => (
                      <div
                        key={d.date}
                        className="flex items-center justify-between py-1 text-[11px]"
                      >
                        <span className="text-muted-foreground">
                          {d.date} ({d.dow_name})
                        </span>
                        <span
                          className={`font-semibold ${
                            d.surge_multiplier > 1.0 ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {d.surge_multiplier.toFixed(2)}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Navigation Cards */}
            <Card className="border-border shadow-xs">
              <CardHeader className="pb-3 px-5 pt-4 border-b border-border/60">
                <CardTitle className="text-sm font-semibold">Master Data Pages</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2 text-xs">
                <button
                  onClick={() => navigate("/admin/outlets")}
                  className="w-full p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <StorefrontIcon className="size-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold text-xs text-foreground">
                        Retail Outlets ({outlets?.length ?? 120})
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Delivery windows & dock constraints
                      </div>
                    </div>
                  </div>
                  <ArrowRightIcon className="size-4 text-muted-foreground" />
                </button>

                <button
                  onClick={() => navigate("/admin/items")}
                  className="w-full p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <PackageIcon className="size-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold text-xs text-foreground">
                        Catalog SKUs ({items?.length ?? 0})
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Weights, volumes & cold chain tags
                      </div>
                    </div>
                  </div>
                  <ArrowRightIcon className="size-4 text-muted-foreground" />
                </button>

                <button
                  onClick={() => navigate("/admin/calendar")}
                  className="w-full p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarIcon className="size-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold text-xs text-foreground">
                        2026 Logistics Calendar
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Surge multipliers & operating days
                      </div>
                    </div>
                  </div>
                  <ArrowRightIcon className="size-4 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
