import { SnowflakeIcon, ThermometerSimpleIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VehicleReeferCardProps {
  currentTemp: number;
}

export function VehicleReeferCard({ currentTemp }: VehicleReeferCardProps) {
  return (
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
  );
}
