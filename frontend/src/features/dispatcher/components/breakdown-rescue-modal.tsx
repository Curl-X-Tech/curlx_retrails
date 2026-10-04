import * as React from "react";
import {
  TruckIcon,
  CheckIcon,
  XIcon,
  CircleNotchIcon,
  CubeIcon,
  ScalesIcon,
  SnowflakeIcon,
  LightningIcon,
  HandPointingIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVehicles, useUpdateVehicle } from "@/api/fleet";
import { toast } from "sonner";

export interface BreakdownRescueModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  breakdownVehicle: {
    id: string;
    regNumber: string;
    modelName: string;
    driverName?: string;
    reason?: string;
    temp: "reefer" | "ambient";
    remainingWeightKg: number;
    remainingVolumeM3: number;
    remainingStops: number;
  };
  onRescueComplete?: (newVehicleReg: string) => void;
}

type StepState = "done" | "failed" | "active" | "idle";

function StepMarker({ state }: { state: StepState }) {
  const base =
    "absolute -left-2.5 top-0.5 size-5 rounded-full flex items-center justify-center";
  if (state === "done")
    return (
      <span className={`${base} bg-primary text-primary-foreground`}>
        <CheckIcon className="size-3" weight="bold" />
      </span>
    );
  if (state === "failed")
    return (
      <span className={`${base} bg-red-600 text-white`}>
        <XIcon className="size-3" weight="bold" />
      </span>
    );
  if (state === "active")
    return (
      <span className={`${base} border-2 border-primary bg-background`}>
        <CircleNotchIcon className="size-3 animate-spin text-primary" />
      </span>
    );
  return <span className={`${base} border-2 border-border bg-background`} />;
}

type RescueStage =
  | "diagnosing"
  | "decision"
  | "solving_scan"
  | "solving_capacity"
  | "solving_route"
  | "solved"
  | "failed"
  | "manual";

export function BreakdownRescueModal({
  isOpen,
  onOpenChange,
  breakdownVehicle,
  onRescueComplete,
}: BreakdownRescueModalProps) {
  const { data: vehicles = [] } = useVehicles();
  const updateVehicleMutation = useUpdateVehicle();

  const [stage, setStage] = React.useState<RescueStage>("diagnosing");
  const [countdown, setCountdown] = React.useState<number>(5);
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string | null>(null);

  const availableVehicles = React.useMemo(() => {
    return vehicles.filter(
      (v) =>
        v.id !== breakdownVehicle.id &&
        (v.status === "available" || v.status === "in_workshop")
    );
  }, [vehicles, breakdownVehicle.id]);

  const candidateRescueVehicle = React.useMemo(() => {
    return availableVehicles.find(
      (v) =>
        (breakdownVehicle.temp === "ambient" || v.temp === "reefer") &&
        v.weight_cap_kg >= breakdownVehicle.remainingWeightKg &&
        v.volume_cap_m3 >= breakdownVehicle.remainingVolumeM3
    );
  }, [availableVehicles, breakdownVehicle]);

  // Reset and start diagnosis flow when modal opens
  React.useEffect(() => {
    if (!isOpen) return;

    setStage("diagnosing");
    setCountdown(5);
    setSelectedVehicleId(null);

    const diagTimer = setTimeout(() => {
      setStage("decision");
    }, 1000);

    return () => clearTimeout(diagTimer);
  }, [isOpen]);

  const startSolverFlow = React.useCallback(() => {
    setStage("solving_scan");

    setTimeout(() => {
      setStage("solving_capacity");

      setTimeout(() => {
        setStage("solving_route");

        setTimeout(() => {
          if (candidateRescueVehicle) {
            setSelectedVehicleId(candidateRescueVehicle.id);
            setStage("solved");
          } else {
            setStage("failed");
          }
        }, 700);
      }, 700);
    }, 700);
  }, [candidateRescueVehicle]);

  // 5-second countdown timer during "decision" stage
  React.useEffect(() => {
    if (stage !== "decision") return;

    if (countdown <= 0) {
      startSolverFlow();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, countdown, startSolverFlow]);

  const handleConfirmRescue = async () => {
    const targetVehId = selectedVehicleId || candidateRescueVehicle?.id;
    if (!targetVehId) return;

    const targetVehicle = vehicles.find((v) => v.id === targetVehId);

    try {
      await updateVehicleMutation.mutateAsync({
        id: targetVehId,
        payload: {
          status: "in_transit",
        },
      });

      await updateVehicleMutation.mutateAsync({
        id: breakdownVehicle.id,
        payload: {
          status: "in_workshop",
        },
      });

      toast.success("Rescue Vehicle Dispatched", {
        description: `Waypoints transferred to ${targetVehicle?.reg_number || "rescue truck"}. Affected store managers alerted.`,
      });

      if (typeof window !== "undefined") {
        localStorage.removeItem("retrails_driver_breakdown_status");
      }

      onOpenChange(false);
      onRescueComplete?.(targetVehicle?.reg_number || "NP-4811");
    } catch {
      toast.error("Failed to complete rescue dispatch.");
    }
  };

  const handleDeferRemaining = () => {
    toast.warning("Remaining Orders Deferred", {
      description: `${breakdownVehicle.remainingStops} stops queued for tomorrow's Wave 1 allocation. Store managers notified.`,
    });
    onOpenChange(false);
  };

  // Step states for the progressive timeline
  const stepDiagnosis: StepState = stage === "diagnosing" ? "active" : "done";

  const stepDecision: StepState =
    stage === "diagnosing" ? "idle" : stage === "decision" ? "active" : "done";

  const stepSolver: StepState =
    stage === "solving_scan" || stage === "solving_capacity" || stage === "solving_route"
      ? "active"
      : stage === "solved"
        ? "done"
        : stage === "failed"
          ? "failed"
          : stage === "manual"
            ? "done"
            : "idle";

  const stepResolution: StepState =
    stage === "solved" || stage === "manual"
      ? "active"
      : stage === "failed"
        ? "failed"
        : "idle";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-border bg-card rounded-2xl">
        <DialogHeader className="p-4 bg-muted/30 border-b border-border text-left">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <TruckIcon className="size-5" weight="duotone" />
            </div>
            <div>
              <DialogTitle className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                <span>Vehicle Reassignment: #{breakdownVehicle.regNumber}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  Incident
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Assigned: {breakdownVehicle.driverName || "Driver"} ·{" "}
                {breakdownVehicle.reason || "Mechanical issue reported"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[68vh] overflow-y-auto">
          {/* Stranded Cargo Summary */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span>Stranded Consignment</span>
              <span className="text-primary font-heading">
                {breakdownVehicle.remainingStops} Stops Remaining
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-background border border-border">
                <ScalesIcon className="size-3.5 text-primary shrink-0" />
                <span className="truncate font-semibold text-foreground">
                  {breakdownVehicle.remainingWeightKg} kg
                </span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-background border border-border">
                <CubeIcon className="size-3.5 text-primary shrink-0" />
                <span className="truncate font-semibold text-foreground">
                  {breakdownVehicle.remainingVolumeM3} m³
                </span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-background border border-border">
                <SnowflakeIcon
                  className={`size-3.5 ${
                    breakdownVehicle.temp === "reefer" ? "text-sky-500" : "text-amber-500"
                  } shrink-0`}
                />
                <span className="truncate font-semibold text-foreground uppercase">
                  {breakdownVehicle.temp}
                </span>
              </div>
            </div>
          </div>

          {/* Progressive AI & Allocation Timeline */}
          <ol className="relative ml-3 border-l border-dashed border-border space-y-5 py-1">
            {/* Step 1: Diagnosis */}
            <li className="pl-6 relative">
              <StepMarker state={stepDiagnosis} />
              <p className="text-xs font-bold text-foreground">
                Incident Diagnostics & Telemetry
              </p>
              <p className="text-[11px] text-muted-foreground">
                {stage === "diagnosing"
                  ? "Evaluating vehicle telemetry, GPS fix, and cargo vulnerability..."
                  : "Telemetry analyzed. Engine failure verified; cargo at immediate risk."}
              </p>
            </li>

            {/* Step 2: Resolution Strategy & 5s Auto Countdown */}
            <li className="pl-6 relative">
              <StepMarker state={stepDecision} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground">
                    Resolution Strategy Selection
                  </p>
                  {stage === "decision" && (
                    <span className="text-[11px] font-mono font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      Auto-solving in {countdown}s
                    </span>
                  )}
                </div>

                {stage === "decision" && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => startSolverFlow()}
                      className="flex-1 h-8 text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <LightningIcon className="size-3.5" weight="fill" />
                      <span>Auto Allocate Now</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStage("manual")}
                      className="flex-1 h-8 text-xs font-semibold gap-1.5 cursor-pointer border-border hover:bg-muted/60"
                    >
                      <HandPointingIcon className="size-3.5" weight="bold" />
                      <span>Manual Allocate</span>
                    </Button>
                  </div>
                )}

                {stage !== "diagnosing" && stage !== "decision" && (
                  <p className="text-[11px] text-muted-foreground">
                    {stage === "manual"
                      ? "Manual allocation mode selected."
                      : "Automated engine resolution dispatched."}
                  </p>
                )}
              </div>
            </li>

            {/* Step 3: Constraint Solver Engine */}
            {stage !== "diagnosing" && stage !== "decision" && stage !== "manual" && (
              <li className="pl-6 relative">
                <StepMarker state={stepSolver} />
                <p className="text-xs font-bold text-foreground">
                  Fleet Constraint Optimization
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {stage === "solving_scan" &&
                    "Scanning depot fleet for active standby units..."}
                  {stage === "solving_capacity" &&
                    `Validating payload capacity (>= ${breakdownVehicle.remainingWeightKg} kg, >= ${breakdownVehicle.remainingVolumeM3} m³)...`}
                  {stage === "solving_route" &&
                    "Re-sequencing delivery waypoints and computing optimal ETAs..."}
                  {stage === "solved" &&
                    "Feasible standby vehicle locked and route re-sequenced."}
                  {stage === "failed" &&
                    "No standby vehicle satisfies capacity or temperature constraints."}
                </p>
              </li>
            )}

            {/* Step 4: Outcome & Action */}
            {(stage === "solved" || stage === "manual" || stage === "failed") && (
              <li className="pl-6 relative">
                <StepMarker state={stepResolution} />
                <p className="text-xs font-bold text-foreground">
                  {stage === "failed"
                    ? "Rescue Allocation Unfeasible"
                    : "Rescue Vehicle Assignment"}
                </p>

                {/* Candidate Success Card */}
                {stage === "solved" && candidateRescueVehicle && (
                  <div className="mt-2 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Optimal Replacement Match
                      </span>
                      <Badge variant="success" className="text-[10px] h-4">
                        Feasible
                      </Badge>
                    </div>
                    <div className="p-2.5 rounded-lg bg-background border border-border flex items-center justify-between text-xs">
                      <div>
                        <div className="font-heading font-bold text-foreground">
                          {candidateRescueVehicle.reg_number} (
                          {candidateRescueVehicle.model_name})
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Cap: {candidateRescueVehicle.weight_cap_kg} kg ·{" "}
                          {candidateRescueVehicle.volume_cap_m3} m³ ·{" "}
                          {candidateRescueVehicle.temp.toUpperCase()}
                        </div>
                      </div>
                      <TruckIcon
                        className="size-6 text-primary shrink-0"
                        weight="duotone"
                      />
                    </div>
                  </div>
                )}

                {/* Manual Selection List */}
                {stage === "manual" && (
                  <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {availableVehicles.map((veh) => {
                      const isSelected = selectedVehicleId === veh.id;
                      const isCapable =
                        (breakdownVehicle.temp === "ambient" || veh.temp === "reefer") &&
                        veh.weight_cap_kg >= breakdownVehicle.remainingWeightKg;

                      return (
                        <button
                          key={veh.id}
                          onClick={() => setSelectedVehicleId(veh.id)}
                          className={`w-full text-left p-2 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 border-primary shadow-xs"
                              : "bg-background border-border hover:bg-muted/40"
                          }`}
                        >
                          <div>
                            <div className="font-heading font-bold text-foreground flex items-center gap-1.5">
                              <span>{veh.reg_number}</span>
                              <span className="text-[10px] text-muted-foreground">
                                ({veh.model_name})
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {veh.weight_cap_kg} kg · {veh.volume_cap_m3} m³ ·{" "}
                              {veh.temp.toUpperCase()}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isCapable
                                ? "text-emerald-600 bg-emerald-500/10"
                                : "text-amber-600 bg-amber-500/10"
                            }`}
                          >
                            {isCapable ? "Compatible" : "Under-capacity"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Failure Resolution Actions */}
                {stage === "failed" && (
                  <div className="mt-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2.5">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      All reefer units at the central depot are fully utilized. The
                      remaining consignment cannot be preserved on available ambient
                      trucks.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStage("manual")}
                        className="text-xs h-8 flex-1 cursor-pointer"
                      >
                        Select Manually
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDeferRemaining}
                        className="text-xs font-bold h-8 flex-1 cursor-pointer"
                      >
                        Defer to Tomorrow
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            )}
          </ol>
        </div>

        <DialogFooter className="p-3 bg-muted/20 border-t border-border flex items-center justify-between sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8 cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={
              stage === "diagnosing" ||
              stage === "decision" ||
              stage === "solving_scan" ||
              stage === "solving_capacity" ||
              stage === "solving_route" ||
              stage === "failed" ||
              (stage === "manual" && !selectedVehicleId)
            }
            onClick={handleConfirmRescue}
            className="text-xs font-bold h-8 gap-1.5 shadow-sm cursor-pointer"
          >
            <TruckIcon className="size-4" weight="bold" />
            <span>Deploy Rescue Vehicle</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
