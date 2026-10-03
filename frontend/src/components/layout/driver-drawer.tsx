import { useNavigate } from "react-router-dom";
import { TruckIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useOfflineActiveTrip } from "@/features/driver/hooks/use-offline-trip";
import { cn } from "@/lib/utils";

export interface DriverDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DriverDrawer({ isOpen, onOpenChange }: DriverDrawerProps) {
  const navigate = useNavigate();
  const { route } = useOfflineActiveTrip();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0 flex flex-col bg-card">
        <SheetHeader className="p-4 pb-3 border-b border-border/70 text-left">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="size-8 rounded-lg bg-card border border-border/70 overflow-hidden p-1 shrink-0 flex items-center justify-center shadow-2xs">
              <img
                src="/icon.png"
                alt="ReTrails Logo"
                className="size-full object-contain"
              />
            </div>
            <div>
              <div className="font-heading font-black text-sm text-foreground leading-tight">
                ReTrails Driver
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">
                Pilot Operating Console
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                navigate("/driver/trips");
              }}
              className="w-full text-xs font-semibold gap-1.5 h-8 justify-center"
            >
              <TruckIcon className="size-4 text-primary" />
              <span>Switch Assigned Trip</span>
            </Button>
          </div>
          <SheetTitle className="font-heading font-black text-base text-foreground flex items-center justify-between">
            <span>Trip Manifest {route?.trip.trip_code || "RT-14"}</span>
            <span className="text-xs font-bold text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
              {route?.waypoints.length || 0} Stops
            </span>
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Vehicle #{route?.trip.vehicle.reg_number || "NP-4811"} · Seal #
            {route?.trip.seal_number || "SL-90821-B"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pilot:</span>
              <strong className="text-foreground">
                {route?.trip.driver?.name || "Driver"}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">License:</span>
              <span className="font-heading font-semibold text-[11px]">
                {route?.trip.driver?.license_id || "DL-00000"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shift Rollout:</span>
              <span className="font-semibold text-foreground">
                {route?.trip.dispatch_date || "2026-10-03"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-muted-foreground px-1">
              Route Waypoints
            </h4>
            {(route?.waypoints || []).map((wp) => {
              const isCurrent = route?.active_waypoint_seq === wp.seq;
              const isCompleted = wp.status === "completed";
              return (
                <button
                  key={wp.seq}
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/driver/active?wp=${wp.seq}`);
                  }}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer",
                    isCompleted
                      ? "bg-emerald-500/5 border-emerald-500/30 text-muted-foreground"
                      : isCurrent
                        ? "bg-primary/10 border-primary text-foreground font-bold shadow-xs"
                        : "bg-background border-border hover:bg-accent text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "size-5.5 rounded-md flex items-center justify-center font-heading font-black text-xs shrink-0",
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {wp.seq}
                    </span>
                    <span className="truncate">{wp.outlet_name}</span>
                  </div>
                  {isCompleted && (
                    <CheckCircleIcon
                      className="size-4 text-emerald-600 shrink-0"
                      weight="fill"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
