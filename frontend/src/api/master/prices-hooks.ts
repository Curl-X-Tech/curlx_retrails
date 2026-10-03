import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { masterKeys } from "@/api/keys";
import { MASTER_QUERY_DEFAULTS, type MasterQueryOptions } from "./query-options";
import {
  createPrice,
  getActivePrices,
  getItemPrice,
  getPrices,
  updatePrice,
} from "./prices-api";
import type { ActivePrice, PriceList } from "./entities";
import type { PriceFilters, PricePayload, PriceUpdatePayload } from "./payloads";

export function usePrices<TData = PriceList[]>(
  filters: PriceFilters = {},
  options: MasterQueryOptions<PriceList[], TData> = {}
) {
  return useQuery({
    ...MASTER_QUERY_DEFAULTS,
    ...options,
    queryKey: [...masterKeys.prices(), filters],
    queryFn: ({ signal }) => getPrices(filters, signal),
  });
}

export function useActivePrices<TData = ActivePrice[]>(
  asOf?: string,
  options: MasterQueryOptions<ActivePrice[], TData> = {}
) {
  return useQuery({
    ...MASTER_QUERY_DEFAULTS,
    ...options,
    queryKey: [...masterKeys.pricesActive(), asOf ?? null],
    queryFn: ({ signal }) => getActivePrices(asOf, signal),
  });
}

export function useItemPrice<TData = ActivePrice>(
  itemId: string,
  date?: string,
  options: MasterQueryOptions<ActivePrice, TData> = {}
) {
  return useQuery({
    ...MASTER_QUERY_DEFAULTS,
    ...options,
    queryKey: [...masterKeys.priceByItem(itemId), date ?? null],
    queryFn: ({ signal }) => getItemPrice(itemId, date, signal),
    enabled: Boolean(itemId) && options.enabled !== false,
  });
}

function useInvalidatePrices() {
  const queryClient = useQueryClient();
  return (price: PriceList) => {
    queryClient.invalidateQueries({ queryKey: masterKeys.prices() });
    queryClient.invalidateQueries({ queryKey: masterKeys.pricesActive() });
    queryClient.invalidateQueries({ queryKey: masterKeys.priceByItem(price.item_id) });
  };
}

export function useCreatePrice() {
  const invalidate = useInvalidatePrices();
  return useMutation({
    mutationFn: (payload: PricePayload) => createPrice(payload),
    onSuccess: invalidate,
  });
}

export function useUpdatePrice() {
  const invalidate = useInvalidatePrices();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PriceUpdatePayload }) =>
      updatePrice(id, payload),
    onSuccess: invalidate,
  });
}
