import {
  TruckIcon,
  SnowflakeIcon,
  GasPumpIcon,
  ThermometerSimpleIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockDriverTrip } from "@/data/mock-driver-trips";

export function DriverVehiclePage() {
  const trip = mockDriverTrip;
  const currentTemp = trip.reeferCurrentTempC ?? -18.2;

  const fuelPercentage = Math.round((trip.fuelRemainingL / trip.weeklyFuelQuotaL) * 100);

  return (
    <div className="w-full h-full flex flex-col min-h-0 p-3.5 space-y-3 overflow-y-auto select-none bg-muted/20">
      {/* Vehicle Identity Card */}
      <Card className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <TruckIcon className="size-5" weight="bold" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-foreground">
                #{trip.regNumber}
              </h3>
              <span className="text-xs text-muted-foreground">{trip.modelName}</span>
            </div>
          </div>
          <Badge variant="secondary" className="font-bold text-xs">
            {trip.type.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-muted-foreground text-[10px]">Odometer Reading</span>
            <div className="font-heading font-bold text-sm text-foreground mt-0.5">
              {trip.currentOdometerKm.toLocaleString()} KM
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60">
            <span className="text-muted-foreground text-[10px]">Security Bolt Seal</span>
            <div className="font-heading font-bold text-xs text-foreground mt-0.5">
              {trip.sealNumber}
            </div>
          </div>
        </div>
      </Card>

      {/* Reefer Temperature Live Monitor */}
      {trip.temp === "reefer" && (
        <Card className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/30 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SnowflakeIcon className="size-5 text-sky-500" weight="bold" />
              <h4 className="font-heading font-bold text-sm text-foreground">
                Cold Chain Cargo Bay
              </h4>
            </div>
            <Badge
              variant="outline"
              className="bg-sky-500/10 text-sky-600 border-sky-500/30 text-[10px] font-bold"
            >
              Setpoint -18.0°C
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-sky-500/20">
            <div className="flex items-center gap-2">
              <ThermometerSimpleIcon className="size-6 text-sky-500" weight="bold" />
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Live Sensor
                </span>
                <div className="font-heading font-black text-lg text-foreground">
                  {currentTemp.toFixed(1)}°C
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Target Maintained
            </span>
          </div>
        </Card>
      )}

      {/* Weekly Fuel Quota Card */}
      <Card className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GasPumpIcon className="size-5 text-primary" weight="bold" />
            <h4 className="font-heading font-bold text-sm text-foreground">
              Fuel Quota & Efficiency
            </h4>
          </div>
          <span className="font-heading font-bold text-xs text-foreground">
            {trip.kmPerL} km/L
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-medium">Remaining Fuel</span>
            <strong className="text-foreground">
              {trip.fuelRemainingL} L / {trip.weeklyFuelQuotaL} L ({fuelPercentage}%)
            </strong>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${fuelPercentage}%` }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
