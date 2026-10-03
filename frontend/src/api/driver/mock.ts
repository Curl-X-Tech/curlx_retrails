import { mockDelay } from "@/api/_mock-delay";
import { DEFAULT_CURRENT_ROUTE } from "./mock-data";
import type { CurrentRoute } from "./types";
import { db } from "@/lib/dexie-db";

let currentRouteState: CurrentRoute = JSON.parse(JSON.stringify(DEFAULT_CURRENT_ROUTE));

export async function getCurrentRouteMock(): Promise<CurrentRoute> {
  await mockDelay();
  try {
    const cached = await db.masterCache.get("driver_current_route");
    if (cached && cached.data) {
      currentRouteState = cached.data as CurrentRoute;
      return currentRouteState;
    }
  } catch (err) {
    // Fallback to memory state if Dexie unavailable
  }

  try {
    await db.masterCache.put({
      key: "driver_current_route",
      data: currentRouteState,
      cachedAt: new Date().toISOString(),
    });
  } catch (err) {
    // Ignore cache error
  }

  return currentRouteState;
}

export function updateInMemoryCurrentRoute(updated: CurrentRoute): void {
  currentRouteState = updated;
  void db.masterCache
    .put({
      key: "driver_current_route",
      data: updated,
      cachedAt: new Date().toISOString(),
    })
    .catch(() => {});
}

export function getInMemoryCurrentRoute(): CurrentRoute {
  return currentRouteState;
}
