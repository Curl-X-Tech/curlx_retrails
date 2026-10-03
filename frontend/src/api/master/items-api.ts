import { masterKeys } from "@/api/keys";
import { readThrough } from "./cache";
import {
  findMockItem,
  mockCreateItem,
  mockDeleteItem,
  mockUpdateItem,
  overlayItem,
  overlayItems,
} from "./mock";
import { ENDPOINTS, callEndpoint, isPending } from "./request";
import type { Item } from "./entities";
import type { ItemFilters, ItemPayload, ItemUpdatePayload } from "./payloads";

export async function getItems(filters: ItemFilters = {}, signal?: AbortSignal) {
  const list = await readThrough([...masterKeys.items(), filters], () =>
    callEndpoint<Item[]>(ENDPOINTS.masterItemsList, { query: { ...filters }, signal })
  );
  return overlayItems(list);
}

export async function getItem(id: string, signal?: AbortSignal) {
  const local = findMockItem(id);
  if (local) return local;
  const item = await readThrough(masterKeys.item(id), () =>
    callEndpoint<Item>(ENDPOINTS.masterItemsGet, { path: { id }, signal })
  );
  return overlayItem(item);
}

export function createItem(payload: ItemPayload): Promise<Item> {
  if (isPending(ENDPOINTS.masterItemsCreate)) return mockCreateItem(payload);
  return callEndpoint<Item>(ENDPOINTS.masterItemsCreate, { body: payload });
}

export function updateItem(id: string, payload: ItemUpdatePayload): Promise<Item> {
  if (isPending(ENDPOINTS.masterItemsUpdate)) return mockUpdateItem(id, payload);
  return callEndpoint<Item>(ENDPOINTS.masterItemsUpdate, { path: { id }, body: payload });
}

export function deleteItem(id: string): Promise<void> {
  if (isPending(ENDPOINTS.masterItemsDelete)) return mockDeleteItem(id);
  return callEndpoint<void>(ENDPOINTS.masterItemsDelete, { path: { id } });
}
