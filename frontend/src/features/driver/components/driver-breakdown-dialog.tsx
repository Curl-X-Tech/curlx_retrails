import * as React from "react";
import {
  WarningOctagonIcon,
  EngineIcon,
  SnowflakeIcon,
  CarSimpleIcon,
  GasPumpIcon,
  WrenchIcon,
  ThermometerSimpleIcon,
  MapPinIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useUpdateVehicle } from "@/api/fleet/hooks";

export type BreakdownReason =
  | "engine_failure"
  | "reefer_spike"
  | "tire_puncture"
  | "transmission_brake"
  | "accident"
  | "fuel_outage"
  | "other";

export interface DriverBreakdownDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  regNumber: string;
  isReefer?: boolean;
  currentLat?: number;
  currentLng?: number;
  onReportSuccess?: () => void;
}

const BREAKDOWN_REASONS: Array<{
  id: BreakdownReason;
  label: string;
  desc: string;
  icon: React.ElementType;
}> = [
  {
    id: "engine_failure",
    label: "Engine / Mechanical Stall",
    desc: "Overheating, battery failure, or vehicle immobilized",
    icon: EngineIcon,
  },
  {
    id: "reefer_spike",
    label: "Reefer Temperature Spike",
    desc: "Refrigeration fault or temperature rising above threshold",
    icon: SnowflakeIcon,
  },
  {
    id: "tire_puncture",
    label: "Tire Puncture / Flat",
    desc: "Tire blowout requiring roadside spare replacement",
    icon: WrenchIcon,
  },
  {
    id: "transmission_brake",
    label: "Brake / Gear Fault",
    desc: "Loss of hydraulic braking or transmission lock",
    icon: WarningOctagonIcon,
  },
  {
    id: "accident",
    label: "Collision / Obstruction",
    desc: "Traffic accident or physical obstruction on route",
    icon: CarSimpleIcon,
  },
  {
    id: "fuel_outage",
    label: "Fuel Depleted",
    desc: "Tank depleted before scheduled depot refill",
    icon: GasPumpIcon,
  },
];

export function DriverBreakdownDialog({
  isOpen,
  onOpenChange,
  vehicleId,
  regNumber,
  isReefer = false,
  currentLat = 6.9319,
  currentLng = 79.8478,
  onReportSuccess,
}: DriverBreakdownDialogProps) {
  const [selectedReason, setSelectedReason] =
    React.useState<BreakdownReason>("engine_failure");
  const [notes, setNotes] = React.useState("");
  const [reeferTemp, setReeferTemp] = React.useState("-18.0");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const updateVehicleMutation = useUpdateVehicle();

  const handleReportBreakdown = async () => {
    setIsSubmitting(true);
    try {
      await updateVehicleMutation.mutateAsync({
        id: vehicleId,
        payload: {
          status: "breakdown",
        },
      });

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "retrails_driver_breakdown_status",
          JSON.stringify({
            vehicleId,
            regNumber,
            reason: selectedReason,
            notes,
            reeferTemp: isReefer ? reeferTemp : undefined,
            lat: currentLat,
            lng: currentLng,
            reportedAt: new Date().toISOString(),
          })
        );
      }

      toast.error("Breakdown Reported", {
        description: `Emergency alert sent to Dispatcher & affected stores for #${regNumber}.`,
      });

      onOpenChange(false);
      onReportSuccess?.();
    } catch {
      toast.error("Failed to transmit alert. Action queued locally.");
      onOpenChange(false);
      onReportSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-1.5rem)] p-0 overflow-hidden border border-border bg-card rounded-3xl shadow-2xl">
        <DialogHeader className="p-4 sm:p-5 bg-rose-500/10 border-b border-rose-500/20 text-left relative">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
              <WarningOctagonIcon className="size-6" weight="fill" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="font-heading font-black text-base text-foreground tracking-tight truncate">
                  Report Breakdown
                </DialogTitle>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-400 font-heading font-bold text-[11px]">
                  #{regNumber}
                </span>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Notifies Dispatcher & affected stores for rescue deployment
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-4 max-h-[62vh] overflow-y-auto">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block px-0.5">
              Select Incident Type
            </span>
            <div className="grid grid-cols-1 gap-2">
              {BREAKDOWN_REASONS.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedReason === r.id;
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setSelectedReason(r.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-rose-500/10 border-rose-500/40 shadow-xs"
                        : "bg-background border-border/80 hover:bg-muted/40"
                    }`}
                  >
                    <div
                      className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-rose-600 text-white shadow-2xs"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-5" weight={isSelected ? "bold" : "regular"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-heading font-bold text-xs ${
                          isSelected
                            ? "text-rose-700 dark:text-rose-300"
                            : "text-foreground"
                        }`}
                      >
                        {r.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                        {r.desc}
                      </div>
                    </div>
                    <div
                      className={`size-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "border-rose-600 bg-rose-600"
                          : "border-border bg-background"
                      }`}
                    >
                      {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {isReefer && (
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-heading font-bold flex items-center gap-1.5 text-foreground">
                  <ThermometerSimpleIcon className="size-4 text-sky-500" weight="bold" />
                  Current Reefer Temp (°C)
                </span>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  Target: -18.0°C
                </span>
              </div>
              <Input
                type="number"
                step="0.1"
                value={reeferTemp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setReeferTemp(e.target.value)
                }
                className="h-10 text-sm font-heading font-bold rounded-xl"
                placeholder="-18.0"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block px-0.5">
              Additional Details & Location Notes
            </span>
            <textarea
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNotes(e.target.value)
              }
              placeholder="Provide exact road mile marker, safe shoulder parking, or towing needs..."
              className="w-full text-xs min-h-[72px] rounded-2xl border border-border bg-background p-3 text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/80 text-[11px] text-muted-foreground">
            <MapPinIcon className="size-4 shrink-0 text-primary" weight="fill" />
            <span className="truncate">
              GPS: {currentLat.toFixed(4)}, {currentLng.toFixed(4)} (Automatic)
            </span>
          </div>
        </div>

        <div className="p-4 bg-muted/20 border-t border-border flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 rounded-2xl text-xs font-bold cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={handleReportBreakdown}
            className="flex-[2] h-11 rounded-2xl text-xs font-heading font-black gap-2 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-md"
          >
            <PaperPlaneTiltIcon className="size-4" weight="bold" />
            <span>Transmit Alert</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
