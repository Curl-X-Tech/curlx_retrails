import { useCurrentRoute } from "@/api/driver";
import { useLatestTelemetry } from "@/api/telemetry";

export function useDriverVehicle() {
  const { data: route } = useCurrentRoute();
  const vehicle = route?.trip.vehicle;
  const vehicleId = vehicle?.id;
  const { data: telemetry } = useLatestTelemetry(vehicleId || "", {
    enabled: Boolean(vehicleId),
  });

  const currentTemp =
    telemetry?.reefer_temp_celsius ?? vehicle?.reefer_current_temp_c ?? -18.2;

  const fuelRemaining = vehicle?.fuel_remaining_l ?? 84.5;
  const fuelQuota = vehicle?.weekly_fuel_quota_l ?? 120;
  const fuelPercentage =
    telemetry?.fuel_level_pct !== undefined && telemetry?.fuel_level_pct !== null
      ? Math.round(telemetry.fuel_level_pct)
      : Math.round((fuelRemaining / fuelQuota) * 100);

  const tripSummary = {
    id: route?.trip.id || "trip-4811",
    tripCode: route?.trip.trip_code || "RT-14",
    vehicleId: vehicleId || "VEH001",
    regNumber: vehicle?.reg_number || "NP-4811",
    modelName: vehicle?.model_name || "Isuzu ELF NPR Reefer",
    type: vehicle?.type || "truck",
    temp: vehicle?.temp || "reefer",
    weightCapKg: vehicle?.weight_cap_kg || 4200,
    volumeCapM3: vehicle?.volume_cap_m3 || 28.0,
    fuelType: vehicle?.fuel_type || "diesel",
    kmPerL: vehicle?.km_per_l || 6.8,
    weeklyFuelQuotaL: fuelQuota,
    fuelRemainingL: fuelRemaining,
    depotName: route?.trip.depot.name || "Peliyagoda Central DC",
  };

  return {
    route,
    vehicle,
    trip: tripSummary,
    currentTemp,
    fuelPercentage,
    telemetry,
  };
}
