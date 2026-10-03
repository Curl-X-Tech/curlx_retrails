import { masterKeys } from "@/api/keys";
import { readThrough } from "./cache";
import { mockUpdatePrice, overlayPrices } from "./mock";
import { ENDPOINTS, callEndpoint, isPending } from "./request";
import type { ActivePrice, PriceList } from "./entities";
import type { PriceFilters, PricePayload, PriceUpdatePayload } from "./payloads";

export async function getPrices(filters: PriceFilters = {}, signal?: AbortSignal) {
  const list = await readThrough([...masterKeys.prices(), filters], () =>
    callEndpoint<PriceList[]>(ENDPOINTS.masterPricesList, {
      query: { ...filters },
      signal,
    })
  );
  return overlayPrices(list);
}

export function getActivePrices(asOf?: string, signal?: AbortSignal) {
  return readThrough([...masterKeys.pricesActive(), asOf ?? null], () =>
    callEndpoint<ActivePrice[]>(ENDPOINTS.masterPricesListActive, {
      query: { as_of: asOf },
      signal,
    })
  );
}

export function getItemPrice(itemId: string, date?: string, signal?: AbortSignal) {
  return readThrough([...masterKeys.priceByItem(itemId), date ?? null], () =>
    callEndpoint<ActivePrice>(ENDPOINTS.masterPricesGetByItem, {
      path: { item_id: itemId },
      query: { as_of: date },
      signal,
    })
  );
}

export function createPrice(payload: PricePayload): Promise<PriceList> {
  return callEndpoint<PriceList>(ENDPOINTS.masterPricesCreate, { body: payload });
}

export function updatePrice(id: string, payload: PriceUpdatePayload): Promise<PriceList> {
  if (isPending(ENDPOINTS.masterPricesUpdate)) return mockUpdatePrice(id, payload);
  return callEndpoint<PriceList>(ENDPOINTS.masterPricesUpdate, {
    path: { id },
    body: payload,
  });
}
