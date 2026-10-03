import { masterKeys } from "@/api/keys";
import { readThrough } from "./cache";
import {
  findMockOutlet,
  mockCreateOutlet,
  mockDeleteOutlet,
  mockUpdateOutlet,
  overlayOutlet,
  overlayOutlets,
} from "./mock";
import { ENDPOINTS, callEndpoint, isPending } from "./request";
import type { Outlet } from "./entities";
import type { OutletFilters, OutletPayload, OutletUpdatePayload } from "./payloads";

export async function getOutlets(filters: OutletFilters = {}, signal?: AbortSignal) {
  const list = await readThrough([...masterKeys.outlets(), filters], () =>
    callEndpoint<Outlet[]>(ENDPOINTS.masterOutletsList, { query: { ...filters }, signal })
  );
  return overlayOutlets(list);
}

export async function getOutlet(id: string, signal?: AbortSignal) {
  const local = findMockOutlet(id);
  if (local) return local;
  const outlet = await readThrough(masterKeys.outlet(id), () =>
    callEndpoint<Outlet>(ENDPOINTS.masterOutletsGet, { path: { id }, signal })
  );
  return overlayOutlet(outlet);
}

export function createOutlet(payload: OutletPayload): Promise<Outlet> {
  if (isPending(ENDPOINTS.masterOutletsCreate)) return mockCreateOutlet(payload);
  return callEndpoint<Outlet>(ENDPOINTS.masterOutletsCreate, { body: payload });
}

export function updateOutlet(id: string, payload: OutletUpdatePayload): Promise<Outlet> {
  if (isPending(ENDPOINTS.masterOutletsUpdate)) return mockUpdateOutlet(id, payload);
  return callEndpoint<Outlet>(ENDPOINTS.masterOutletsUpdate, {
    path: { id },
    body: payload,
  });
}

export function deleteOutlet(id: string): Promise<void> {
  if (isPending(ENDPOINTS.masterOutletsDelete)) return mockDeleteOutlet(id);
  return callEndpoint<void>(ENDPOINTS.masterOutletsDelete, { path: { id } });
}
