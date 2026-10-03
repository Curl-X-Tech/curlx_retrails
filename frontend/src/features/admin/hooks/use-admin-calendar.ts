import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-request";
import type { CalendarDay, DemandSurge } from "../types";

export function useAdminOperatingDays(days: number = 30) {
  return useQuery<CalendarDay[]>({
    queryKey: ["master", "calendar", "operating-days", days],
    queryFn: () =>
      apiRequest<CalendarDay[]>(`/master/calendar/operating-days?days=${days}`),
  });
}

export function useAdminDemandSurge(fromDate?: string, toDate?: string) {
  const params: Record<string, string | undefined> = {};
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;

  return useQuery<DemandSurge[]>({
    queryKey: ["master", "calendar", "surge", fromDate, toDate],
    queryFn: () => apiRequest<DemandSurge[]>("/master/calendar/surge", { params }),
  });
}
