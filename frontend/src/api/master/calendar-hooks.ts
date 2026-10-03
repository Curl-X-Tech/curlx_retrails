import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { masterKeys } from "@/api/keys";
import { MASTER_QUERY_DEFAULTS, type MasterQueryOptions } from "./query-options";
import {
  bulkGenerateCalendar,
  getCalendarRange,
  getDemandSurge,
  getOperatingDays,
  updateCalendarDay,
} from "./calendar-api";
import type { CalendarDay, DemandSurge } from "./entities";
import type {
  CalendarBulkGeneratePayload,
  CalendarDayUpdatePayload,
  CalendarRangeFilters,
  DateRange,
  OperatingDaysFilters,
} from "./payloads";

const calendarRoot = [...masterKeys.all, "calendar"] as const;

export function useOperatingDays<TData = CalendarDay[]>(
  filters: OperatingDaysFilters = {},
  options: MasterQueryOptions<CalendarDay[], TData> = {}
) {
  return useQuery({
    ...MASTER_QUERY_DEFAULTS,
    ...options,
    queryKey: [...masterKeys.calendarDays(), filters],
    queryFn: ({ signal }) => getOperatingDays(filters, signal),
  });
}

export function useDemandSurge<TData = DemandSurge[]>(
  range: DateRange = {},
  options: MasterQueryOptions<DemandSurge[], TData> = {}
) {
  return useQuery({
    ...MASTER_QUERY_DEFAULTS,
    ...options,
    queryKey: masterKeys.calendarSurge({ ...range }),
    queryFn: ({ signal }) => getDemandSurge(range, signal),
  });
}

export function useCalendarRange<TData = CalendarDay[]>(
  filters: CalendarRangeFilters = {},
  options: MasterQueryOptions<CalendarDay[], TData> = {}
) {
  return useQuery({
    ...MASTER_QUERY_DEFAULTS,
    ...options,
    queryKey: [
      ...masterKeys.calendarRange(filters.from_date ?? "", filters.to_date ?? ""),
      filters,
    ],
    queryFn: ({ signal }) => getCalendarRange(filters, signal),
  });
}

export function useBulkGenerateCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CalendarBulkGeneratePayload) => bulkGenerateCalendar(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: calendarRoot }),
  });
}

export function useUpdateCalendarDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      date,
      payload,
    }: {
      date: string;
      payload: CalendarDayUpdatePayload;
    }) => updateCalendarDay(date, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: calendarRoot }),
  });
}
