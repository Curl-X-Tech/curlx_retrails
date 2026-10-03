import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HoldToConfirmButtonProps {
  label: string;
  onConfirmed: () => void;
  durationMs?: number;
  variant?: "default" | "destructive" | "outline";
  disabled?: boolean;
  className?: string;
}

export function HoldToConfirmButton({
  label,
  onConfirmed,
  durationMs = 600,
  variant = "default",
  disabled = false,
  className,
}: HoldToConfirmButtonProps) {
  const [isHolding, setIsHolding] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const startTimeRef = React.useRef<number | null>(null);
  const animFrameRef = React.useRef<number | null>(null);

  const startHold = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }

    setIsHolding(true);
    startTimeRef.current = performance.now();

    const update = (now: number) => {
      if (!startTimeRef.current) return;
      const elapsed = now - startTimeRef.current;
      const pct = Math.min(1, elapsed / durationMs);
      setProgress(pct);

      if (pct >= 1) {
        setIsHolding(false);
        setProgress(0);
        startTimeRef.current = null;
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate(30);
          } catch {
            // Ignore
          }
        }
        onConfirmed();
      } else {
        animFrameRef.current = requestAnimationFrame(update);
      }
    };

    animFrameRef.current = requestAnimationFrame(update);
  };

  const cancelHold = (e?: React.PointerEvent) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    startTimeRef.current = null;
    setIsHolding(false);
    setProgress(0);

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
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "relative inline-block overflow-hidden rounded-md select-none touch-none",
        className
      )}
    >
      <Button
        type="button"
        variant={variant}
        disabled={disabled}
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          "relative z-10 w-full transition-transform",
          isHolding && "scale-[0.98]"
        )}
      >
        {label}
      </Button>
      {isHolding && (
        <div
          className="absolute inset-0 bg-primary/30 pointer-events-none z-20 transition-all duration-75"
          style={{ width: `${progress * 100}%` }}
        />
      )}
    </div>
  );
}
