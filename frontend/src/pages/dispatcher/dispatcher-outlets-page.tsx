import { useState, useMemo } from "react";
import { useOutlets } from "@/api/master/outlets-hooks";
import type { Outlet } from "@/api/master/entities";
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
  ClockIcon,
  MapPinIcon,
  StorefrontIcon,
  MagnifyingGlassIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";

const PAGE_SIZE = 8;

export function DispatcherOutletsPage() {
  const [search, setSearch] = useState("");
  const [groupByDock, setGroupByDock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: outlets = [], isLoading } = useOutlets();

  const filteredOutlets = useMemo(() => {
    return outlets.filter((o) => {
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        o.name.toLowerCase().includes(query) ||
        o.outlet_id.toLowerCase().includes(query) ||
        o.dock_type.toLowerCase().includes(query)
      );
    });
  }, [outlets, search]);

  const groups = useMemo(() => {
    if (!groupByDock) return null;
    const map = new Map<string, Outlet[]>();
    for (const o of filteredOutlets) {
      const key = `${o.dock_type.toUpperCase().replace("_", " ")} (${o.parking_constraint})`;
      const list = map.get(key) ?? [];
      list.push(o);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filteredOutlets, groupByDock]);

  const totalPages = Math.max(1, Math.ceil(filteredOutlets.length / PAGE_SIZE));
  const paginatedOutlets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOutlets.slice(start, start + PAGE_SIZE);
  }, [filteredOutlets, currentPage]);

  const mallBaysCount = outlets.filter(
    (o) => o.dock_type === "mall_bay" || o.parking_constraint === "mall_dock"
  ).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
            Retail Outlets & Windows
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Directory of retail stores, wall-clock delivery windows, and bay constraints
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <StorefrontIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Total Outlets:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            {outlets.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <ClockIcon className="size-3.5 text-sky-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Window Adherence:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] tabular-nums">
            100%
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <MapPinIcon className="size-3.5 text-amber-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Mall Bays:</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            {mallBaysCount}
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search name, code or dock..."
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
            variant={groupByDock ? "default" : "outline"}
            size="xs"
            onClick={() => setGroupByDock(!groupByDock)}
            className="h-7 px-2.5 text-[11px] font-semibold cursor-pointer rounded-lg"
          >
            <SquaresFourIcon className="size-3 mr-1" />
            Group by Dock Type
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 margin-responsive py-4 sm:py-5 overflow-hidden flex flex-col">
        <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="text-muted-foreground text-[11px] tabular-nums">
              Showing{" "}
              <span className="font-bold text-foreground">
                {filteredOutlets.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-foreground">
                {Math.min(currentPage * PAGE_SIZE, filteredOutlets.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-foreground">{filteredOutlets.length}</span>{" "}
              stores
            </div>

            {!groupByDock && (
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
                  <TableHead className="w-[200px] font-bold text-foreground text-xs">
                    Outlet Code & Name
                  </TableHead>
                  <TableHead className="w-[180px] font-bold text-foreground text-xs">
                    Dock & Parking
                  </TableHead>
                  <TableHead className="w-[180px] font-bold text-foreground text-xs">
                    Operating Window
                  </TableHead>
                  <TableHead className="w-[150px] font-bold text-foreground text-xs">
                    Handling
                  </TableHead>
                  <TableHead className="w-[120px] text-right font-bold text-foreground text-xs">
                    Contact
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
                      Loading retail outlets...
                    </TableCell>
                  </TableRow>
                ) : filteredOutlets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No retail outlets found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : groups ? (
                  groups.map(([groupName, groupOutlets]) => (
                    <div key={groupName} className="contents">
                      <TableRow className="bg-muted/40 border-b border-border/60">
                        <TableCell
                          colSpan={5}
                          className="py-2 px-4 font-bold text-foreground text-xs"
                        >
                          {groupName}{" "}
                          <span className="ml-2 font-normal text-muted-foreground">
                            ({groupOutlets.length} stores)
                          </span>
                        </TableCell>
                      </TableRow>
                      {groupOutlets.map(renderOutletRow)}
                    </div>
                  ))
                ) : (
                  paginatedOutlets.map(renderOutletRow)
                )}
              </TableBody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function renderOutletRow(o: Outlet) {
  const isMall = o.dock_type === "mall_bay" || o.parking_constraint === "mall_dock";
  return (
    <TableRow key={o.id} className="border-b border-border/30 hover:bg-muted/30 text-xs">
      <TableCell className="py-2 px-4 whitespace-nowrap">
        <div className="font-semibold text-foreground">{o.name}</div>
        <div className="text-[11px] text-muted-foreground">{o.outlet_id}</div>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPinIcon className="size-3.5 text-primary shrink-0" />
          <span className="capitalize font-medium text-foreground">
            {o.dock_type.replace("_", " ")}
          </span>
          <span className="text-[11px]">({o.parking_constraint})</span>
        </div>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-foreground">
          <ClockIcon className="size-3.5 text-sky-500 shrink-0" />
          <span className="font-medium">
            {o.window_open_time} &ndash; {o.window_close_time}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap">
        {isMall ? (
          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/15 text-amber-600">
            MAL (Mall Bay)
          </span>
        ) : (
          <span className="text-muted-foreground">Standard Dock</span>
        )}
      </TableCell>
      <TableCell className="py-2 px-4 whitespace-nowrap text-right text-muted-foreground">
        {o.contact_phone || "N/A"}
      </TableCell>
    </TableRow>
  );
}
