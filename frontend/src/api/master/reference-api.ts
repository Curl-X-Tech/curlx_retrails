import { masterKeys } from "@/api/keys";
import { readThrough } from "./cache";
import { mockUpdateDepot, overlayDepot, overlayDepots } from "./mock";
import { ENDPOINTS, callEndpoint, isPending } from "./request";
import type { Brand, Depot, District } from "./entities";
import type { DepotFilters, DepotUpdatePayload } from "./payloads";

export async function getDepots(filters: DepotFilters = {}, signal?: AbortSignal) {
  const list = await readThrough([...masterKeys.depots(), filters], () =>
    callEndpoint<Depot[]>(ENDPOINTS.masterDepotsList, { query: { ...filters }, signal })
  );
  return overlayDepots(list);
}

export async function getDepot(id: string, signal?: AbortSignal) {
  const depot = await readThrough(masterKeys.depot(id), () =>
    callEndpoint<Depot>(ENDPOINTS.masterDepotsGet, { path: { id }, signal })
  );
  return overlayDepot(depot);
}

export function updateDepot(id: string, payload: DepotUpdatePayload): Promise<Depot> {
  if (isPending(ENDPOINTS.masterDepotsUpdate)) return mockUpdateDepot(id, payload);
  return callEndpoint<Depot>(ENDPOINTS.masterDepotsUpdate, {
    path: { id },
    body: payload,
  });
}

export function getDistricts(signal?: AbortSignal) {
  return readThrough(masterKeys.districts(), () =>
    callEndpoint<District[]>(ENDPOINTS.masterDistrictsList, { signal })
  );
}

export function getBrands(signal?: AbortSignal) {
  return readThrough(masterKeys.brands(), () =>
    callEndpoint<Brand[]>(ENDPOINTS.masterBrandsList, { signal })
  );
}
