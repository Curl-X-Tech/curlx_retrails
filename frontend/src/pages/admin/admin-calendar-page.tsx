import * as React from "react";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { AdminCrudShell, DataTable } from "@/components/shared";
import { useOperatingDays, useDemandSurge } from "@/api/master";
import {
  CalendarKpiStrip,
  CalendarFilterControls,
  getCalendarColumns,
  type CalendarSortKey,
} from "@/features/admin";
import { useAdminCalendarFilter } from "@/features/admin/hooks/use-admin-calendar-filter";

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
    error: calendarError,
    refetch: refetchCal,
  } = useOperatingDays({ days: daysCount });
  const {
    data: surgeData = [],
    isLoading: isSurgeLoading,
    refetch: refetchSurge,
  } = useDemandSurge();

  const isLoading = isCalLoading || isSurgeLoading;

  const handleRefresh = () => {
    refetchCal();
    refetchSurge();
  };

  const { peakSurge, getSurgeMultiplier, paginatedDays, totalPages } =
    useAdminCalendarFilter({
      operatingDays,
      surgeData,
      monsoonFilter,
      surgeFilter,
      searchQuery,
      sortKey,
      sortDirection,
      currentPage,
      pageSize,
    });

  const columns = React.useMemo(
    () => getCalendarColumns({ getSurgeMultiplier }),
    [getSurgeMultiplier]
  );

  return (
    <AdminCrudShell
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
      kpi={<CalendarKpiStrip operatingDays={operatingDays} peakSurge={peakSurge} />}
      search={searchQuery}
      onSearchChange={(val) => {
        setSearchQuery(val);
        setCurrentPage(1);
      }}
      searchPlaceholder="Search date, day of week, festival..."
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
      onResetFilters={() => {
        setSearchQuery("");
        setMonsoonFilter("all");
        setSurgeFilter("all");
        setCurrentPage(1);
      }}
      activeFilterCount={
        (monsoonFilter !== "all" ? 1 : 0) + (surgeFilter !== "all" ? 1 : 0)
      }
    >
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
        emptyMessage={
          calendarError
            ? `Failed to load calendar: ${calendarError.message}`
            : "No calendar records found."
        }
        keyExtractor={(d) => d.date}
      />
    </AdminCrudShell>
  );
}

export default AdminCalendarPage;
