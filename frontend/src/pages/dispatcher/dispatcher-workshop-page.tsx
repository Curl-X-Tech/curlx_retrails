import { useState, useMemo } from "react";
import { useVehicles, useUpdateVehicle, type Vehicle } from "@/api/fleet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  WrenchIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  TruckIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";

const PAGE_SIZE = 8;

export function DispatcherWorkshopPage() {
  const [search, setSearch] = useState("");
  const [groupByStatus, setGroupByStatus] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: vehicles = [], isLoading } = useVehicles();
  const updateVehicle = useUpdateVehicle();

  const maintenanceVehicles = useMemo(() => {
    return vehicles.filter(
      (v) =>
        (v.status === "in_workshop" || v.status === "breakdown") &&
        (!search.trim() ||
          v.reg_number.toLowerCase().includes(search.toLowerCase()) ||
          v.model_name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [vehicles, search]);

  const groups = useMemo(() => {
    if (!groupByStatus) return null;
    const map = new Map<string, Vehicle[]>();
    for (const v of maintenanceVehicles) {
      const key =
        v.status === "breakdown"
          ? "Breakdown & Emergency Repairs"
          : "Scheduled Service & Inspection";
      const list = map.get(key) ?? [];
      list.push(v);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [maintenanceVehicles, groupByStatus]);

  const totalPages = Math.max(1, Math.ceil(maintenanceVehicles.length / PAGE_SIZE));
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return maintenanceVehicles.slice(start, start + PAGE_SIZE);
  }, [maintenanceVehicles, currentPage]);

  const totalMaintenance = vehicles.filter(
    (v) => v.status === "in_workshop" || v.status === "breakdown"
  ).length;
  const readyFleet = vehicles.filter((v) => v.status === "available").length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
            Workshop & Maintenance Log
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Monitor vehicle servicing, reefer calibration, and return-to-service readiness
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg shadow-2xs">
          <WrenchIcon className="size-3.5 text-amber-600 shrink-0" />
          <span className="text-amber-700 dark:text-amber-300 text-[11px] font-bold">
            In Workshop:
          </span>
          <span className="font-bold text-amber-700 dark:text-amber-300 text-[11px] tabular-nums">
            {totalMaintenance}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <CheckCircleIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Ready Fleet:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            {readyFleet}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <TruckIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Total Units:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            {vehicles.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <ClockIcon className="size-3.5 text-sky-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Avg Downtime:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            4.2 hrs
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search workshop units..."
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

      <div className="flex-1 min-h-0 margin-responsive py-4 sm:py-5 overflow-hidden flex flex-col">
        <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="text-muted-foreground text-[11px] tabular-nums">
              Showing{" "}
              <span className="font-bold text-foreground">
                {maintenanceVehicles.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-foreground">
                {Math.min(currentPage * PAGE_SIZE, maintenanceVehicles.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-foreground">
                {maintenanceVehicles.length}
              </span>{" "}
              units
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
                    Plate & Model
                  </TableHead>
                  <TableHead className="w-[200px] font-bold text-foreground text-xs">
                    Specifications
                  </TableHead>
                  <TableHead className="w-[240px] font-bold text-foreground text-xs">
                    Service Reason
                  </TableHead>
                  <TableHead className="w-[120px] text-right font-bold text-foreground text-xs">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Loading workshop units...
                    </TableCell>
                  </TableRow>
                ) : maintenanceVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No vehicles currently in the workshop. All units operational.
                    </TableCell>
                  </TableRow>
                ) : groups ? (
                  groups.map(([groupName, groupVehicles]) => (
                    <div key={groupName} className="contents">
                      <TableRow className="bg-muted/40 border-b border-border/60">
                        <TableCell
                          colSpan={4}
                          className="py-2 px-4 font-bold text-foreground text-xs"
                        >
                          {groupName}{" "}
                          <span className="ml-2 font-normal text-muted-foreground">
                            ({groupVehicles.length} units)
                          </span>
                        </TableCell>
                      </TableRow>
                      {groupVehicles.map((v) =>
                        renderWorkshopRow(
                          v,
                          updateVehicle.mutate,
                          updateVehicle.isPending
                        )
                      )}
                    </div>
                  ))
                ) : (
                  paginatedVehicles.map((v) =>
                    renderWorkshopRow(v, updateVehicle.mutate, updateVehicle.isPending)
                  )
                )}
              </TableBody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function renderWorkshopRow(
  v: Vehicle,
  mutate: (params: { id: string; payload: { status: "available" } }) => void,
  isPending: boolean
) {
  return (
    <TableRow key={v.id} className="border-b border-border/30 hover:bg-muted/30 text-xs">
      <TableCell className="py-2 px-4 whitespace-nowrap">
        <div className="font-semibold text-foreground">{v.reg_number}</div>
        <div className="text-[11px] text-muted-foreground">{v.model_name}</div>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-muted-foreground">
        <span className="font-medium text-foreground uppercase">{v.type}</span> &bull;{" "}
        {v.temp.toUpperCase()} &bull; {v.weight_cap_kg.toLocaleString()} kg
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <WarningCircleIcon className="size-4 shrink-0" />
          <span>
            {v.status === "breakdown"
              ? "Urgent Mechanical Repair"
              : "Routine Inspection & Calibration"}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-right">
        <Button
          variant="outline"
          size="xs"
          disabled={isPending}
          onClick={() => mutate({ id: v.id, payload: { status: "available" } })}
          className="h-7 text-[11px] gap-1 text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10 cursor-pointer rounded-lg"
        >
          <CheckCircleIcon className="size-3" />
          <span>Mark Ready</span>
        </Button>
      </TableCell>
    </TableRow>
  );
}
