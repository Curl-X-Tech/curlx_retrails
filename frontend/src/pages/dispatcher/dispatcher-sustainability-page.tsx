import { useState, useMemo } from "react";
import { useAllocations } from "@/api/allocations";
import { useVehicles } from "@/api/fleet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CircularProgressRing } from "@/components/shared/circular-progress-ring";
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  TrendUpIcon,
  DropIcon,
  SparkleIcon,
  GlobeHemisphereWestIcon,
  MagnifyingGlassIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";

interface SustainabilityRow {
  id: string;
  route: string;
  vehicle: string;
  distanceKm: number;
  fuelUsedL: number;
  kmPerL: number;
  co2Kg: number;
  emptyKm: number;
  efficiencyScore: string;
}

const PAGE_SIZE = 6;

export function DispatcherSustainabilityPage() {
  const [search, setSearch] = useState("");
  const [groupByGrade, setGroupByGrade] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: allocations = [], isLoading: allocLoading } = useAllocations();
  const { data: vehicles = [], isLoading: fleetLoading } = useVehicles();

  const rows: SustainabilityRow[] = useMemo(() => {
    return allocations.map((a, i) => {
      const v = vehicles.find((veh) => veh.id === a.vehicle_id || veh.reg_number === a.vehicle_reg_number);
      const kmPerL = v?.km_per_l ?? 7.5;
      const distance = a.total_distance_km ?? 35 + i * 12;
      const fuelUsed = Number((distance / kmPerL).toFixed(1));
      const co2 = Number((fuelUsed * 2.68).toFixed(1));
      const emptyKm = Number((distance * 0.08).toFixed(1));
      const grade = a.weight_utilization_pct >= 85 ? "A+" : a.weight_utilization_pct >= 70 ? "A" : "B";

      return {
        id: a.trip_code,
        route: a.district_name ? `${a.district_name} Corridor` : `Corridor ${i + 1}`,
        vehicle: a.vehicle_reg_number ?? a.vehicle_id,
        distanceKm: distance,
        fuelUsedL: fuelUsed,
        kmPerL,
        co2Kg: co2,
        emptyKm,
        efficiencyScore: grade,
      };
    });
  }, [allocations, vehicles]);

  const filteredData = useMemo(() => {
    return rows.filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return r.route.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.vehicle.toLowerCase().includes(q);
    });
  }, [rows, search]);

  const groups = useMemo(() => {
    if (!groupByGrade) return null;
    const map = new Map<string, SustainabilityRow[]>();
    for (const r of filteredData) {
      const key = `Grade ${r.efficiencyScore}`;
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filteredData, groupByGrade]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, currentPage]);

  const totalFuel = rows.reduce((sum, r) => sum + r.fuelUsedL, 0);
  const totalCo2 = rows.reduce((sum, r) => sum + r.co2Kg, 0);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">Sustainability & Carbon Metrics</h1>
          <Badge variant="warning" className="text-[10px] h-5 px-1.5 font-bold uppercase">DEMO</Badge>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <GlobeHemisphereWestIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">CO2 Total:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] tabular-nums">{totalCo2.toFixed(1)} kg</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <SparkleIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Empty Miles Cut:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">18.4%</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <DropIcon className="size-3.5 text-sky-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Total Burn:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">{totalFuel.toFixed(1)} L</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <TrendUpIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Eco Index:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] tabular-nums">A (94.2)</span>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search route or corridor..."
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
            variant={groupByGrade ? "default" : "outline"}
            size="xs"
            onClick={() => setGroupByGrade(!groupByGrade)}
            className="h-7 px-2.5 text-[11px] font-semibold cursor-pointer rounded-lg"
          >
            <SquaresFourIcon className="size-3 mr-1" />
            Group by Eco Grade
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 margin-responsive py-3 sm:py-4 overflow-hidden flex flex-col space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
          <Card className="p-3 bg-card border border-border/80 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-muted-foreground">Logistics Decarbonization Score</span>
              <div className="text-xl font-bold font-heading text-foreground">94.2%</div>
              <p className="text-[11px] text-muted-foreground">High-density multi-drop route optimization</p>
            </div>
            <CircularProgressRing value={94} size={44} strokeWidth={4.5} colorClassName="text-emerald-500" />
          </Card>
          <Card className="p-3 bg-card border border-border/80 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-muted-foreground">Deadhead Reduction Ratio</span>
              <div className="text-xl font-bold font-heading text-foreground">18.4%</div>
              <p className="text-[11px] text-muted-foreground">Total empty kilometers eliminated today</p>
            </div>
            <CircularProgressRing value={82} size={44} strokeWidth={4.5} colorClassName="text-primary" />
          </Card>
        </div>

        <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="text-muted-foreground text-[11px] tabular-nums">
              Showing <span className="font-bold text-foreground">{filteredData.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
              <span className="font-bold text-foreground">{Math.min(currentPage * PAGE_SIZE, filteredData.length)}</span> of{" "}
              <span className="font-bold text-foreground">{filteredData.length}</span> corridors
            </div>

            {!groupByGrade && (
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
                  <TableHead className="w-[180px] font-bold text-foreground text-xs">Trip & Corridor</TableHead>
                  <TableHead className="w-[120px] font-bold text-foreground text-xs">Distance</TableHead>
                  <TableHead className="w-[160px] font-bold text-foreground text-xs">Fuel Consumed</TableHead>
                  <TableHead className="w-[150px] font-bold text-foreground text-xs">Carbon Footprint</TableHead>
                  <TableHead className="w-[130px] font-bold text-foreground text-xs">Deadhead Run</TableHead>
                  <TableHead className="w-[90px] text-right font-bold text-foreground text-xs">Eco Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocLoading || fleetLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading sustainability metrics...</TableCell></TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No sustainability records available.</TableCell></TableRow>
                ) : groups ? (
                  groups.map(([groupName, groupRows]) => (
                    <div key={groupName} className="contents">
                      <TableRow className="bg-muted/40 border-b border-border/60">
                        <TableCell colSpan={6} className="py-2 px-4 font-bold text-foreground text-xs">
                          {groupName} <span className="ml-2 font-normal text-muted-foreground">({groupRows.length} corridors)</span>
                        </TableCell>
                      </TableRow>
                      {groupRows.map(renderSustainabilityRow)}
                    </div>
                  ))
                ) : (
                  paginatedData.map(renderSustainabilityRow)
                )}
              </TableBody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function renderSustainabilityRow(s: SustainabilityRow) {
  return (
    <TableRow key={s.id} className="border-b border-border/30 hover:bg-muted/30 text-xs">
      <TableCell className="py-2 px-4 whitespace-nowrap">
        <div className="font-semibold text-foreground">{s.route}</div>
        <div className="text-[11px] text-muted-foreground">{s.id} &bull; {s.vehicle}</div>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-foreground">{s.distanceKm} km</TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-foreground">
        {s.fuelUsedL} L <span className="text-muted-foreground text-[11px]">({s.kmPerL} km/L)</span>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-foreground font-medium">{s.co2Kg} kg CO2e</TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-muted-foreground">
        {s.emptyKm} km ({((s.emptyKm / s.distanceKm) * 100).toFixed(1)}%)
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-right">
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          {s.efficiencyScore}
        </span>
      </TableCell>
    </TableRow>
  );
}
