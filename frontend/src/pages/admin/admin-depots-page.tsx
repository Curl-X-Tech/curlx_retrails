import {
  WarehouseIcon,
  ArrowsClockwiseIcon,
  MapPinIcon,
  CheckCircleIcon,
  StorefrontIcon,
  MapTrifoldIcon,
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
  useMasterDistricts,
  useMasterOutlets,
  type MasterDepot,
} from "@/hooks/use-master-data";

export function AdminDepotsPage() {
  const {
    data: depots,
    isLoading: isDepotsLoading,
    refetch: refetchDepots,
  } = useMasterDepots();
  const { data: districts, isLoading: isDistrictsLoading } = useMasterDistricts();
  const { data: outlets, isLoading: isOutletsLoading } = useMasterOutlets();

  const isLoading = isDepotsLoading || isDistrictsLoading || isOutletsLoading;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* 1. Header Bar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
            Distribution Depots
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Primary distribution hubs, home return bases, and regional vehicle staging
            docks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={() => refetchDepots()}
          >
            <ArrowsClockwiseIcon className="size-3 text-muted-foreground" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Strip */}
      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <WarehouseIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Active Hubs:</span>
          <span className="font-bold text-foreground text-[11px]">
            {depots?.length ?? 0}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <MapTrifoldIcon className="size-3.5 text-sky-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Districts Covered:</span>
          <span className="font-bold text-foreground text-[11px]">
            {districts?.length ?? 12}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <StorefrontIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Total Stores:</span>
          <span className="font-bold text-foreground text-[11px]">
            {outlets?.length ?? 120}
          </span>
        </div>
      </div>

      {/* 3. Main Content Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {isLoading ? (
            <>
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </>
          ) : (
            depots?.map((depot: MasterDepot) => {
              const assignedDistricts =
                districts?.filter((dist) => dist.assigned_depot_id === depot.id) ?? [];
              const assignedOutlets =
                outlets?.filter((o) => o.depot_id === depot.id) ?? [];

              return (
                <Card key={depot.id} className="border-border shadow-xs">
                  <CardHeader className="border-b border-border/60 pb-3 px-5 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted border border-border/60">
                          <WarehouseIcon
                            weight="duotone"
                            className="size-5 text-foreground"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-semibold">
                              {depot.name} Distribution Center
                            </CardTitle>
                            <span className="font-bold text-xs bg-muted px-2 py-0.5 rounded border border-border/60 text-foreground">
                              {depot.code}
                            </span>
                          </div>
                          <CardDescription className="text-xs mt-0.5 flex items-center gap-1">
                            <MapPinIcon className="size-3" />
                            {depot.address || "Sri Lanka"}
                          </CardDescription>
                        </div>
                      </div>

                      {depot.is_active && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Online
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-5">
                    {/* Position & Outlets */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg border border-border/70 bg-card/60 space-y-1">
                        <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                          Position
                        </div>
                        <div className="font-semibold text-xs text-foreground">
                          {depot.latitude.toFixed(4)}, {depot.longitude.toFixed(4)}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg border border-border/70 bg-card/60 space-y-1">
                        <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                          Assigned Outlets
                        </div>
                        <div className="font-semibold text-xs text-foreground">
                          {assignedOutlets.length} Stores
                        </div>
                      </div>
                    </div>

                    {/* Covered Districts */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Covered Logistics Districts</span>
                        <span className="text-[11px] text-muted-foreground">
                          {assignedDistricts.length} Districts
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {assignedDistricts.map((dist) => (
                          <span
                            key={dist.id}
                            className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/60 text-xs text-foreground font-medium"
                          >
                            {dist.name} ({dist.province})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Feasibility Constraint Card */}
                    <div className="p-3 rounded-lg border border-border/70 bg-muted/20 text-xs space-y-1 text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
                        <CheckCircleIcon
                          weight="fill"
                          className="size-3.5 text-primary"
                        />
                        <span>Feasibility Constraint FR-05 Active</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Vehicles staged from {depot.name} must return to this hub upon
                        completing daily delivery routes.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
