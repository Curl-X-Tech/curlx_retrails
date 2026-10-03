import * as React from "react";
import { sortCalendarDays } from "../admin-utils";
import type { CalendarSortKey, CalendarDay, DemandSurge } from "../types";

interface UseAdminCalendarFilterProps {
  operatingDays: CalendarDay[];
  surgeData: DemandSurge[];
  monsoonFilter: string;
  surgeFilter: string;
  searchQuery: string;
  sortKey: CalendarSortKey | null;
  sortDirection: "asc" | "desc";
  currentPage: number;
  pageSize?: number;
}

export function useAdminCalendarFilter({
  operatingDays,
  surgeData,
  monsoonFilter,
  surgeFilter,
  searchQuery,
  sortKey,
  sortDirection,
  currentPage,
  pageSize = 15,
}: UseAdminCalendarFilterProps) {
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

  return {
    surgeMap,
    peakSurge,
    getSurgeMultiplier,
    paginatedDays,
    totalPages,
  };
}
