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

export async function getDriverTripsMock() {
  const route = await getCurrentRouteMock();
  return [
    {
      id: route.trip.id,
      trip_code: route.trip.trip_code,
      driver_id: route.trip.driver?.id || "drv-01",
      driver_name: route.trip.driver?.name || "Driver",
      date: route.trip.dispatch_date,
      status: route.trip.status,
      vehicle_id: route.trip.vehicle.id,
      reg_number: route.trip.vehicle.reg_number,
      model_name: route.trip.vehicle.model_name,
      depot_name: route.trip.depot.name,
      total_weight_kg: route.waypoints.reduce(
        (acc, w) => acc + w.order_summary.total_weight_kg,
        0
      ),
      total_volume_m3: route.trip.vehicle.volume_cap_m3,
      total_stops: route.waypoints.length,
      is_downloaded: true,
    },
  ];
}
