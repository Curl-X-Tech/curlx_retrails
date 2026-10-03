import {
  PlusIcon,
  MinusIcon,
  CrosshairIcon,
} from "@phosphor-icons/react";

interface ActiveTripControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
}

export function ActiveTripControls({
  onZoomIn,
  onZoomOut,
  onRecenter,
}: ActiveTripControlsProps) {
  return (
    <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5 shadow-md">
      <button
        onClick={onZoomIn}
        className="size-9 bg-background/95 backdrop-blur-md rounded-xl border border-border/80 flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer shadow-xs"
        aria-label="Zoom In"
      >
        <PlusIcon className="size-4" weight="bold" />
      </button>
      <button
        onClick={onZoomOut}
        className="size-9 bg-background/95 backdrop-blur-md rounded-xl border border-border/80 flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer shadow-xs"
        aria-label="Zoom Out"
      >
        <MinusIcon className="size-4" weight="bold" />
      </button>
      <button
        onClick={onRecenter}
        className="size-9 bg-background/95 backdrop-blur-md rounded-xl border border-border/80 flex items-center justify-center text-primary hover:bg-muted active:scale-95 transition-all cursor-pointer shadow-xs mt-1"
        aria-label="Re-center GPS"
      >
        <CrosshairIcon className="size-4.5" weight="bold" />
      </button>
    </div>
  );
}
