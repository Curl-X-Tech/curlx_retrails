import {
  useDriverVehicle,
  VehicleIdentityCard,
  VehicleReeferCard,
  VehicleFuelCard,
} from "@/features/driver";

export function DriverVehiclePage() {
  const { trip, currentTemp, fuelPercentage } = useDriverVehicle();

  return (
    <div className="w-full h-full flex flex-col min-h-0 p-3.5 space-y-3 overflow-y-auto select-none bg-muted/20">
      <VehicleIdentityCard trip={trip} />

      {trip.temp === "reefer" && <VehicleReeferCard currentTemp={currentTemp} />}

      <VehicleFuelCard trip={trip} fuelPercentage={fuelPercentage} />
    </div>
  );
}
