import * as React from "react";
import { ArrowsClockwiseIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminCrudShell, QueryState } from "@/components/shared";
import { useDepots, useDistricts, useOutlets } from "@/api/master";
import {
  DepotKpiStrip,
  DepotCard,
  DepotDialogs,
  type DialogState,
  type MasterDepot,
} from "@/features/admin";

export function AdminDepotsPage() {
  const [dialog, setDialog] = React.useState<DialogState<MasterDepot>>(null);
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={() => depotsQuery.refetch()}
          >
            <ArrowsClockwiseIcon className="size-3 text-muted-foreground" />
            <span>Refresh</span>
          </Button>
          <Button
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={() => setDialog({ kind: "create" })}
          >
            <PlusIcon className="size-3" />
            <span>Add Depot</span>
          </Button>
        </div>
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
              actions={{
                onEdit: (row) => setDialog({ kind: "edit", row }),
                onDelete: (row) => setDialog({ kind: "delete", row }),
              }}
            />
          ))}
        </div>
      </QueryState>
      <DepotDialogs state={dialog} onClose={() => setDialog(null)} />
    </AdminCrudShell>
  );
}

export default AdminDepotsPage;
