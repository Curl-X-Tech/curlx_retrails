import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useHoldGesture } from "@/components/shared";

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
  const { isHolding, justTriggered, handlers } = useHoldGesture({
    durationMs,
    disabled,
    onTrigger: onToggle,
    onDisabledAttempt,
  });

  const size = 46;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <button
      type="button"
      disabled={disabled}
      {...handlers}
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
