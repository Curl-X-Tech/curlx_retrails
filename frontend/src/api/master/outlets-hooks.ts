import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { masterKeys } from "@/api/keys";
import { MASTER_QUERY_DEFAULTS, type MasterQueryOptions } from "./query-options";
import {
  createOutlet,
  deleteOutlet,
  getOutlet,
  getOutlets,
  updateOutlet,
} from "./outlets-api";
import type { Outlet } from "./entities";
import type { OutletFilters, OutletPayload, OutletUpdatePayload } from "./payloads";

export function useOutlets<TData = Outlet[]>(
  filters: OutletFilters = {},
  options: MasterQueryOptions<Outlet[], TData> = {}
) {
  return useQuery({
    ...MASTER_QUERY_DEFAULTS,
    ...options,
    queryKey: [...masterKeys.outlets(), filters],
    queryFn: ({ signal }) => getOutlets(filters, signal),
  });
}

export function useOutlet<TData = Outlet>(
  id: string,
  options: MasterQueryOptions<Outlet, TData> = {}
) {
  return useQuery({
    ...MASTER_QUERY_DEFAULTS,
    ...options,
    queryKey: masterKeys.outlet(id),
    queryFn: ({ signal }) => getOutlet(id, signal),
    enabled: Boolean(id) && options.enabled !== false,
  });
}

export function useCreateOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OutletPayload) => createOutlet(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: masterKeys.outlets() }),
  });
}

export function useUpdateOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: OutletUpdatePayload }) =>
      updateOutlet(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: masterKeys.outlets() });
      queryClient.invalidateQueries({ queryKey: masterKeys.outlet(id) });
    },
  });
}

export function useDeleteOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOutlet(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: masterKeys.outlets() });
      queryClient.removeQueries({ queryKey: masterKeys.outlet(id) });
    },
  });
}
