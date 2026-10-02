import * as React from "react";
import {
  CalendarIcon,
  ArrowsClockwiseIcon,
  TrendUpIcon,
  CloudRainIcon,
  MagnifyingGlassIcon,
  CaretUpDownIcon,
  CaretUpIcon,
  CaretDownIcon,
  SunIcon,
  CoinsIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import {
  useUpcomingOperatingDays,
  useDemandSurge,
  type CalendarDay,
} from "@/hooks/use-master-data";

type SortKey = "date" | "dayOfWeek" | "operating" | "surge" | "monsoon";

function SortHeaderIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) {
  if (!active) {
    return (
      <CaretUpDownIcon className="size-3 text-muted-foreground/40 shrink-0 ml-0.5" />
    );
  }
  return direction === "asc" ? (
    <CaretUpIcon className="size-3 text-primary shrink-0 ml-0.5 font-bold" />
  ) : (
    <CaretDownIcon className="size-3 text-primary shrink-0 ml-0.5 font-bold" />
  );
}

export function AdminCalendarPage() {
  const [daysCount, setDaysCount] = React.useState<number>(30);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [monsoonFilter, setMonsoonFilter] = React.useState<string>("all");
  const [surgeFilter, setSurgeFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey | null>("date");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const pageSize = 15;

  const {
    data: operatingDays,
    isLoading: isCalendarLoading,
    refetch: refetchCalendar,
  } = useUpcomingOperatingDays(daysCount);
  const {
    data: surgeData,
    isLoading: isSurgeLoading,
    refetch: refetchSurge,
  } = useDemandSurge();

  const isLoading = isCalendarLoading || isSurgeLoading;

  const handleRefresh = () => {
    refetchCalendar();
    refetchSurge();
  };

  const surgeMap = React.useMemo(() => {
    const map = new Map<string, number>();
    if (surgeData) {
      surgeData.forEach((s) => map.set(s.date, s.surge_multiplier));
    }
    return map;
  }, [surgeData]);

  const peakSurge = React.useMemo(() => {
    if (!surgeData || surgeData.length === 0) return null;
    return Math.max(...surgeData.map((d) => d.surge_multiplier));
  }, [surgeData]);

  const monsoonDaysCount = React.useMemo(() => {
    return operatingDays?.filter((d) => d.monsoon).length ?? 0;
  }, [operatingDays]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const filteredDays = React.useMemo(() => {
    if (!operatingDays) return [];
    let list = operatingDays.filter((day) => {
      const surgeMultiplier = surgeMap.get(day.date) || 1.0;

      // Monsoon filter
      if (monsoonFilter === "monsoon" && !day.monsoon) return false;
      if (monsoonFilter === "clear" && day.monsoon) return false;

      // Surge filter
      if (surgeFilter === "surging" && surgeMultiplier <= 1.0) return false;
      if (surgeFilter === "standard" && surgeMultiplier > 1.0) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDate = day.date.toLowerCase().includes(q);
        const matchesDay = (day.dow_name || "").toLowerCase().includes(q);
        const matchesFestival = (day.festival || "").toLowerCase().includes(q);
        if (!matchesDate && !matchesDay && !matchesFestival) return false;
      }
      return true;
    });

    if (sortKey) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortKey === "date") {
          cmp = a.date.localeCompare(b.date);
        } else if (sortKey === "dayOfWeek") {
          cmp = (a.dow_name || "").localeCompare(b.dow_name || "");
        } else if (sortKey === "operating") {
          cmp = (a.is_operating ? 1 : 0) - (b.is_operating ? 1 : 0);
        } else if (sortKey === "surge") {
          const multA = surgeMap.get(a.date) || 1.0;
          const multB = surgeMap.get(b.date) || 1.0;
          cmp = multA - multB;
        } else if (sortKey === "monsoon") {
          cmp = (a.monsoon ? 1 : 0) - (b.monsoon ? 1 : 0);
        }
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [
    operatingDays,
    monsoonFilter,
    surgeFilter,
    searchQuery,
    sortKey,
    sortDirection,
    surgeMap,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredDays.length / pageSize));
  const paginatedDays = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDays.slice(start, start + pageSize);
  }, [filteredDays, currentPage, pageSize]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* 1. Header Bar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
            2026 Logistics Operating Calendar
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Dispatch schedule days, seasonal weather conditions, and festival demand
            multipliers (SLST UTC+05:30)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Day Horizon Selector */}
          <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/40 text-xs">
            {([14, 30, 60] as const).map((days) => (
              <button
                key={days}
                onClick={() => {
                  setDaysCount(days);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  daysCount === days
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={handleRefresh}
          >
            <ArrowsClockwiseIcon className="size-3 text-muted-foreground" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Strip */}
      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <CalendarIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Operating:</span>
          <span className="font-bold text-foreground text-[11px]">
            Mon - Sat Schedule
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <TrendUpIcon className="size-3.5 text-amber-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Peak Multiplier:</span>
          <span className="font-bold text-foreground text-[11px]">
            {peakSurge ? `${peakSurge.toFixed(2)}x` : "1.00x"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <CloudRainIcon className="size-3.5 text-sky-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Monsoon Advisory:</span>
          <span className="font-bold text-foreground text-[11px]">
            {monsoonDaysCount} Days
          </span>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search date, day of week, festival..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-7 h-7 text-xs bg-card"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Weather Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="xs"
                  className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
                />
              }
            >
              <CloudRainIcon className="size-3 text-muted-foreground" />
              <span className="capitalize">
                Weather:{" "}
                {monsoonFilter === "all"
                  ? "All Conditions"
                  : monsoonFilter === "monsoon"
                    ? "Monsoon Only"
                    : "Clear Sky"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Weather Advisory</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={monsoonFilter}
                onValueChange={(val) => {
                  setMonsoonFilter(val ?? "all");
                  setCurrentPage(1);
                }}
              >
                <DropdownMenuRadioItem value="all" className="text-xs">
                  All Conditions
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="monsoon" className="text-xs">
                  Monsoon Advisory
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="clear" className="text-xs">
                  Clear Weather
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Surge Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="xs"
                  className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
                />
              }
            >
              <TrendUpIcon className="size-3 text-muted-foreground" />
              <span className="capitalize">
                Surge:{" "}
                {surgeFilter === "all"
                  ? "All Days"
                  : surgeFilter === "surging"
                    ? "Peak Surge Days"
                    : "Standard Days"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Demand Multiplier</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={surgeFilter}
                onValueChange={(val) => {
                  setSurgeFilter(val ?? "all");
                  setCurrentPage(1);
                }}
              >
                <DropdownMenuRadioItem value="all" className="text-xs">
                  All Days
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="surging" className="text-xs">
                  Surge Days (&gt;1.0x)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="standard" className="text-xs">
                  Standard Days (1.0x)
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 4. Table Container */}
      <div className="flex-1 min-h-0 margin-responsive py-3 sm:py-4 overflow-hidden flex flex-col">
        {isLoading ? (
          <TableSkeleton columns={6} rowCount={8} />
        ) : filteredDays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarIcon className="size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">
              No calendar records found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              No days match your current filter and search parameters.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-xs"
              onClick={() => {
                setSearchQuery("");
                setMonsoonFilter("all");
                setSurgeFilter("all");
                setCurrentPage(1);
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
            {/* Top Table Bar with Count & Top Pagination */}
            <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="text-muted-foreground text-[11px]">
                Showing{" "}
                <span className="font-bold text-foreground">
                  {filteredDays.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-foreground">
                  {Math.min(currentPage * pageSize, filteredDays.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-foreground">{filteredDays.length}</span>{" "}
                calendar dates
              </div>

              {/* Standard Pagination Controls */}
              {totalPages > 1 && (
                <Pagination className="mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage <= 1}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
                      )
                      .map((page, idx, arr) => (
                        <React.Fragment key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <PaginationItem>
                              <span className="px-1 text-muted-foreground text-xs">
                                ...
                              </span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              isActive={currentPage === page}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage >= totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>

            <TooltipProvider delay={100}>
              <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <TableHeader className="sticky top-0 z-20 bg-card shadow-2xs border-b border-border/80">
                    <TableRow className="border-b border-border/80 hover:bg-transparent">
                      <TableHead
                        className="w-[180px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs pl-4"
                        onClick={() => handleSort("date")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Calendar Date</span>
                          <SortHeaderIcon
                            active={sortKey === "date"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[140px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("dayOfWeek")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Day of Week</span>
                          <SortHeaderIcon
                            active={sortKey === "dayOfWeek"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[160px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("operating")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Operating Status</span>
                          <SortHeaderIcon
                            active={sortKey === "operating"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[140px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("surge")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Demand Surge</span>
                          <SortHeaderIcon
                            active={sortKey === "surge"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[140px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("monsoon")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Weather Advisory</span>
                          <SortHeaderIcon
                            active={sortKey === "monsoon"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead className="text-[11px] font-bold text-foreground text-xs pr-4">
                        Events & Special Conditions
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedDays.map((day: CalendarDay) => {
                      const surgeMult = surgeMap.get(day.date) || 1.0;
                      const hasSurge = surgeMult > 1.0;

                      return (
                        <TableRow
                          key={day.date}
                          className="border-border/30 hover:bg-muted/30 transition-colors text-xs"
                        >
                          <TableCell className="font-bold text-foreground py-2.5 pl-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="size-3.5 text-primary shrink-0" />
                              <span>{day.date}</span>
                            </div>
                          </TableCell>

                          <TableCell className="py-2.5 font-medium text-foreground whitespace-nowrap">
                            {day.dow_name || `Day ${day.dow}`}
                          </TableCell>

                          <TableCell className="py-2.5 whitespace-nowrap">
                            {day.is_operating ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Active Dispatch
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                                Closed / Sunday
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="py-2.5 whitespace-nowrap">
                            {hasSurge ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                                {surgeMult.toFixed(2)}x Surge
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                1.00x Base
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="py-2.5 whitespace-nowrap">
                            {day.monsoon ? (
                              <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold text-[11px] bg-sky-500/10 px-2 py-0.5 rounded">
                                <CloudRainIcon
                                  weight="bold"
                                  className="size-3 shrink-0"
                                />
                                Monsoon
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                                <SunIcon className="size-3 shrink-0" />
                                Clear
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="pr-4 py-2.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2 flex-wrap">
                              {day.festival && (
                                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-[11px]">
                                  {day.festival} ({(day.festival_ramp * 100).toFixed(0)}%)
                                </span>
                              )}
                              {day.is_payday && (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                                  <CoinsIcon className="size-3" />
                                  Payday Cycle
                                </span>
                              )}
                              {!day.festival && !day.is_payday && (
                                <span>Standard dispatch day</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </table>
              </div>
            </TooltipProvider>

            {/* Bottom Pagination Bar */}
            <div className="px-4 py-2 bg-muted/20 border-t border-border/50 shrink-0 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">
                Page {currentPage} of {totalPages}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-6 text-[11px] px-2 cursor-pointer"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-6 text-[11px] px-2 cursor-pointer"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AdminCalendarPage;
