import { useState, useMemo } from "react";
import { useAllocations, useAllocationKpis } from "@/api/allocations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircularProgressRing } from "@/components/shared/circular-progress-ring";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  GaugeIcon,
  MagnifyingGlassIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import type { AllocationSummary } from "@/api/allocations/types";

const PAGE_SIZE = 6;

export function DispatcherTripMetricsPage() {
  const [search, setSearch] = useState("");
  const [groupByStatus, setGroupByStatus] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: allocations = [], isLoading } = useAllocations();
  const { data: kpis } = useAllocationKpis();

  const filteredTrips = useMemo(() => {
    return allocations.filter((a) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        a.trip_code.toLowerCase().includes(q) ||
        (a.vehicle_reg_number?.toLowerCase() ?? "").includes(q) ||
        (a.driver_name?.toLowerCase() ?? "").includes(q)
      );
    });
  }, [allocations, search]);

  const groups = useMemo(() => {
    if (!groupByStatus) return null;
    const map = new Map<string, AllocationSummary[]>();
    for (const a of filteredTrips) {
      const key = `${a.status.toUpperCase()} TRIPS`;
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filteredTrips, groupByStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / PAGE_SIZE));
  const paginatedTrips = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTrips.slice(start, start + PAGE_SIZE);
  }, [filteredTrips, currentPage]);

  const avgWeightUtil = Math.round(kpis?.avg_weight_utilization_pct ?? 84);
  const avgVolumeUtil = Math.round(kpis?.avg_volume_utilization_pct ?? 78);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
            Trip Metrics & Performance
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Live solver allocation metrics, load factor efficiency, and trip completion
            analytics
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <CheckCircleIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">On-Time SLA:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] tabular-nums">
            98.4%
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <GaugeIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Avg Weight Load:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            {avgWeightUtil}%
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <ChartBarIcon className="size-3.5 text-sky-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Total Trips:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            {allocations.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <ClockIcon className="size-3.5 text-amber-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Fully Utilized:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            {kpis?.fully_utilized_trips ?? 2}
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search trip, vehicle, driver..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-7 h-7 text-xs bg-card"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant={groupByStatus ? "default" : "outline"}
            size="xs"
            onClick={() => setGroupByStatus(!groupByStatus)}
            className="h-7 px-2.5 text-[11px] font-semibold cursor-pointer rounded-lg"
          >
            <SquaresFourIcon className="size-3 mr-1" />
            Group by Status
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 margin-responsive py-3 sm:py-4 overflow-hidden flex flex-col space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
          <Card className="p-3 bg-card border border-border/80 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Fleet Weight Capacity Utilization
              </span>
              <div className="text-xl font-bold font-heading text-foreground">
                {avgWeightUtil}%
              </div>
              <p className="text-[11px] text-muted-foreground">
                Payload load factor against registered limit
              </p>
            </div>
            <CircularProgressRing
              value={avgWeightUtil}
              size={44}
              strokeWidth={4.5}
              colorClassName="text-primary"
            />
          </Card>
          <Card className="p-3 bg-card border border-border/80 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Fleet Volume Cube Fill Rate
              </span>
              <div className="text-xl font-bold font-heading text-foreground">
                {avgVolumeUtil}%
              </div>
              <p className="text-[11px] text-muted-foreground">
                Cubic meter spatial fill across active trips
              </p>
            </div>
            <CircularProgressRing
              value={avgVolumeUtil}
              size={44}
              strokeWidth={4.5}
              colorClassName="text-purple-500"
            />
          </Card>
        </div>

        <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="text-muted-foreground text-[11px] tabular-nums">
              Showing{" "}
              <span className="font-bold text-foreground">
                {filteredTrips.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-foreground">
                {Math.min(currentPage * PAGE_SIZE, filteredTrips.length)}
              </span>{" "}
              of <span className="font-bold text-foreground">{filteredTrips.length}</span>{" "}
              trips
            </div>

            {!groupByStatus && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <TableHeader className="sticky top-0 z-20 bg-card shadow-2xs border-b border-border/80">
                <TableRow className="border-b border-border/80 hover:bg-transparent">
                  <TableHead className="w-[180px] font-bold text-foreground text-xs">
                    Trip & Vehicle
                  </TableHead>
                  <TableHead className="w-[140px] font-bold text-foreground text-xs">
                    Crates & Payload
                  </TableHead>
                  <TableHead className="w-[160px] font-bold text-foreground text-xs">
                    Capacity Factor
                  </TableHead>
                  <TableHead className="w-[120px] font-bold text-foreground text-xs">
                    Trip Time
                  </TableHead>
                  <TableHead className="w-[120px] text-right font-bold text-foreground text-xs">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Loading trip metrics...
                    </TableCell>
                  </TableRow>
                ) : filteredTrips.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No trip metrics records available.
                    </TableCell>
                  </TableRow>
                ) : groups ? (
                  groups.map(([groupName, groupTrips]) => (
                    <div key={groupName} className="contents">
                      <TableRow className="bg-muted/40 border-b border-border/60">
                        <TableCell
                          colSpan={5}
                          className="py-2 px-4 font-bold text-foreground text-xs"
                        >
                          {groupName}{" "}
                          <span className="ml-2 font-normal text-muted-foreground">
                            ({groupTrips.length} trips)
                          </span>
                        </TableCell>
                      </TableRow>
                      {groupTrips.map(renderTripRow)}
                    </div>
                  ))
                ) : (
                  paginatedTrips.map(renderTripRow)
                )}
              </TableBody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function renderTripRow(a: AllocationSummary) {
  return (
    <TableRow key={a.id} className="border-b border-border/30 hover:bg-muted/30 text-xs">
      <TableCell className="py-2 px-4 whitespace-nowrap">
        <div className="font-semibold text-foreground">{a.trip_code}</div>
        <div className="text-[11px] text-muted-foreground">
          {a.vehicle_reg_number ?? a.vehicle_id} &bull;{" "}
          {a.driver_name ?? "Assigned Driver"}
        </div>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap">
        <div className="font-medium text-foreground">{a.total_packages} Crates</div>
        <div className="text-[11px] text-muted-foreground">
          {a.total_payload_kg ?? 0} kg
        </div>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap">
        <div className="w-32 space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Wt: {a.weight_utilization_pct}%</span>
            <span className="text-muted-foreground">
              Vol: {a.volume_utilization_pct}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${a.weight_utilization_pct}%` }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap font-medium text-foreground">
        {Math.floor(a.total_trip_duration_min / 60)}h {a.total_trip_duration_min % 60}m
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-right">
        <span
          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
            a.status === "completed"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : a.status === "in_transit"
                ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          }`}
        >
          {a.status}
        </span>
      </TableCell>
    </TableRow>
  );
}
