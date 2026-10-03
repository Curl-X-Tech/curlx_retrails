import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-request";
import type { MasterItem, ActivePrice } from "../types";

export function useAdminItems() {
  return useQuery<MasterItem[]>({
    queryKey: ["master", "items"],
    queryFn: () => apiRequest<MasterItem[]>("/master/items"),
  });
}

export function useAdminActivePrices() {
  return useQuery<ActivePrice[]>({
    queryKey: ["master", "prices", "active"],
    queryFn: () => apiRequest<ActivePrice[]>("/master/prices/active"),
  });
}
