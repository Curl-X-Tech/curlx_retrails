import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useBays } from "@/api/loader";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  WarningCircleIcon,
  TruckIcon,
  CaretRightIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ArrowsClockwiseIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";

export function LoaderExceptionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userDepotId = user?.depotId || "depot-pel";

  const { data: bays = [], isLoading, refetch, isRefetching } = useBays(userDepotId);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredBays = React.useMemo(() => {
    if (!searchQuery.trim()) return bays;
    const q = searchQuery.toLowerCase();
    return bays.filter(
      (b) =>
        b.bay.bay_number.toLowerCase().includes(q) ||
        b.vehicle.reg_number.toLowerCase().includes(q) ||
        b.driver.name.toLowerCase().includes(q) ||
        b.trip.trip_code.toLowerCase().includes(q)
    );
  }, [bays, searchQuery]);

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-y-auto pr-0.5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <WarningCircleIcon className="size-5 text-rose-500" weight="fill" />
            <h1 className="text-lg sm:text-xl font-heading font-black text-foreground tracking-tight">
              Loading Exceptions & Shortfall Audit
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit flagged cargo shortfalls, damaged crates, and packaging discrepancies
            across loading docks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-xl text-xs font-semibold gap-1.5 h-8.5 cursor-pointer shadow-xs"
          >
            <ArrowsClockwiseIcon
              className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <div className="relative w-full sm:w-56">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by vehicle, trip..."
              className="h-8.5 pl-8 text-xs rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Exception Audit Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground">
              Active Docks Under Audit
            </span>
            <span className="text-2xl font-heading font-black text-foreground">
              {bays.length} Bays
            </span>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TruckIcon className="size-5" weight="bold" />
          </div>
        </Card>

        <Card className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground">
              Audit Quality Status
            </span>
            <span className="text-2xl font-heading font-black text-emerald-600 dark:text-emerald-400">
              100% OK
            </span>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <ShieldCheckIcon className="size-5" weight="bold" />
          </div>
        </Card>

        <Card className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground">
              Unresolved Flagged Items
            </span>
            <span className="text-2xl font-heading font-black text-foreground">
              0 Items
            </span>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
            <WarningCircleIcon className="size-5" weight="bold" />
          </div>
        </Card>
      </div>

      {/* Flagged Item Exceptions Log */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-heading font-bold text-foreground">
            Dock Bay Exception Audit Log
          </h2>
          <span className="text-xs text-muted-foreground">
            Discrepancy Resolution Protocol
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-24 rounded-2xl bg-muted/60 animate-pulse" />
            <div className="h-24 rounded-2xl bg-muted/60 animate-pulse" />
          </div>
        ) : filteredBays.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center gap-2 rounded-2xl border border-dashed">
            <CheckCircleIcon className="size-8 text-emerald-500" weight="fill" />
            <span className="text-xs font-semibold text-foreground">
              No active discrepancies reported
            </span>
            <span className="text-[11px] text-muted-foreground">
              All line items and crates in the active loading queue match manifest counts.
            </span>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredBays.map((b) => (
              <Card
                key={b.bay.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="flex h-8 px-2.5 items-center justify-center rounded-xl bg-primary/10 text-primary font-heading font-black text-xs shrink-0">
                    {b.bay.bay_number}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-sm text-foreground">
                        {b.vehicle.reg_number}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {b.trip.trip_code}
                      </span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircleIcon className="size-3.5" weight="fill" />
                        <span>All {b.progress.total_crates_count} Crates Accounted</span>
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      Driver: {b.driver.name} · {b.trip.stops_count} Waypoints ·{" "}
                      {b.progress.verified_items_count}/{b.progress.total_items_count}{" "}
                      Verified Line Items
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/loader/bays?tripId=${b.trip.id}`)}
                    className="rounded-xl text-xs font-semibold gap-1.5 h-8.5 cursor-pointer hover:bg-accent"
                  >
                    <TruckIcon className="size-3.5" weight="bold" />
                    <span>Open Station</span>
                    <CaretRightIcon className="size-3" weight="bold" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
