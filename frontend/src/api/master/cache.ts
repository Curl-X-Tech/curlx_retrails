import { db } from "@/lib/dexie-db";

export async function writeMasterCache(key: string, data: unknown): Promise<void> {
  try {
    await db.masterCache.put({ key, data, cachedAt: new Date().toISOString() });
  } catch {
    return;
  }
}

export async function readMasterCache<T>(key: string): Promise<T | null> {
  try {
    const entry = await db.masterCache.get(key);
    return entry ? (entry.data as T) : null;
  } catch {
    return null;
  }
}

export async function readThrough<T>(
  key: readonly unknown[],
  fetcher: () => Promise<T>
): Promise<T> {
  const cacheKey = JSON.stringify(key);
  try {
    const data = await fetcher();
    await writeMasterCache(cacheKey, data);
    return data;
  } catch (err) {
    const cached = await readMasterCache<T>(cacheKey);
    if (cached !== null) return cached;
    throw err;
  }
}
