import { useState, useMemo } from "react";
import { useVehicles, useUpdateVehicle, type Vehicle, type VehicleStatus } from "@/api/fleet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  TruckIcon,
  WrenchIcon,
  CheckCircleIcon,
  NavigationArrowIcon,
  ScalesIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";

const PAGE_SIZE = 8;

export function DispatcherVehiclesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [groupByType, setGroupByType] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: vehicles = [], isLoading } = useVehicles();
  const updateVehicle = useUpdateVehicle();

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
      const matchesSearch =
        !search.trim() ||
        v.reg_number.toLowerCase().includes(search.toLowerCase()) ||
        v.model_name.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [vehicles, statusFilter, search]);

  const groups = useMemo(() => {
    if (!groupByType) return null;
    const map = new Map<string, Vehicle[]>();
    for (const v of filteredVehicles) {
      const key = `${v.type.toUpperCase()} &bull; ${v.temp.toUpperCase()} MODE`;
      const list = map.get(key) ?? [];
      list.push(v);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filteredVehicles, groupByType]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredVehicles.slice(start, start + PAGE_SIZE);
  }, [filteredVehicles, currentPage]);

  const availableCount = vehicles.filter((v) => v.status === "available").length;
  const inTransitCount = vehicles.filter((v) => v.status === "in_transit").length;
  const workshopCount = vehicles.filter((v) => v.status === "in_workshop" || v.status === "breakdown").length;
  const totalWeight = vehicles.reduce((sum, v) => sum + v.weight_cap_kg, 0);
  const totalVolume = vehicles.reduce((sum, v) => sum + v.volume_cap_m3, 0);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">Fleet Vehicles</h1>
          <p className="text-[11px] text-muted-foreground">Commercial vehicle roster, temperature ratings, and maintenance states</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <TruckIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Vehicles:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">{vehicles.length}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <CheckCircleIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Available:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">{availableCount}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <NavigationArrowIcon className="size-3.5 text-sky-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">In Transit:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">{inTransitCount}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <WrenchIcon className="size-3.5 text-amber-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">In Workshop:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">{workshopCount}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Capacity:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">{(totalWeight / 1000).toFixed(1)} t</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <CubeIcon className="size-3.5 text-purple-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Volume:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">{totalVolume.toFixed(1)} m³</span>
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
          {["ALL", "available", "in_transit", "in_workshop"].map((tab) => (
            <Button
              key={tab}
              variant={statusFilter === tab ? "default" : "outline"}
              size="xs"
              className="h-7 text-[11px] cursor-pointer rounded-lg capitalize"
              onClick={() => {
                setStatusFilter(tab);
                setCurrentPage(1);
              }}
            >
              {tab === "ALL" ? "ALL" : tab.replace("_", " ")}
            </Button>
          ))}
          <Button
            variant={groupByType ? "default" : "outline"}
            size="xs"
            onClick={() => setGroupByType(!groupByType)}
            className="h-7 px-2.5 text-[11px] font-semibold cursor-pointer rounded-lg"
          >
            <SquaresFourIcon className="size-3 mr-1" />
            Group by Type
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

            {!groupByType && (
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
                  <TableHead className="w-[140px] font-bold text-foreground text-xs">Type & Mode</TableHead>
                  <TableHead className="w-[160px] font-bold text-foreground text-xs">Payload Capacity</TableHead>
                  <TableHead className="w-[160px] font-bold text-foreground text-xs">Fuel & Quota</TableHead>
                  <TableHead className="w-[120px] font-bold text-foreground text-xs">Status</TableHead>
                  <TableHead className="w-[120px] text-right font-bold text-foreground text-xs">Dispatch Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading fleet units...</TableCell></TableRow>
                ) : filteredVehicles.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No vehicles matching filter criteria.</TableCell></TableRow>
                ) : groups ? (
                  groups.map(([groupName, groupVehicles]) => (
                    <div key={groupName} className="contents">
                      <TableRow className="bg-muted/40 border-b border-border/60">
                        <TableCell colSpan={6} className="py-2 px-4 font-bold text-foreground text-xs">
                          <span dangerouslySetInnerHTML={{ __html: groupName }} />
                          <span className="ml-2 font-normal text-muted-foreground">({groupVehicles.length} units)</span>
                        </TableCell>
                      </TableRow>
                      {groupVehicles.map((v) => renderVehicleRow(v, updateVehicle.mutate, updateVehicle.isPending))}
                    </div>
                  ))
                ) : (
                  paginatedVehicles.map((v) => renderVehicleRow(v, updateVehicle.mutate, updateVehicle.isPending))
                )}
              </TableBody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function renderVehicleRow(
  v: Vehicle,
  mutate: (params: { id: string; payload: { status: VehicleStatus } }) => void,
  isPending: boolean
) {
  const colors: Record<VehicleStatus, string> = {
    available: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    in_transit: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    loading: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    in_workshop: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    breakdown: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  };

  return (
    <TableRow key={v.id} className="border-b border-border/30 hover:bg-muted/30 text-xs">
      <TableCell className="py-2 px-4 whitespace-nowrap">
        <div className="font-semibold text-foreground">{v.reg_number}</div>
        <div className="text-[11px] text-muted-foreground">{v.model_name}</div>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap">
        <div className="font-medium capitalize text-foreground">{v.type}</div>
        <div className="text-muted-foreground uppercase text-[10px] font-semibold">{v.temp} Mode</div>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-foreground font-medium">
        {v.weight_cap_kg.toLocaleString()} kg &bull; {v.volume_cap_m3} m³
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-muted-foreground">
        {v.km_per_l} km/L &bull; {v.weekly_fuel_quota_l} L/wk
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap">
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${colors[v.status]}`}>{v.status}</span>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1.5">
          {v.status === "available" && (
            <Button
              variant="outline"
              size="xs"
              disabled={isPending}
              onClick={() => mutate({ id: v.id, payload: { status: "in_workshop" } })}
              className="h-7 text-[11px] gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer rounded-lg"
            >
              <WrenchIcon className="size-3" />
              <span>Workshop</span>
            </Button>
          )}
          {(v.status === "in_workshop" || v.status === "breakdown") && (
            <Button
              variant="outline"
              size="xs"
              disabled={isPending}
              onClick={() => mutate({ id: v.id, payload: { status: "available" } })}
              className="h-7 text-[11px] gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer rounded-lg"
            >
              <CheckCircleIcon className="size-3" />
              <span>Release</span>
            </Button>
          )}
          {v.status === "in_transit" && <span className="text-xs text-muted-foreground">On Route</span>}
        </div>
      </TableCell>
    </TableRow>
  );
}
