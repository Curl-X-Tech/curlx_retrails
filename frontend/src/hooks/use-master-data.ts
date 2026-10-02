import { useQuery } from "@tanstack/react-query";
import { getStoredToken } from "@/lib/api";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

export interface MasterDepot {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MasterDistrict {
  id: string;
  name: string;
  province: string;
  assigned_depot_id: string;
  created_at: string;
}

export interface MasterBrand {
  id: string;
  code: string;
  name: string;
  delivery_window_type: string;
  requires_cold_chain: boolean;
  daily_time_budget_min: number;
  created_at: string;
  updated_at: string;
}

export interface MasterOutlet {
  id: string;
  outlet_id: string;
  brand_id: string;
  district_id: string;
  depot_id: string;
  name: string;
  dock_type: "rear_dock" | "street" | "mall_bay";
  parking_constraint: "normal" | "van_only" | "mall_dock";
  mall_window: string | null;
  window_open_time: string;
  window_close_time: string;
  latitude: number | null;
  longitude: number | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MasterItem {
  id: string;
  sku: string;
  brand_id: string;
  name: string;
  category: string;
  unit: string;
  unit_weight_kg: number;
  unit_volume_m3: number;
  requires_cold_chain: boolean;
  special_handling_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface DemandSurge {
  date: string;
  dow_name: string;
  festival: string | null;
  festival_ramp: number;
  is_payday: boolean;
  monsoon: boolean;
  surge_multiplier: number;
}

export interface CalendarDay {
  date: string;
  dow: number;
  dow_name: string;
  is_weekend: boolean;
  iso_year: number;
  iso_week: number;
  is_payday: boolean;
  festival: string | null;
  festival_ramp: number;
  is_holiday: boolean;
  monsoon: boolean;
  is_operating: boolean;
  created_at: string;
}

export interface MasterPrice {
  id: string;
  item_id: string;
  cost_price: number;
  unit_price: number;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  price_change_reason: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivePrice {
  price_list_id: string;
  item_id: string;
  sku: string;
  item_name: string;
  cost_price: number;
  unit_price: number;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  price_change_reason: string | null;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { headers });
  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

async function mutateApi<T>(
  endpoint: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let errMsg = `API Error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        errMsg =
          typeof errJson.detail === "string"
            ? errJson.detail
            : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export function useMasterDepots() {
  return useQuery({
    queryKey: ["master", "depots"],
    queryFn: () => fetchApi<MasterDepot[]>("/master/depots"),
  });
}

export function useMasterDistricts() {
  return useQuery({
    queryKey: ["master", "districts"],
    queryFn: () => fetchApi<MasterDistrict[]>("/master/districts"),
  });
}

export function useMasterBrands() {
  return useQuery({
    queryKey: ["master", "brands"],
    queryFn: () => fetchApi<MasterBrand[]>("/master/brands"),
  });
}

export function useMasterOutlets() {
  return useQuery({
    queryKey: ["master", "outlets"],
    queryFn: () => fetchApi<MasterOutlet[]>("/master/outlets"),
  });
}

export function useMasterItems() {
  return useQuery({
    queryKey: ["master", "items"],
    queryFn: () => fetchApi<MasterItem[]>("/master/items"),
  });
}

export function useMasterPrices(itemId?: string) {
  const qs = itemId ? `?item_id=${itemId}` : "";
  return useQuery({
    queryKey: ["master", "prices", itemId],
    queryFn: () => fetchApi<MasterPrice[]>(`/master/prices${qs}`),
  });
}

export function useActivePrices() {
  return useQuery({
    queryKey: ["master", "prices", "active"],
    queryFn: () => fetchApi<ActivePrice[]>("/master/prices/active"),
  });
}

export function useDemandSurge(fromDate?: string, toDate?: string) {
  const params = new URLSearchParams();
  if (fromDate) params.append("from_date", fromDate);
  if (toDate) params.append("to_date", toDate);
  const qs = params.toString() ? `?${params.toString()}` : "";

  return useQuery({
    queryKey: ["master", "calendar", "surge", fromDate, toDate],
    queryFn: () => fetchApi<DemandSurge[]>(`/master/calendar/surge${qs}`),
  });
}

export function useUpcomingOperatingDays(days: number = 14) {
  return useQuery({
    queryKey: ["master", "calendar", "operating-days", days],
    queryFn: () =>
      fetchApi<CalendarDay[]>(`/master/calendar/operating-days?days=${days}`),
  });
}

// ------------------------------------------------------------
// Mutations
// ------------------------------------------------------------

export function useCreateOutlet() {
  return {
    mutateAsync: (data: Omit<MasterOutlet, "id" | "created_at" | "updated_at">) =>
      mutateApi<MasterOutlet>("/master/outlets", "POST", data),
  };
}

export function useUpdateOutlet() {
  return {
    mutateAsync: ({ id, data }: { id: string; data: Partial<MasterOutlet> }) =>
      mutateApi<MasterOutlet>(`/master/outlets/${id}`, "PUT", data),
  };
}

export function useDeleteOutlet() {
  return {
    mutateAsync: (id: string) =>
      mutateApi<{ message: string }>(`/master/outlets/${id}`, "DELETE"),
  };
}

export function useCreateItem() {
  return {
    mutateAsync: (data: Omit<MasterItem, "id" | "created_at" | "updated_at">) =>
      mutateApi<MasterItem>("/master/items", "POST", data),
  };
}

export function useUpdateItem() {
  return {
    mutateAsync: ({ id, data }: { id: string; data: Partial<MasterItem> }) =>
      mutateApi<MasterItem>(`/master/items/${id}`, "PUT", data),
  };
}

export function useDeleteItem() {
  return {
    mutateAsync: (id: string) =>
      mutateApi<{ message: string }>(`/master/items/${id}`, "DELETE"),
  };
}

export function useCreatePrice() {
  return {
    mutateAsync: (data: Omit<MasterPrice, "id" | "created_at" | "updated_at">) =>
      mutateApi<MasterPrice>("/master/prices", "POST", data),
  };
}

export function useUpdatePrice() {
  return {
    mutateAsync: ({ id, data }: { id: string; data: Partial<MasterPrice> }) =>
      mutateApi<MasterPrice>(`/master/prices/${id}`, "PUT", data),
  };
}

export function useUpdateDepot() {
  return {
    mutateAsync: ({ id, data }: { id: string; data: Partial<MasterDepot> }) =>
      mutateApi<MasterDepot>(`/master/depots/${id}`, "PUT", data),
  };
}

export function useUpdateCalendarDay() {
  return {
    mutateAsync: ({ date, data }: { date: string; data: Partial<CalendarDay> }) =>
      mutateApi<CalendarDay>(`/master/calendar/${date}`, "PUT", data),
  };
}

export function useBulkGenerateCalendar() {
  return {
    mutateAsync: ({ startDate, endDate }: { startDate: string; endDate: string }) =>
      mutateApi<CalendarDay[]>(
        `/master/calendar/bulk-generate?start_date=${startDate}&end_date=${endDate}`,
        "POST"
      ),
  };
}
