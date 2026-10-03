import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { masterKeys } from "@/api/keys";
import { MASTER_QUERY_DEFAULTS, type MasterQueryOptions } from "./query-options";
import { createItem, deleteItem, getItem, getItems, updateItem } from "./items-api";
import type { Item } from "./entities";
import type { ItemFilters, ItemPayload, ItemUpdatePayload } from "./payloads";

export function useItems<TData = Item[]>(
  filters: ItemFilters = {},
  options: MasterQueryOptions<Item[], TData> = {}
) {
  return useQuery({
    ...MASTER_QUERY_DEFAULTS,
    ...options,
    queryKey: [...masterKeys.items(), filters],
    queryFn: ({ signal }) => getItems(filters, signal),
  });
}

export function useItem<TData = Item>(
  id: string,
  options: MasterQueryOptions<Item, TData> = {}
) {
  return useQuery({
    ...MASTER_QUERY_DEFAULTS,
    ...options,
    queryKey: masterKeys.item(id),
    queryFn: ({ signal }) => getItem(id, signal),
    enabled: Boolean(id) && options.enabled !== false,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ItemPayload) => createItem(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: masterKeys.items() }),
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ItemUpdatePayload }) =>
      updateItem(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: masterKeys.items() });
      queryClient.invalidateQueries({ queryKey: masterKeys.item(id) });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: masterKeys.items() });
      queryClient.removeQueries({ queryKey: masterKeys.item(id) });
    },
  });
}
