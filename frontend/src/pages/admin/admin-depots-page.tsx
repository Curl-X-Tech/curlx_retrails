import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared";
import {
  useAdminDepots,
  useAdminDistricts,
  useAdminOutlets,
  DepotKpiStrip,
  DepotCard,
  type MasterDepot,
} from "@/features/admin";

export function AdminDepotsPage() {
  const {
    data: depots = [],
    isLoading: isDepotsLoading,
    refetch: refetchDepots,
  } = useAdminDepots();
  const { data: districts = [], isLoading: isDistrictsLoading } = useAdminDistricts();
  const { data: outlets = [], isLoading: isOutletsLoading } = useAdminOutlets();

  const isLoading = isDepotsLoading || isDistrictsLoading || isOutletsLoading;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card">
        <PageHeader
          className="mb-0"
          title="Distribution Depots"
          description="Primary distribution hubs, home return bases, and regional vehicle staging docks"
          actions={
            <Button
              variant="outline"
              size="xs"
              className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
              onClick={() => refetchDepots()}
            >
              <ArrowsClockwiseIcon className="size-3 text-muted-foreground" />
              <span>Refresh</span>
            </Button>
          }
        />
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20">
        <DepotKpiStrip
          depotsCount={depots.length}
          districtsCount={districts.length}
          outletsCount={outlets.length}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {isLoading ? (
            <>
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </>
          ) : (
            depots.map((depot: MasterDepot) => (
              <DepotCard
                key={depot.id}
                depot={depot}
                districts={districts}
                outlets={outlets}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDepotsPage;
