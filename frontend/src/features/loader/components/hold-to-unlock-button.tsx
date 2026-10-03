import * as React from "react";
import { LockSimpleIcon, LockSimpleOpenIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface HoldToUnlockButtonProps {
  onUnlock: () => void;
  isShaking?: boolean;
  durationMs?: number;
  className?: string;
}

export function HoldToUnlockButton({
  onUnlock,
  isShaking = false,
  durationMs = 550,
  className,
}: HoldToUnlockButtonProps) {
  const [isHolding, setIsHolding] = React.useState(false);
  const [justUnlocked, setJustUnlocked] = React.useState(false);
  const unlockTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }

    setIsHolding(true);

    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
    }

    unlockTimerRef.current = setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([30, 40, 30]);
        } catch {
          // Ignore
        }
      }
      setJustUnlocked(true);
      setTimeout(() => setJustUnlocked(false), 350);
      onUnlock();
      setIsHolding(false);
      unlockTimerRef.current = null;
    }, durationMs);
  };

  const cancelHold = (e?: React.PointerEvent) => {
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
    setIsHolding(false);
    if (e) {
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Ignore
      }
    }
  };

  React.useEffect(() => {
    return () => {
      if (unlockTimerRef.current) {
        clearTimeout(unlockTimerRef.current);
      }
    };
  }, []);

  const size = 36;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <button
      type="button"
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-full bg-card border border-primary/30 text-primary transition-all duration-150 select-none cursor-pointer shadow-xs hover:bg-accent focus:outline-hidden touch-none",
        isHolding && "scale-90 bg-primary/20 border-primary ring-2 ring-primary/40",
        justUnlocked && "scale-110 bg-emerald-500/20 text-emerald-600 border-emerald-500/50",
        isShaking &&
          "animate-lock-shake ring-2 ring-destructive/50 text-destructive border-destructive/60 bg-destructive/10",
        className
      )}
      title="Hold to Unlock"
      aria-label="Hold to unlock sealed waypoint"
    >
      <svg
        className="absolute inset-0 size-full -rotate-90 pointer-events-none"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border/60"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth + 0.5}
          strokeDasharray={circumference}
          strokeDashoffset={isHolding ? 0 : circumference}
          strokeLinecap="round"
          style={{
            transition: isHolding
              ? `stroke-dashoffset ${durationMs}ms linear`
              : "stroke-dashoffset 150ms ease-out",
          }}
          className={cn("text-primary", isHolding ? "opacity-100" : "opacity-0")}
        />
      </svg>

      {justUnlocked ? (
        <LockSimpleOpenIcon className="size-5 animate-bounce text-emerald-500" weight="bold" />
      ) : (
        <LockSimpleIcon
          className={cn("size-5 text-primary transition-transform", isHolding && "scale-110")}
          weight="fill"
        />
      )}
    </button>
  );
}
