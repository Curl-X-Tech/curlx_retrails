import { CaretLeftIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { DriverWaypoint } from "../types";

interface UnloadingHeaderProps {
  currentWp: DriverWaypoint;
  onBack: () => void;
  onOpenFlagModal: () => void;
}

export function UnloadingHeader({
  currentWp,
  onBack,
  onOpenFlagModal,
}: UnloadingHeaderProps) {
  return (
    <div className="shrink-0 px-4 pt-3 pb-2 flex items-center justify-between gap-3 border-b border-border/70 bg-background/95 backdrop-blur-md">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onBack}
          className="size-9 rounded-xl flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer shrink-0"
          aria-label="Back to Map"
        >
          <CaretLeftIcon className="size-5" weight="bold" />
        </button>

        <div className="size-9 rounded-xl bg-[#0070BA] text-white flex items-center justify-center font-heading font-black text-sm shrink-0 shadow-xs">
          {currentWp.seq}
        </div>

        <div className="flex flex-col min-w-0">
          <h2 className="font-heading font-black text-sm sm:text-base text-foreground truncate leading-tight">
            {currentWp.outletName}
          </h2>
          <span className="text-[11px] font-semibold text-muted-foreground truncate">
            {currentWp.address}
          </span>
        </div>
      </div>

      <Button
        variant="destructive"
        size="icon"
        onClick={onOpenFlagModal}
        className="size-10 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md cursor-pointer shrink-0"
        aria-label="Flag Stop Discrepancy"
      >
        <WarningIcon className="size-5" weight="fill" />
      </Button>
    </div>
  );
}
