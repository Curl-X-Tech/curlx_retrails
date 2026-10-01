import * as React from "react";
import { CheckIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface HoldToToggleCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  holdDurationMs?: number;
  className?: string;
  ariaLabel?: string;
}

export function HoldToToggleCheckbox({
  checked,
  onToggle,
  holdDurationMs = 500,
  className,
  ariaLabel,
}: HoldToToggleCheckboxProps) {
  const [progress, setProgress] = React.useState(0);
  const [isHolding, setIsHolding] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);
  const startTimeRef = React.useRef<number | null>(null);
  const animFrameRef = React.useRef<number | null>(null);
  const hintTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const startHolding = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setIsHolding(true);
    startTimeRef.current = performance.now();

    const updateProgress = (now: number) => {
      if (!startTimeRef.current) return;
      const elapsed = now - startTimeRef.current;
      const pct = Math.min(1, elapsed / holdDurationMs);
      setProgress(pct);

      if (pct >= 1) {
        setIsHolding(false);
        setProgress(0);
        startTimeRef.current = null;
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate(40);
          } catch {
            // ignore
          }
        }
        onToggle();
      } else {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const cancelHolding = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    if (isHolding && progress < 0.95) {
      setShowHint(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => setShowHint(false), 1400);
    }
    setIsHolding(false);
    setProgress(0);
    startTimeRef.current = null;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  React.useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  const size = 32;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0">
      {/* Quick Tap Hint Tooltip */}
      {showHint && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 whitespace-nowrap bg-foreground text-background text-[11px] font-heading font-black px-2.5 py-1 rounded-lg shadow-xl animate-in fade-in slide-in-from-right-2 zoom-in-95 pointer-events-none z-30 flex items-center gap-1 border border-border/40">
          <span>{checked ? "Hold to uncheck" : "Hold to check"}</span>
        </div>
      )}

      {/* Interactive Hold Button Container */}
      <div
        role="checkbox"
        aria-checked={checked}
        aria-label={
          ariaLabel || (checked ? "Hold to uncheck item" : "Hold to check item")
        }
        tabIndex={0}
        onPointerDown={startHolding}
        onPointerUp={cancelHolding}
        onPointerLeave={cancelHolding}
        onPointerCancel={cancelHolding}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          "relative size-8 rounded-xl flex items-center justify-center cursor-pointer select-none transition-transform touch-none",
          isHolding && "scale-105",
          className
        )}
      >
        {/* Progress SVG Ring around checkbox */}
        <svg
          className="absolute inset-0 pointer-events-none -rotate-90"
          width={size}
          height={size}
        >
          {/* Background track while holding */}
          {isHolding && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-primary/20"
            />
          )}
          {/* Animated fill progress */}
          {isHolding && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-75",
                checked ? "text-amber-500" : "text-[#0070BA]"
              )}
            />
          )}
        </svg>

        {/* Inner Checkbox Center */}
        <div
          className={cn(
            "size-7 rounded-xl flex items-center justify-center transition-all pointer-events-none",
            checked
              ? "bg-[#0070BA] text-white shadow-xs"
              : "border-2 border-[#0070BA]/50 bg-background hover:border-[#0070BA]"
          )}
        >
          {checked && <CheckIcon className="size-4" weight="bold" />}
        </div>
      </div>
    </div>
  );
}
