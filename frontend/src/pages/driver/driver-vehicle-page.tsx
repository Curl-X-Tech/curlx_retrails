import * as React from "react";
import {
  WarningOctagonIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useDriverVehicle,
  VehicleIdentityCard,
  VehicleReeferCard,
  VehicleFuelCard,
  DriverBreakdownDialog,
} from "@/features/driver";

export function DriverVehiclePage() {
  const { trip, currentTemp, fuelPercentage } = useDriverVehicle();
  const [isBreakdownOpen, setIsBreakdownOpen] = React.useState(false);

  const localBreakdownRaw =
    typeof window !== "undefined"
      ? localStorage.getItem("retrails_driver_breakdown_status")
      : null;
  const breakdownData = localBreakdownRaw ? JSON.parse(localBreakdownRaw) : null;
  const isBreakdownActive = breakdownData && breakdownData.vehicleId === trip.vehicleId;

  return (
    <div className="w-full h-full flex flex-col min-h-0 p-3.5 space-y-3 overflow-y-auto select-none bg-muted/20">
      {isBreakdownActive && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 space-y-2">
          <div className="flex items-center gap-2">
            <WarningOctagonIcon className="size-5 shrink-0" weight="fill" />
            <span className="font-heading font-black text-xs uppercase tracking-wider">
              Emergency Breakdown Active
            </span>
          </div>
          <p className="text-xs leading-relaxed">
            Incident logged for <strong>#{trip.regNumber}</strong>. Dispatcher has been
            alerted. Stand by your vehicle for rescue instructions or workshop towing.
          </p>
          <div className="text-[11px] font-semibold text-rose-600/90 pt-1 border-t border-rose-500/20 flex justify-between">
            <span>Reason: {breakdownData.reason.replace("_", " ")}</span>
            <span>
              {new Date(breakdownData.reportedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      )}

      <VehicleIdentityCard trip={trip} />

      {trip.temp === "reefer" && <VehicleReeferCard currentTemp={currentTemp} />}

      <VehicleFuelCard trip={trip} fuelPercentage={fuelPercentage} />

      <Card className="p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4 text-emerald-600" weight="bold" />
            <span className="font-heading font-bold text-xs text-foreground">
              Daily Vehicle Pre-Trip Inspection
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            Passed
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5">
            <CheckCircleIcon className="size-3.5 text-emerald-600" weight="bold" />
            <span>Tire Pressure OK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircleIcon className="size-3.5 text-emerald-600" weight="bold" />
            <span>Brakes & Fluid OK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircleIcon className="size-3.5 text-emerald-600" weight="bold" />
            <span>Reefer Seal Verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircleIcon className="size-3.5 text-emerald-600" weight="bold" />
            <span>Fire Extinguisher OK</span>
          </div>
        </div>
      </Card>

      <div className="pt-1">
        <Button
          variant="destructive"
          onClick={() => setIsBreakdownOpen(true)}
          className="w-full text-xs font-bold gap-2 h-10 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-sm rounded-xl"
        >
          <WrenchIcon className="size-4" weight="bold" />
          <span>Report Breakdown / Roadside Issue</span>
        </Button>
      </div>

      <DriverBreakdownDialog
        isOpen={isBreakdownOpen}
        onOpenChange={setIsBreakdownOpen}
        vehicleId={trip.vehicleId}
        regNumber={trip.regNumber}
        isReefer={trip.temp === "reefer"}
      />
    </div>
  );
}
