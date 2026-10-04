import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { masterKeys } from "@/api/keys";
import { MASTER_QUERY_DEFAULTS, type MasterQueryOptions } from "./query-options";
import {
  createDepot,
  deleteDepot,
  getBrands,
  getDepot,
  getDepots,
  getDistricts,
  updateDepot,
} from "./reference-api";
import type { Brand, Depot, District } from "./entities";
import type { DepotFilters, DepotPayload, DepotUpdatePayload } from "./payloads";

export function useDepots<TData = Depot[]>(
  filters: DepotFilters = {},
  options: MasterQueryOptions<Depot[], TData> = {}
) {
  return useQuery({
    ...MASTER_QUERY_DEFAULTS,
    ...options,
    queryKey: [...masterKeys.depots(), filters],
    queryFn: ({ signal }) => getDepots(filters, signal),
  });
}

export function useDepot<TData = Depot>(
  id: string,
  options: MasterQueryOptions<Depot, TData> = {}
) {
  return useQuery({
    ...MASTER_QUERY_DEFAULTS,
    ...options,
    queryKey: masterKeys.depot(id),
    queryFn: ({ signal }) => getDepot(id, signal),
    enabled: Boolean(id) && options.enabled !== false,
  });
}

export function useDistricts<TData = District[]>(
  options: MasterQueryOptions<District[], TData> = {}
) {
  return useQuery({
    ...MASTER_QUERY_DEFAULTS,
    ...options,
    queryKey: masterKeys.districts(),
    queryFn: ({ signal }) => getDistricts(signal),
  });
}

export function useBrands<TData = Brand[]>(
  options: MasterQueryOptions<Brand[], TData> = {}
) {
  return useQuery({
    ...MASTER_QUERY_DEFAULTS,
    ...options,
    queryKey: masterKeys.brands(),
    queryFn: ({ signal }) => getBrands(signal),
  });
}

export function useCreateDepot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DepotPayload) => createDepot(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: masterKeys.depots() }),
  });
}

export function useDeleteDepot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDepot(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: masterKeys.depots() }),
  });
}

export function useUpdateDepot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DepotUpdatePayload }) =>
      updateDepot(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: masterKeys.depots() });
      queryClient.invalidateQueries({ queryKey: masterKeys.depot(id) });
    },
  });
}
