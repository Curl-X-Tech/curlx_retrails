import { masterKeys } from "@/api/keys";
import { readThrough } from "./cache";
import { mockUpdateCalendarDay, overlayCalendar } from "./mock";
import { ENDPOINTS, callEndpoint, isPending } from "./request";
import type { CalendarDay, DemandSurge } from "./entities";
import type {
  CalendarBulkGeneratePayload,
  CalendarDayUpdatePayload,
  CalendarRangeFilters,
  DateRange,
  OperatingDaysFilters,
} from "./payloads";

export async function getOperatingDays(
  filters: OperatingDaysFilters = {},
  signal?: AbortSignal
) {
  const list = await readThrough([...masterKeys.calendarDays(), filters], () =>
    callEndpoint<CalendarDay[]>(ENDPOINTS.masterCalendarOperatingDays, {
      query: { ...filters },
      signal,
    })
  );
  return overlayCalendar(list);
}

export function getDemandSurge(range: DateRange = {}, signal?: AbortSignal) {
  return readThrough(masterKeys.calendarSurge({ ...range }), () =>
    callEndpoint<DemandSurge[]>(ENDPOINTS.masterCalendarSurge, {
      query: { ...range },
      signal,
    })
  );
}

export async function getCalendarRange(
  filters: CalendarRangeFilters = {},
  signal?: AbortSignal
) {
  const key = masterKeys.calendarRange(filters.from_date ?? "", filters.to_date ?? "");
  const list = await readThrough([...key, filters], () =>
    callEndpoint<CalendarDay[]>(ENDPOINTS.masterCalendarRange, {
      query: { ...filters },
      signal,
    })
  );
  return overlayCalendar(list);
}

export function bulkGenerateCalendar(
  payload: CalendarBulkGeneratePayload
): Promise<CalendarDay[]> {
  return callEndpoint<CalendarDay[]>(ENDPOINTS.masterCalendarBulkGenerate, {
    body: payload,
  });
}

export function updateCalendarDay(
  date: string,
  payload: CalendarDayUpdatePayload
): Promise<CalendarDay> {
  if (isPending(ENDPOINTS.masterCalendarUpdateDay))
    return mockUpdateCalendarDay(date, payload);
  return callEndpoint<CalendarDay>(ENDPOINTS.masterCalendarUpdateDay, {
    path: { date },
    body: payload,
  });
}
