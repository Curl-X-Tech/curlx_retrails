import { useNavigate } from "react-router-dom";
import { useBays } from "@/api/loader";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { DashboardKPIs, DashboardCharts } from "@/features/loader";
import {
  ListBulletsIcon,
  ArrowsClockwiseIcon,
  WarningOctagonIcon,
} from "@phosphor-icons/react";

export function LoaderDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userDepotId = user?.depotId || "depot-pel";

  const { data: bays = [], refetch, isRefetching } = useBays(userDepotId);

  const activeBays = bays.filter((b) => b.bay.dock_status === "docked_loading");
  const readyBays = bays.filter((b) => b.bay.dock_status === "verified_sealed");
  const departedBays = bays.filter((b) => b.bay.dock_status === "departed");

  const totalCrates = bays.reduce((acc, b) => acc + b.progress.total_crates_count, 0);
  const verifiedCrates = bays.reduce(
    (acc, b) => acc + b.progress.verified_crates_count,
    0
  );

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-y-auto pr-0.5 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/95 backdrop-blur-md p-4 rounded-2xl border border-border/80 shadow-xs">
        <div className="flex flex-col">
          <h1 className="text-lg sm:text-xl font-heading font-black text-foreground tracking-tight">
            Dock Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bay loading status, crate verification progress, and cargo capacity.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-xl text-xs font-semibold gap-1.5 h-8.5 cursor-pointer shadow-xs shrink-0"
            title="Refresh Data"
          >
            <ArrowsClockwiseIcon
              className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/loader/exceptions")}
            className="rounded-xl text-xs font-semibold gap-1.5 h-8.5 cursor-pointer shadow-xs text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 flex-1 sm:flex-none justify-center"
          >
            <WarningOctagonIcon className="size-3.5 shrink-0" weight="bold" />
            <span className="truncate">Exceptions</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => navigate("/loader/manifests")}
            className="rounded-xl text-xs font-semibold gap-1.5 h-8.5 cursor-pointer shadow-xs flex-1 sm:flex-none justify-center"
          >
            <ListBulletsIcon className="size-3.5 shrink-0" weight="bold" />
            <span className="truncate">Manifests</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <DashboardKPIs
        activeCount={activeBays.length}
        readyCount={readyBays.length}
        flaggedCount={0}
        dispatchedCount={departedBays.length}
        totalCrates={totalCrates}
        verifiedCrates={verifiedCrates}
      />

      {/* Visual Analytics & Capacity Meters */}
      <DashboardCharts bays={bays} />
    </div>
  );
}
