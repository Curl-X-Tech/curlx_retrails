import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useBays } from "@/api/loader";
import type { BayWithManifest } from "@/api/loader/types";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  WarningCircleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ArrowsClockwiseIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";

export function LoaderExceptionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userDepotId = user?.depotId || "depot-pel";

  const { data: bays = [], isLoading, refetch, isRefetching } = useBays(userDepotId);
  const [searchQuery, setSearchQuery] = React.useState("");

  const activeAndDispatchedBays = React.useMemo<BayWithManifest[]>(() => {
    return bays.filter((b) => b.trip.status !== "scheduled");
  }, [bays]);

  const flaggedBays = React.useMemo<BayWithManifest[]>(() => {
    return activeAndDispatchedBays.filter((b) => b.trip.status === "flagged");
  }, [activeAndDispatchedBays]);

  const dispatchedCount = React.useMemo<number>(() => {
    return activeAndDispatchedBays.filter(
      (b) =>
        b.trip.status === "dispatched" ||
        b.bay.dock_status === "departed" ||
        b.bay.dock_status === "verified_sealed"
    ).length;
  }, [activeAndDispatchedBays]);

  const filteredFlaggedBays = React.useMemo<BayWithManifest[]>(() => {
    if (!searchQuery.trim()) return flaggedBays;
    const q = searchQuery.toLowerCase();
    return flaggedBays.filter(
      (b) =>
        b.bay.bay_number.toLowerCase().includes(q) ||
        b.vehicle.reg_number.toLowerCase().includes(q) ||
        b.driver.name.toLowerCase().includes(q) ||
        b.trip.trip_code.toLowerCase().includes(q)
    );
  }, [flaggedBays, searchQuery]);

  return (
    <div className="w-full h-full flex flex-col gap-3 overflow-y-auto pr-0.5 pb-8">
      {/* Apple-style Minimalist Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 sm:p-4 rounded-2xl border border-border/80 shadow-xs">
        <div className="flex flex-col">
          <h1 className="text-xl font-heading font-black text-foreground tracking-tight">
            Exceptions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active cargo discrepancies and shortfall resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-xl text-xs font-semibold gap-1.5 h-8.5 cursor-pointer shadow-xs shrink-0"
            title="Refresh"
          >
            <ArrowsClockwiseIcon
              className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <div className="relative flex-1 sm:w-56">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter exceptions..."
              className="h-8.5 pl-8 text-xs rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Metric Tiles - Evaluated on processed and dispatched trips */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Discrepancies
          </span>
          <span className="text-xl font-heading font-black text-foreground">
            {flaggedBays.length}
          </span>
        </div>

        <div className="p-3 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Dispatched
          </span>
          <span className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400">
            {dispatchedCount}
          </span>
        </div>

        <div className="p-3 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Audit Accuracy
          </span>
          <span className="text-xl font-heading font-black text-foreground">
            {dispatchedCount > 0
              ? `${Math.round(((dispatchedCount - flaggedBays.length) / dispatchedCount) * 100)}%`
              : "100%"}
          </span>
        </div>
      </div>

      {/* Exception Records / Minimal Clean State */}
      <div className="flex flex-col gap-2.5">
        {isLoading ? (
          <div className="space-y-2.5">
            <div className="h-20 rounded-2xl bg-muted/60 animate-pulse" />
            <div className="h-20 rounded-2xl bg-muted/60 animate-pulse" />
          </div>
        ) : filteredFlaggedBays.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center gap-2 rounded-2xl border border-dashed bg-card/50">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon className="size-6" weight="fill" />
            </div>
            <span className="text-sm font-heading font-bold text-foreground">
              Zero Active Discrepancies
            </span>
            <p className="text-xs text-muted-foreground max-w-sm">
              All loaded and dispatched trips have completed full checklist verification with zero outstanding shortfalls.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredFlaggedBays.map((b) => (
              <Card
                key={b.bay.id}
                className="p-3 sm:p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-heading font-black text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary shrink-0">
                    {b.bay.bay_number}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-heading font-bold text-xs text-foreground">
                        {b.vehicle.reg_number}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-xs font-semibold text-foreground">
                        {b.trip.trip_code}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <WarningCircleIcon className="size-3" weight="fill" />
                        <span>Discrepancy Under Review</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {b.driver.name} · {b.progress.verified_items_count}/{b.progress.total_items_count} Items
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/loader/bays?tripId=${b.trip.id}`)}
                  className="rounded-xl text-xs font-semibold gap-1 h-7.5 px-2.5 cursor-pointer self-end sm:self-auto shrink-0"
                >
                  <span>Resolve in Bay</span>
                  <ArrowRightIcon className="size-3" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
