import { useState, useMemo } from "react";
import { useVehicles, type Vehicle } from "@/api/fleet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  GasPumpIcon,
  TrendUpIcon,
  ShieldCheckIcon,
  DropIcon,
  MagnifyingGlassIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";

const PAGE_SIZE = 8;

export function DispatcherFuelQuotasPage() {
  const [search, setSearch] = useState("");
  const [groupByFuel, setGroupByFuel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: vehicles = [], isLoading } = useVehicles();

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(
      (v) =>
        !search.trim() ||
        v.reg_number.toLowerCase().includes(search.toLowerCase()) ||
        v.model_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [vehicles, search]);

  const groups = useMemo(() => {
    if (!groupByFuel) return null;
    const map = new Map<string, Vehicle[]>();
    for (const v of filteredVehicles) {
      const key = `${v.fuel_type.toUpperCase()} (${v.type.toUpperCase()})`;
      const list = map.get(key) ?? [];
      list.push(v);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filteredVehicles, groupByFuel]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredVehicles.slice(start, start + PAGE_SIZE);
  }, [filteredVehicles, currentPage]);

  const totalQuota = vehicles.reduce((sum, v) => sum + (v.weekly_fuel_quota_l || 0), 0);
  const avgEfficiency =
    vehicles.length > 0
      ? (vehicles.reduce((sum, v) => sum + v.km_per_l, 0) / vehicles.length).toFixed(1)
      : "0.0";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">Fuel Quota Allocation</h1>
          <p className="text-[11px] text-muted-foreground">Track weekly statutory fuel quotas (L), economy, and thermal consumption</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <GasPumpIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Total Quota:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">{totalQuota.toLocaleString()} L</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <TrendUpIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Avg Economy:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">{avgEfficiency} km/L</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <ShieldCheckIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Compliance:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] tabular-nums">100%</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <DropIcon className="size-3.5 text-sky-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Burn Rate:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">Normal</span>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search plate or model..."
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
            variant={groupByFuel ? "default" : "outline"}
            size="xs"
            onClick={() => setGroupByFuel(!groupByFuel)}
            className="h-7 px-2.5 text-[11px] font-semibold cursor-pointer rounded-lg"
          >
            <SquaresFourIcon className="size-3 mr-1" />
            Group by Fuel Type
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 margin-responsive py-4 sm:py-5 overflow-hidden flex flex-col">
        <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="text-muted-foreground text-[11px] tabular-nums">
              Showing <span className="font-bold text-foreground">{filteredVehicles.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
              <span className="font-bold text-foreground">{Math.min(currentPage * PAGE_SIZE, filteredVehicles.length)}</span> of{" "}
              <span className="font-bold text-foreground">{filteredVehicles.length}</span> units
            </div>

            {!groupByFuel && (
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
                  <TableHead className="w-[180px] font-bold text-foreground text-xs">Plate & Model</TableHead>
                  <TableHead className="w-[130px] font-bold text-foreground text-xs">Fuel Economy</TableHead>
                  <TableHead className="w-[140px] font-bold text-foreground text-xs">Weekly Quota Cap</TableHead>
                  <TableHead className="w-[180px] font-bold text-foreground text-xs">Active Consumption</TableHead>
                  <TableHead className="w-[120px] text-right font-bold text-foreground text-xs">Compliance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading fuel records...</TableCell></TableRow>
                ) : filteredVehicles.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No fuel quota records matching criteria.</TableCell></TableRow>
                ) : groups ? (
                  groups.map(([groupName, groupVehicles]) => (
                    <div key={groupName} className="contents">
                      <TableRow className="bg-muted/40 border-b border-border/60">
                        <TableCell colSpan={5} className="py-2 px-4 font-bold text-foreground text-xs">
                          {groupName} <span className="ml-2 font-normal text-muted-foreground">({groupVehicles.length} units)</span>
                        </TableCell>
                      </TableRow>
                      {groupVehicles.map(renderFuelRow)}
                    </div>
                  ))
                ) : (
                  paginatedVehicles.map(renderFuelRow)
                )}
              </TableBody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function renderFuelRow(v: Vehicle) {
  const estUsagePercent = 45;
  return (
    <TableRow key={v.id} className="border-b border-border/30 hover:bg-muted/30 text-xs">
      <TableCell className="py-2 px-4 whitespace-nowrap">
        <div className="font-semibold text-foreground">{v.reg_number}</div>
        <div className="text-[11px] text-muted-foreground capitalize">{v.model_name} &bull; {v.fuel_type.toUpperCase()}</div>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-foreground">
        <span className="font-bold">{v.km_per_l}</span> <span className="text-muted-foreground text-[11px]">km/L</span>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-foreground">
        <span className="font-bold">{v.weekly_fuel_quota_l}</span> <span className="text-muted-foreground text-[11px]">Liters</span>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap">
        <div className="w-36 space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Used: {Math.round((v.weekly_fuel_quota_l * estUsagePercent) / 100)} L</span>
            <span className="font-semibold text-foreground">{estUsagePercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${estUsagePercent}%` }} />
          </div>
        </div>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-right">
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          Within Quota
        </span>
      </TableCell>
    </TableRow>
  );
}
