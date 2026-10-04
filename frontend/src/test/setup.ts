import "fake-indexeddb/auto";
import { indexedDB, IDBKeyRange } from "fake-indexeddb";
import { Dexie } from "dexie";

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

if (typeof window === "undefined") {
  const target = new EventTarget();
  (globalThis as unknown as { window: unknown }).window = {
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
    setInterval: globalThis.setInterval.bind(globalThis),
    clearInterval: globalThis.clearInterval.bind(globalThis),
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    indexedDB,
    IDBKeyRange,
  };
}

if (!(globalThis as unknown as { indexedDB?: unknown }).indexedDB) {
  (globalThis as unknown as { indexedDB: unknown }).indexedDB = indexedDB;
}
if (!(globalThis as unknown as { IDBKeyRange?: unknown }).IDBKeyRange) {
  (globalThis as unknown as { IDBKeyRange: unknown }).IDBKeyRange = IDBKeyRange;
}
