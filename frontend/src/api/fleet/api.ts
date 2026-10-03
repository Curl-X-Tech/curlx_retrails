import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import { fleetKeys } from "@/api/keys";
import { readThroughFleet } from "./cache";
import {
  createVehicleMock,
  getDriversMock,
  getVehicleMock,
  getVehiclesMock,
  updateVehicleMock,
} from "./mock";
import type {
  CreateVehiclePayload,
  Driver,
  DriverFilters,
  UpdateVehiclePayload,
  Vehicle,
  VehicleFilters,
} from "./types";

export async function getVehicles(
  filters: VehicleFilters = {},
  signal?: AbortSignal
): Promise<Vehicle[]> {
  const queryKey = [...fleetKeys.vehicles(), filters];
  return readThroughFleet(queryKey, async () => {
    if (
      shouldUseMock(
        ENDPOINTS.fleetVehiclesList.domain,
        ENDPOINTS.fleetVehiclesList.status
      )
    ) {
      return getVehiclesMock(filters);
    }
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filters.depot_id) params.depot_id = filters.depot_id;
    if (filters.type) params.type = filters.type;
    if (filters.temp) params.temp = filters.temp;
    if (filters.status) params.status = filters.status;
    if (filters.is_active !== undefined) params.is_active = filters.is_active;

    return apiClient<Vehicle[]>(ENDPOINTS.fleetVehiclesList.path, {
      method: ENDPOINTS.fleetVehiclesList.method,
      params,
      signal,
    });
  });
}

export async function getVehicle(id: string, signal?: AbortSignal): Promise<Vehicle> {
  const queryKey = fleetKeys.vehicle(id);
  return readThroughFleet(queryKey, async () => {
    if (
      shouldUseMock(ENDPOINTS.fleetVehiclesGet.domain, ENDPOINTS.fleetVehiclesGet.status)
    ) {
      return getVehicleMock(id);
    }
    const path = ENDPOINTS.fleetVehiclesGet.path.replace("{id}", encodeURIComponent(id));
    return apiClient<Vehicle>(path, {
      method: ENDPOINTS.fleetVehiclesGet.method,
      signal,
    });
  });
}

export async function createVehicle(payload: CreateVehiclePayload): Promise<Vehicle> {
  if (
    shouldUseMock(
      ENDPOINTS.fleetVehiclesCreate.domain,
      ENDPOINTS.fleetVehiclesCreate.status
    )
  ) {
    return createVehicleMock(payload);
  }
  return apiClient<Vehicle>(ENDPOINTS.fleetVehiclesCreate.path, {
    method: ENDPOINTS.fleetVehiclesCreate.method,
    body: payload,
  });
}

export async function updateVehicle(
  id: string,
  payload: UpdateVehiclePayload
): Promise<Vehicle> {
  if (
    shouldUseMock(
      ENDPOINTS.fleetVehiclesUpdate.domain,
      ENDPOINTS.fleetVehiclesUpdate.status
    )
  ) {
    return updateVehicleMock(id, payload);
  }
  const path = ENDPOINTS.fleetVehiclesUpdate.path.replace("{id}", encodeURIComponent(id));
  return apiClient<Vehicle>(path, {
    method: ENDPOINTS.fleetVehiclesUpdate.method,
    body: payload,
  });
}

export async function getDrivers(
  filters: DriverFilters = {},
  signal?: AbortSignal
): Promise<Driver[]> {
  const queryKey = [...fleetKeys.drivers(), filters];
  return readThroughFleet(queryKey, async () => {
    if (
      shouldUseMock(ENDPOINTS.fleetDriversList.domain, ENDPOINTS.fleetDriversList.status)
    ) {
      return getDriversMock(filters);
    }
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filters.depot_id) params.depot_id = filters.depot_id;
    if (filters.is_active !== undefined) params.is_active = filters.is_active;

    return apiClient<Driver[]>(ENDPOINTS.fleetDriversList.path, {
      method: ENDPOINTS.fleetDriversList.method,
      params,
      signal,
    });
  });
}
