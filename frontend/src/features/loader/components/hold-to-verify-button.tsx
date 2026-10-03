import * as React from "react";
import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface HoldToVerifyButtonProps {
  isVerified: boolean;
  onToggle: () => void;
  disabled?: boolean;
  onDisabledAttempt?: () => void;
  durationMs?: number;
  className?: string;
  ariaLabel?: string;
}

export function HoldToVerifyButton({
  isVerified,
  onToggle,
  disabled = false,
  onDisabledAttempt,
  durationMs = 400,
  className,
  ariaLabel,
}: HoldToVerifyButtonProps) {
  const [isHolding, setIsHolding] = React.useState(false);
  const [justTriggered, setJustTriggered] = React.useState(false);
  const holdTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = (e: React.PointerEvent) => {
    if (disabled) {
      onDisabledAttempt?.();
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }
    setIsHolding(true);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(35);
        } catch {
          // Ignore
        }
      }
      setJustTriggered(true);
      setTimeout(() => setJustTriggered(false), 300);
      onToggle();
      setIsHolding(false);
      holdTimerRef.current = null;
    }, durationMs);
  };

  const cancelHold = (e?: React.PointerEvent) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
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
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const size = 46;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "relative flex size-12 items-center justify-center rounded-full select-none transition-all duration-150 shrink-0 cursor-pointer focus:outline-hidden touch-none",
        isHolding
          ? "scale-90 bg-primary/15 ring-2 ring-primary/40 shadow-inner"
          : "hover:bg-accent/80 active:scale-95",
        justTriggered && "scale-110 bg-primary/20 duration-200",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
      title={isVerified ? "Hold to Uncheck" : "Hold to Verify"}
      aria-label={
        ariaLabel || (isVerified ? "Hold to mark pending" : "Hold to verify item")
      }
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
          className={cn(
            isVerified ? "text-emerald-500" : "text-primary",
            isHolding ? "opacity-100" : "opacity-0"
          )}
        />
      </svg>
      <div
        className={cn(
          "flex items-center justify-center transition-transform duration-150",
          justTriggered && "scale-115"
        )}
      >
        {isVerified ? (
          <CheckCircleIcon
            className="size-8 text-primary fill-primary drop-shadow-xs"
            weight="fill"
          />
        ) : (
          <CircleIcon
            className={cn(
              "size-8 transition-colors",
              isHolding
                ? "text-primary fill-primary/20"
                : "text-muted-foreground/60 hover:text-foreground"
            )}
            weight="bold"
          />
        )}
      </div>
    </button>
  );
}
