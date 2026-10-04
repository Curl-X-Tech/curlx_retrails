import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import {
  getCurrentRouteMock,
  getDriverTripsMock,
  updateInMemoryCurrentRoute,
} from "./mock";
import type { CurrentRoute, DriverTripListItem } from "./types";
import { db } from "@/lib/dexie-db";

export async function getCurrentRoute(
  tripId?: string,
  signal?: AbortSignal
): Promise<CurrentRoute> {
  const ep = ENDPOINTS.driverCurrentRoute;
  if (
    shouldUseMock(ep.domain, ep.status) ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return getCurrentRouteMock();
  }
  try {
    const url = tripId ? `${ep.path}?trip_id=${tripId}` : ep.path;
    const data = await apiClient<CurrentRoute>(url, {
      method: ep.method,
      signal,
    });
    updateInMemoryCurrentRoute(data);
    return data;
  } catch {
    return getCurrentRouteMock();
  }
}

export async function getDriverTrips(
  signal?: AbortSignal
): Promise<DriverTripListItem[]> {
  const ep = ENDPOINTS.driverTripsList;
  if (
    shouldUseMock(ep.domain, ep.status) ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return getDriverTripsMock();
  }
  try {
    return await apiClient<DriverTripListItem[]>(ep.path, {
      method: ep.method,
      signal,
    });
  } catch {
    return getDriverTripsMock();
  }
}

export async function activateDriverTrip(
  tripId: string,
  signal?: AbortSignal
): Promise<{ success: boolean; trip_id: string; status: string }> {
  const ep = ENDPOINTS.driverActivateTrip;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    try {
      await db.trips.update(tripId, {
        status: "in_transit",
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // ignore
    }
    return { success: true, trip_id: tripId, status: "in_transit" };
  }
  try {
    const path = ep.path.replace("{trip_id}", tripId);
    const result = await apiClient<{ success: boolean; trip_id: string; status: string }>(
      path,
      {
        method: ep.method,
        signal,
      }
    );
    try {
      await db.trips.update(tripId, {
        status: "in_transit",
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // ignore
    }
    return result;
  } catch {
    try {
      await db.trips.update(tripId, {
        status: "in_transit",
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // ignore
    }
    return { success: true, trip_id: tripId, status: "in_transit" };
  }
}
