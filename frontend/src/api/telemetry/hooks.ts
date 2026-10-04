import { useMutation, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { telemetryKeys } from "@/api/keys";
import type { VehicleTrackingData } from "@/types";
import { getLatestTelemetry, getLiveTelemetry, reportTelemetry } from "./api";
import type {
  LiveVehicleTelemetry,
  TelemetryReportRequest,
  VehicleTelemetry,
} from "./types";

export function mapTelemetryToTrackingData(
  item: LiveVehicleTelemetry
): VehicleTrackingData {
  return {
    id: String(item.id || item.vehicle_id),
    code: item.reg_number,
    vehicleId: item.vehicle_id,
    vehicleType: item.vehicle_type,
    vehicleCategory: item.vehicle_category,
    temp: item.temp,
    reeferTempCelsius: item.reefer_temp_celsius ?? undefined,
    brand: item.brand as "Fresh" | "Style" | "Tech",
    depot: item.depot,
    imageUrl:
      item.image_url ||
      (item.vehicle_category === "van"
        ? "/vehicle-images/van.png"
        : item.temp === "reefer"
          ? "/vehicle-images/freeze.png"
          : "/vehicle-images/dry.png"),
    driverName: item.driver_name,
    driverPhone: item.driver_phone,
    status: item.status,
    currentLocation: [item.latitude, item.longitude],
    heading: item.heading_deg || 0,
    weightPercentage: item.weight_percentage,
    weightKg: item.weight_kg,
    maxWeightKg: item.max_weight_kg,
    volumePercentage: item.volume_percentage,
    volumeCbm: item.volume_cbm,
    maxVolumeCbm: item.max_volume_cbm,
    cratesCount: item.crates_count,
    nextStop: item.next_stop,
    nextStopEta: item.next_stop_eta,
    stopsTotal: item.stops_total,
    stopsCompleted: item.stops_completed,
  };
}

export function useLiveTelemetry<TData = LiveVehicleTelemetry[]>(
  options: Omit<
    UseQueryOptions<LiveVehicleTelemetry[], Error, TData>,
    "queryKey" | "queryFn"
  > = {}
) {
  return useQuery({
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
    staleTime: 5000,
    ...options,
    queryKey: telemetryKeys.live(),
    queryFn: ({ signal }) => getLiveTelemetry(signal),
  });
}

export function useLiveMapVehicles(
  options: Omit<
    UseQueryOptions<LiveVehicleTelemetry[], Error, VehicleTrackingData[]>,
    "queryKey" | "queryFn" | "select"
  > = {}
) {
  return useLiveTelemetry<VehicleTrackingData[]>({
    ...options,
    select: (list) => list.map(mapTelemetryToTrackingData),
  });
}

const isValidUuid = (val?: string) =>
  Boolean(
    val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
  );

export function useLatestTelemetry<TData = VehicleTelemetry>(
  vehicleId: string,
  options: Omit<
    UseQueryOptions<VehicleTelemetry, Error, TData>,
    "queryKey" | "queryFn"
  > = {}
) {
  return useQuery({
    staleTime: 10000,
    ...options,
    queryKey: telemetryKeys.vehicleLatest(vehicleId),
    queryFn: ({ signal }) => getLatestTelemetry(vehicleId, signal),
    enabled: Boolean(vehicleId) && isValidUuid(vehicleId) && options.enabled !== false,
  });
}

export function useReportTelemetry() {
  return useMutation({
    mutationFn: (payload: TelemetryReportRequest) => reportTelemetry(payload),
  });
}
