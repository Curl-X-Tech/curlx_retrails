import { mockDriverTrip } from "@/data/mock-driver-trips";
import type { DriverTrip } from "../types";

export function useDriverVehicle() {
  const trip: DriverTrip = mockDriverTrip;
  const currentTemp = trip.reeferCurrentTempC ?? -18.2;
  const fuelPercentage = Math.round((trip.fuelRemainingL / trip.weeklyFuelQuotaL) * 100);

  return {
    trip,
    currentTemp,
    fuelPercentage,
  };
}
