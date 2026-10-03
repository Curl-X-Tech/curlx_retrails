import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { fleetKeys, telemetryKeys } from "@/api/keys";
import { createVehicle, getDrivers, getVehicle, getVehicles, updateVehicle } from "./api";
import type {
  CreateVehiclePayload,
  Driver,
  DriverFilters,
  UpdateVehiclePayload,
  Vehicle,
  VehicleFilters,
} from "./types";

const FLEET_STALE_TIME = 1000 * 60 * 5;

export function useVehicles<TData = Vehicle[]>(
  filters: VehicleFilters = {},
  options: Omit<UseQueryOptions<Vehicle[], Error, TData>, "queryKey" | "queryFn"> = {}
) {
  return useQuery({
    staleTime: FLEET_STALE_TIME,
    ...options,
    queryKey: [...fleetKeys.vehicles(), filters],
    queryFn: ({ signal }) => getVehicles(filters, signal),
  });
}

export function useVehicle<TData = Vehicle>(
  id: string,
  options: Omit<UseQueryOptions<Vehicle, Error, TData>, "queryKey" | "queryFn"> = {}
) {
  return useQuery({
    staleTime: FLEET_STALE_TIME,
    ...options,
    queryKey: fleetKeys.vehicle(id),
    queryFn: ({ signal }) => getVehicle(id, signal),
    enabled: Boolean(id) && options.enabled !== false,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVehiclePayload) => createVehicle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fleetKeys.vehicles() });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVehiclePayload }) =>
      updateVehicle(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: fleetKeys.vehicles() });
      queryClient.invalidateQueries({ queryKey: fleetKeys.vehicle(id) });
      queryClient.invalidateQueries({ queryKey: telemetryKeys.live() });
    },
  });
}

export function useDrivers<TData = Driver[]>(
  filters: DriverFilters = {},
  options: Omit<UseQueryOptions<Driver[], Error, TData>, "queryKey" | "queryFn"> = {}
) {
  return useQuery({
    staleTime: FLEET_STALE_TIME,
    ...options,
    queryKey: [...fleetKeys.drivers(), filters],
    queryFn: ({ signal }) => getDrivers(filters, signal),
  });
}
