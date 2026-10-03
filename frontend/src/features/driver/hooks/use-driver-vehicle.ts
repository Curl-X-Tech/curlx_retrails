import { useLatestTelemetry } from "@/api/telemetry";
import { mockDriverTrip } from "@/data/mock-driver-trips";
import type { DriverTrip } from "../types";

export function useDriverVehicle(trip: DriverTrip = mockDriverTrip) {
  const { data: telemetry } = useLatestTelemetry(trip.vehicleId);

  const currentTemp = telemetry?.reefer_temp_celsius ?? trip.reeferCurrentTempC ?? -18.2;

  const fuelPercentage =
    telemetry?.fuel_level_pct !== undefined && telemetry?.fuel_level_pct !== null
      ? Math.round(telemetry.fuel_level_pct)
      : Math.round((trip.fuelRemainingL / trip.weeklyFuelQuotaL) * 100);

  return {
    trip,
    currentTemp,
    fuelPercentage,
    telemetry,
  };
}
