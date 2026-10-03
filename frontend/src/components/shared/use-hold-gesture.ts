import * as React from "react";

export interface HoldGestureOptions {
  durationMs?: number;
  disabled?: boolean;
  onTrigger: () => void;
  onDisabledAttempt?: () => void;
}

export function useHoldGesture({
  durationMs = 500,
  disabled = false,
  onTrigger,
  onDisabledAttempt,
}: HoldGestureOptions) {
  const [isHolding, setIsHolding] = React.useState(false);
  const [justTriggered, setJustTriggered] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(35);
        } catch {
          // Ignore
        }
      }
      setJustTriggered(true);
      setTimeout(() => setJustTriggered(false), 300);
      onTrigger();
      setIsHolding(false);
      timerRef.current = null;
    }, durationMs);
  };

  const cancelHold = (e?: React.PointerEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
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
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    isHolding,
    justTriggered,
    handlers: {
      onPointerDown: startHold,
      onPointerUp: cancelHold,
      onPointerLeave: cancelHold,
      onPointerCancel: cancelHold,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
  };
}
