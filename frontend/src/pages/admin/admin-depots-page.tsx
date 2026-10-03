import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminCrudShell, QueryState } from "@/components/shared";
import { useDepots, useDistricts, useOutlets } from "@/api/master";
import { DepotKpiStrip, DepotCard } from "@/features/admin";

export function AdminDepotsPage() {
  const depotsQuery = useDepots();
  const districtsQuery = useDistricts();
  const outletsQuery = useOutlets();
  const depots = depotsQuery.data ?? [];
  const districts = districtsQuery.data ?? [];
  const outlets = outletsQuery.data ?? [];

  const isLoading =
    depotsQuery.isLoading || districtsQuery.isLoading || outletsQuery.isLoading;

  return (
    <AdminCrudShell
      title="Distribution Depots"
      description="Primary distribution hubs, home return bases, and regional vehicle staging docks"
      actions={
        <Button
          variant="outline"
          size="xs"
          className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
          onClick={() => depotsQuery.refetch()}
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
      <QueryState
        isLoading={isLoading}
        error={depotsQuery.error}
        isEmpty={depots.length === 0}
        onRetry={() => depotsQuery.refetch()}
        emptyMessage="No distribution depots found."
        loading={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto w-full">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {depots.map((depot) => (
            <DepotCard
              key={depot.id}
              depot={depot}
              districts={districts}
              outlets={outlets}
            />
          ))}
        </div>
      </QueryState>
    </AdminCrudShell>
  );
}

export default AdminDepotsPage;
