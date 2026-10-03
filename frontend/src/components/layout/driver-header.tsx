import {
  ListIcon,
  CoffeeIcon,
  CloudSlashIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useCurrentRoute } from "@/api/driver";

export interface DriverHeaderProps {
  onOpenDrawer: () => void;
  isOnBreak: boolean;
  onToggleBreak: () => void;
  onOpenBreakModal: () => void;
  breakTimerSeconds: number;
  isOnline: boolean;
  syncState: string;
  pendingCount: number;
}

export function DriverHeader({
  onOpenDrawer,
  isOnBreak,
  onToggleBreak,
  onOpenBreakModal,
  breakTimerSeconds,
  isOnline,
  syncState,
  pendingCount,
}: DriverHeaderProps) {
  const { data: route } = useCurrentRoute();
  const tripCode = route?.trip.trip_code || "RT-14";
  const regNumber = route?.trip.vehicle.reg_number || "NP-4811";

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <>
      <header className="h-14 shrink-0 bg-background/95 backdrop-blur-md border-b border-border/80 px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDrawer}
            className="size-9 flex items-center justify-center rounded-xl hover:bg-muted text-foreground transition-colors cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <ListIcon className="size-5" weight="bold" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-heading font-black text-sm text-foreground">
            {tripCode}
          </span>
          <span className="text-muted-foreground text-xs font-semibold">·</span>
          <span className="text-xs font-bold text-muted-foreground">#{regNumber}</span>
        </div>

        {isOnBreak ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={onToggleBreak}
            className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 shadow-sm animate-pulse cursor-pointer"
          >
            <CoffeeIcon className="size-3.5" weight="bold" />
            <span>Resume ({formatTimer(breakTimerSeconds)})</span>
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onOpenBreakModal}
            className="h-8 px-3.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
          >
            Add Break
          </Button>
        )}
      </header>

      {!isOnline && (
        <div className="bg-red-600 text-white text-xs font-semibold px-3.5 py-2 flex items-center justify-between shadow-xs shrink-0 z-20">
          <div className="flex items-center gap-2">
            <CloudSlashIcon className="size-4 shrink-0" weight="bold" />
            <span>Offline Mode — All actions saved locally</span>
          </div>
          {pendingCount > 0 && (
            <span className="text-[11px] bg-red-800/90 text-white px-2 py-0.5 rounded-md font-bold">
              {pendingCount} pending
            </span>
          )}
        </div>
      )}

      {isOnline && (syncState === "syncing" || pendingCount > 0) && (
        <div className="bg-sky-600 text-white text-xs font-semibold px-3.5 py-1.5 flex items-center justify-between shadow-xs shrink-0 z-20">
          <div className="flex items-center gap-2">
            <ArrowsClockwiseIcon
              className="size-3.5 shrink-0 animate-spin"
              weight="bold"
            />
            <span>Syncing offline actions with server...</span>
          </div>
          <span className="text-[11px] bg-sky-800/90 text-white px-2 py-0.5 rounded-md font-bold">
            {pendingCount} remaining
          </span>
        </div>
      )}
    </>
  );
}
