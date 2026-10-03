import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminCrudShell } from "@/components/shared";
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
    <AdminCrudShell
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
      kpi={
        <DepotKpiStrip
          depotsCount={depots.length}
          districtsCount={districts.length}
          outletsCount={outlets.length}
        />
      }
      contentClassName="overflow-y-auto space-y-6"
    >
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
    </AdminCrudShell>
  );
}

export default AdminDepotsPage;
