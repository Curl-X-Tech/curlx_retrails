import * as React from "react";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader, FilterBar, DataTable } from "@/components/shared";
import {
  useAdminOperatingDays,
  useAdminDemandSurge,
  CalendarKpiStrip,
  CalendarFilterControls,
  getCalendarColumns,
  sortCalendarDays,
  type CalendarSortKey,
  type CalendarDay,
  type DemandSurge,
} from "@/features/admin";

export function AdminCalendarPage() {
  const [daysCount, setDaysCount] = React.useState(30);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [monsoonFilter, setMonsoonFilter] = React.useState("all");
  const [surgeFilter, setSurgeFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<CalendarSortKey | null>("date");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 15;

  const {
    data: operatingDays = [],
    isLoading: isCalLoading,
    refetch: refetchCal,
  } = useAdminOperatingDays(daysCount);
  const {
    data: surgeData = [],
    isLoading: isSurgeLoading,
    refetch: refetchSurge,
  } = useAdminDemandSurge();
  const isLoading = isCalLoading || isSurgeLoading;

  const handleRefresh = () => {
    refetchCal();
    refetchSurge();
  };

  const surgeMap = React.useMemo(() => {
    const map = new Map<string, number>();
    surgeData.forEach((s: DemandSurge) => map.set(s.date, s.surge_multiplier));
    return map;
  }, [surgeData]);

  const peakSurge = React.useMemo(() => {
    if (surgeData.length === 0) return null;
    return Math.max(...surgeData.map((d: DemandSurge) => d.surge_multiplier));
  }, [surgeData]);

  const getSurgeMultiplier = React.useCallback(
    (date: string) => surgeMap.get(date) || 1.0,
    [surgeMap]
  );

  const filteredDays = React.useMemo(() => {
    return operatingDays.filter((day: CalendarDay) => {
      const surgeMultiplier = getSurgeMultiplier(day.date);
      if (monsoonFilter === "monsoon" && !day.monsoon) return false;
      if (monsoonFilter === "clear" && day.monsoon) return false;
      if (surgeFilter === "surging" && surgeMultiplier <= 1.0) return false;
      if (surgeFilter === "standard" && surgeMultiplier > 1.0) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        day.date.toLowerCase().includes(q) ||
        (day.dow_name || "").toLowerCase().includes(q) ||
        (day.festival || "").toLowerCase().includes(q)
      );
    });
  }, [operatingDays, monsoonFilter, surgeFilter, searchQuery, getSurgeMultiplier]);

  const sortedDays = React.useMemo(
    () => sortCalendarDays(filteredDays, sortKey, sortDirection, getSurgeMultiplier),
    [filteredDays, sortKey, sortDirection, getSurgeMultiplier]
  );

  const totalPages = Math.max(1, Math.ceil(sortedDays.length / pageSize));
  const paginatedDays = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDays.slice(start, start + pageSize);
  }, [sortedDays, currentPage, pageSize]);

  const columns = React.useMemo(
    () => getCalendarColumns({ getSurgeMultiplier }),
    [getSurgeMultiplier]
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card">
        <PageHeader
          className="mb-0"
          title="2026 Logistics Operating Calendar"
          description="Dispatch schedule days, seasonal weather conditions, and festival demand multipliers (SLST UTC+05:30)"
          actions={
            <Button
              variant="outline"
              size="xs"
              className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
              onClick={handleRefresh}
            >
              <ArrowsClockwiseIcon className="size-3 text-muted-foreground" />
              <span>Refresh</span>
            </Button>
          }
        />
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20">
        <CalendarKpiStrip operatingDays={operatingDays} peakSurge={peakSurge} />
      </div>

      <div className="flex-1 p-4 sm:p-6 flex flex-col min-h-0 space-y-3 overflow-hidden">
        <FilterBar
          search={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          placeholder="Search date, day of week, festival..."
          filters={
            <CalendarFilterControls
              monsoonFilter={monsoonFilter}
              onMonsoonChange={(f) => {
                setMonsoonFilter(f);
                setCurrentPage(1);
              }}
              surgeFilter={surgeFilter}
              onSurgeChange={(s) => {
                setSurgeFilter(s);
                setCurrentPage(1);
              }}
              daysCount={daysCount}
              onDaysCountChange={(d) => {
                setDaysCount(d);
                setCurrentPage(1);
              }}
            />
          }
          onReset={() => {
            setSearchQuery("");
            setMonsoonFilter("all");
            setSurgeFilter("all");
            setCurrentPage(1);
          }}
          activeCount={
            (monsoonFilter !== "all" ? 1 : 0) + (surgeFilter !== "all" ? 1 : 0)
          }
        />

        <DataTable
          columns={columns}
          data={paginatedDays}
          isLoading={isLoading}
          sortKey={sortKey || undefined}
          sortDirection={sortDirection}
          onSort={(key) => {
            if (sortKey === key)
              setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
            else {
              setSortKey(key as CalendarSortKey);
              setSortDirection("asc");
            }
          }}
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
          emptyMessage="No calendar records found."
          keyExtractor={(d) => d.date}
        />
      </div>
    </div>
  );
}

export default AdminCalendarPage;
