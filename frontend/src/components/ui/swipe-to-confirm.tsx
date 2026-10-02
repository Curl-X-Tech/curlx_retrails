import * as React from "react";
import { CaretRightIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface SwipeToConfirmProps {
  onConfirm: () => void;
  label?: string;
  confirmedLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function SwipeToConfirm({
  onConfirm,
  label = "Slide to Confirm Loading",
  confirmedLabel = "Loading Confirmed",
  className,
  disabled = false,
}: SwipeToConfirmProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isConfirmed, setIsConfirmed] = React.useState(false);
  const touchStartXRef = React.useRef(0);

  const handleDragStart = (clientX: number) => {
    if (disabled || isConfirmed) return;
    setIsDragging(true);
    touchStartXRef.current = clientX;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging || disabled || isConfirmed || !containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const handleWidth = 56;
    const maxDrag = containerWidth - handleWidth - 8;

    const deltaX = clientX - touchStartXRef.current;
    const clampedX = Math.max(0, Math.min(deltaX, maxDrag));
    setDragX(clampedX);

    // Confirm threshold (80%)
    if (clampedX >= maxDrag * 0.85) {
      setIsConfirmed(true);
      setIsDragging(false);
      setDragX(maxDrag);
      onConfirm();
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || isConfirmed) return;
    setIsDragging(false);
    // Animate back to origin if not confirmed
    setDragX(0);
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX);
  const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
  const handleMouseUp = () => handleDragEnd();

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX);
  const handleTouchEnd = () => handleDragEnd();

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "relative flex items-center h-14 w-full select-none rounded-2xl border border-border/80 bg-muted/60 p-1 overflow-hidden transition-colors shadow-inner",
        isConfirmed && "bg-primary/10 border-primary/40",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {/* Dynamic Colored Track Fill */}
      <div
        className={cn(
          "absolute inset-y-1 left-1 rounded-xl bg-primary/20 transition-all",
          isDragging ? "duration-0" : "duration-200",
          isConfirmed && "inset-1 bg-primary/15"
        )}
        style={{ width: isConfirmed ? "calc(100% - 8px)" : `${dragX + 56}px` }}
      />

      {/* Centered Track Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-14">
        <span
          className={cn(
            "text-xs sm:text-sm font-heading font-bold tracking-tight transition-opacity duration-150",
            isConfirmed ? "text-primary" : "text-muted-foreground"
          )}
        >
          {isConfirmed ? confirmedLabel : label}
        </span>
      </div>

      {/* Swipable Handle Thumb */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging
            ? "none"
            : "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className={cn(
          "relative z-20 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md cursor-grab active:cursor-grabbing hover:bg-primary/90 transition-colors shrink-0",
          isConfirmed && "bg-primary cursor-default"
        )}
      >
        {isConfirmed ? (
          <CheckCircleIcon className="size-7.5 animate-scale-in" weight="fill" />
        ) : (
          <CaretRightIcon className="size-6 animate-pulse" weight="bold" />
        )}
      </div>
    </div>
  );
}

export default SwipeToConfirm;
