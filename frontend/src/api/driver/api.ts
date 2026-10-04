import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import { getCurrentRouteMock } from "./mock";
import type { CurrentRoute, DriverTripListItem } from "./types";

export async function getCurrentRoute(
  tripId?: string,
  signal?: AbortSignal
): Promise<CurrentRoute> {
  const ep = ENDPOINTS.driverCurrentRoute;
  if (shouldUseMock(ep.domain, ep.status)) {
    return getCurrentRouteMock();
  }
  const url = tripId ? `${ep.path}?trip_id=${tripId}` : ep.path;
  return apiClient<CurrentRoute>(url, {
    method: ep.method,
    signal,
  });
}

export async function getDriverTrips(
  signal?: AbortSignal
): Promise<DriverTripListItem[]> {
  const ep = ENDPOINTS.driverTripsList;
  if (shouldUseMock(ep.domain, ep.status)) {
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
  return apiClient<DriverTripListItem[]>(ep.path, {
    method: ep.method,
    signal,
  });
}

export async function activateDriverTrip(
  tripId: string,
  signal?: AbortSignal
): Promise<{ success: boolean; trip_id: string; status: string }> {
  const ep = ENDPOINTS.driverActivateTrip;
  const path = ep.path.replace("{trip_id}", tripId);
  return apiClient<{ success: boolean; trip_id: string; status: string }>(path, {
    method: ep.method,
    signal,
  });
}
