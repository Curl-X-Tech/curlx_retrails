import { TimerIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface TruckCountdownBarProps {
  departureTime: string;
  timeString: string;
  isCritical: boolean;
  isWarning: boolean;
}

export function TruckCountdownBar({
  departureTime,
  timeString,
  isCritical,
  isWarning,
}: TruckCountdownBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-xl border transition-colors",
        isCritical
          ? "border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-100"
          : isWarning
            ? "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100"
            : "border-primary/20 bg-primary/5 text-foreground"
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <TimerIcon
          className={cn(
            "size-4 shrink-0",
            isCritical
              ? "text-rose-600 dark:text-rose-400"
              : isWarning
                ? "text-amber-600 dark:text-amber-400"
                : "text-primary"
          )}
          weight="bold"
        />
        <span className="text-xs text-muted-foreground font-medium">
          Rollout {departureTime}
        </span>
      </div>
      <span
        className={cn(
          "text-xs sm:text-sm font-heading font-black tracking-tight",
          isCritical
            ? "text-rose-600 dark:text-rose-400"
            : isWarning
              ? "text-amber-600 dark:text-amber-400"
              : "text-primary"
        )}
      >
        {timeString} left
      </span>
    </div>
  );
}
