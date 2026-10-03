import type { CalendarDay, Depot, Item, Outlet, PriceList } from "./entities";
import type {
  CalendarDayUpdatePayload,
  DepotUpdatePayload,
  ItemPayload,
  ItemUpdatePayload,
  OutletPayload,
  OutletUpdatePayload,
  PriceUpdatePayload,
} from "./payloads";

interface Overlay<T> {
  readonly idOf: (entity: T) => string;
  readonly base: Map<string, T>;
  readonly created: Map<string, T>;
  readonly updated: Map<string, T>;
  readonly deleted: Set<string>;
}

function createOverlay<T>(idOf: (entity: T) => string): Overlay<T> {
  return {
    idOf,
    base: new Map(),
    created: new Map(),
    updated: new Map(),
    deleted: new Set(),
  };
}

const overlays = {
  depots: createOverlay<Depot>((d) => d.id),
  outlets: createOverlay<Outlet>((o) => o.id),
  items: createOverlay<Item>((i) => i.id),
  prices: createOverlay<PriceList>((p) => p.id),
  calendar: createOverlay<CalendarDay>((c) => c.date),
};

function applyOverlay<T>(overlay: Overlay<T>, list: T[]): T[] {
  list.forEach((entity) => overlay.base.set(overlay.idOf(entity), entity));
  const kept = list
    .filter((entity) => !overlay.deleted.has(overlay.idOf(entity)))
    .map((entity) => overlay.updated.get(overlay.idOf(entity)) ?? entity);
  return [...overlay.created.values(), ...kept];
}

function applyOverlayOne<T>(overlay: Overlay<T>, id: string, entity: T): T {
  overlay.base.set(id, entity);
  if (overlay.deleted.has(id)) throw new Error("Entity deleted in mock store");
  return overlay.updated.get(id) ?? entity;
}

function findLocal<T>(overlay: Overlay<T>, id: string): T | undefined {
  if (overlay.deleted.has(id)) return undefined;
  return overlay.created.get(id) ?? overlay.updated.get(id) ?? overlay.base.get(id);
}

function patchEntity<T>(overlay: Overlay<T>, id: string, patch: Partial<T>): T {
  const existing = findLocal(overlay, id);
  if (!existing) throw new Error("Entity not found in mock store");
  const merged = { ...existing, ...patch };
  if (overlay.created.has(id)) overlay.created.set(id, merged);
  else overlay.updated.set(id, merged);
  return merged;
}

function removeEntity<T>(overlay: Overlay<T>, id: string): void {
  if (!overlay.created.delete(id)) overlay.deleted.add(id);
  overlay.updated.delete(id);
}

const nowIso = () => new Date().toISOString();

export const overlayDepots = (list: Depot[]) => applyOverlay(overlays.depots, list);
export const overlayOutlets = (list: Outlet[]) => applyOverlay(overlays.outlets, list);
export const overlayItems = (list: Item[]) => applyOverlay(overlays.items, list);
export const overlayPrices = (list: PriceList[]) => applyOverlay(overlays.prices, list);
export const overlayCalendar = (list: CalendarDay[]) =>
  applyOverlay(overlays.calendar, list);
export const overlayDepot = (d: Depot) => applyOverlayOne(overlays.depots, d.id, d);
export const overlayOutlet = (o: Outlet) => applyOverlayOne(overlays.outlets, o.id, o);
export const overlayItem = (i: Item) => applyOverlayOne(overlays.items, i.id, i);
export const findMockOutlet = (id: string) => overlays.outlets.created.get(id);
export const findMockItem = (id: string) => overlays.items.created.get(id);

export async function mockCreateOutlet(payload: OutletPayload): Promise<Outlet> {
  const ts = nowIso();
  const outlet: Outlet = {
    mall_window: null,
    latitude: null,
    longitude: null,
    contact_phone: null,
    is_active: true,
    ...payload,
    id: crypto.randomUUID(),
    created_at: ts,
    updated_at: ts,
  };
  overlays.outlets.created.set(outlet.id, outlet);
  return outlet;
}

export async function mockUpdateOutlet(id: string, payload: OutletUpdatePayload) {
  return patchEntity(overlays.outlets, id, { ...payload, updated_at: nowIso() });
}

export async function mockDeleteOutlet(id: string): Promise<void> {
  removeEntity(overlays.outlets, id);
}

export async function mockCreateItem(payload: ItemPayload): Promise<Item> {
  const ts = nowIso();
  const item: Item = {
    unit: "Nos",
    requires_cold_chain: false,
    special_handling_code: null,
    ...payload,
    id: crypto.randomUUID(),
    created_at: ts,
    updated_at: ts,
  };
  overlays.items.created.set(item.id, item);
  return item;
}

export async function mockUpdateItem(id: string, payload: ItemUpdatePayload) {
  return patchEntity(overlays.items, id, { ...payload, updated_at: nowIso() });
}

export async function mockDeleteItem(id: string): Promise<void> {
  removeEntity(overlays.items, id);
}

export async function mockUpdatePrice(id: string, payload: PriceUpdatePayload) {
  return patchEntity(overlays.prices, id, { ...payload, updated_at: nowIso() });
}

export async function mockUpdateDepot(id: string, payload: DepotUpdatePayload) {
  return patchEntity(overlays.depots, id, { ...payload, updated_at: nowIso() });
}

export async function mockUpdateCalendarDay(
  date: string,
  payload: CalendarDayUpdatePayload
) {
  return patchEntity(overlays.calendar, date, payload);
}
