import { SnowflakeIcon, WarningCircleIcon, FlagIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { HoldToVerifyButton } from "./hold-to-verify-button";
import { getHandlingLabel } from "../utils";
import type { LoaderOrderItem } from "../types";
import { cn } from "@/lib/utils";

interface BayChecklistItemProps {
  item: LoaderOrderItem;
  stopSeq: number;
  isLocked: boolean;
  onLockedAttempt: (seq: number) => void;
  onToggleStatus: (stopSeq: number, itemId: string) => void;
  onReport: (stopSeq: number, item: LoaderOrderItem) => void;
}

export function BayChecklistItem({
  item,
  stopSeq,
  isLocked,
  onLockedAttempt,
  onToggleStatus,
  onReport,
}: BayChecklistItemProps) {
  const isVerified = item.status === "verified";
  const isFlagged = item.status === "flagged";
  const handlingText = getHandlingLabel(item.specialHandlingCode);

  return (
    <div
      onClick={() => {
        if (isLocked) onLockedAttempt(stopSeq);
      }}
      className={cn(
        "flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all duration-200 select-none gap-3",
        isVerified
          ? "border-emerald-500/40 bg-card/85 shadow-2xs"
          : isFlagged
            ? "border-amber-500/40 bg-amber-500/5 shadow-xs"
            : "border-border/80 bg-card hover:border-foreground/20 shadow-xs",
        isLocked && "cursor-pointer"
      )}
    >
      <div className="flex flex-col min-w-0 flex-1 gap-1">
        {/* Primary Row: Box / Package Code + Crate Count + Staging Bay */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span
            className={cn(
              "font-heading font-black text-sm sm:text-base text-foreground tracking-tight break-words",
              isVerified &&
                "text-muted-foreground line-through decoration-muted-foreground/50"
            )}
          >
            {item.packageCode}
          </span>
          <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded text-xs">
            {item.crateCount} Crates
          </span>
          <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
            Bay: {item.stagingBay}
          </span>
          {item.weightKg > 0 && (
            <span className="text-xs text-muted-foreground font-medium">
              ({item.weightKg} kg)
            </span>
          )}
        </div>

        {/* Secondary Row: Product Name (smaller) + Temperature / Handling */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <span
            className={cn(
              "text-xs text-muted-foreground truncate max-w-[220px] sm:max-w-none",
              isVerified && "line-through opacity-70"
            )}
          >
            {item.itemTitle}
          </span>
          {item.isReefer && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold text-[11px]">
                <SnowflakeIcon className="size-3 text-sky-500" weight="bold" />
                <span>{item.temperature}</span>
              </span>
            </>
          )}
          {handlingText && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                <WarningCircleIcon className="size-3" weight="bold" />
                <span>{handlingText}</span>
              </span>
            </>
          )}
        </div>

        {isFlagged && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold pt-0.5">
            <WarningCircleIcon className="size-3.5 shrink-0" weight="bold" />
            <span className="break-words">Issue: {item.notes}</span>
          </div>
        )}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 sm:gap-2.5 shrink-0"
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={isLocked}
          onClick={() => onReport(stopSeq, item)}
          className={cn(
            "h-8 px-2 rounded-lg text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border cursor-pointer",
            isFlagged &&
              "text-amber-600 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
          )}
          title="Report discrepancy or shortage"
        >
          <FlagIcon className="size-3.5" weight={isFlagged ? "fill" : "bold"} />
          <span className="hidden sm:inline">{isFlagged ? "Flagged" : "Report"}</span>
        </Button>

        <div className="flex flex-col items-center justify-center shrink-0">
          <HoldToVerifyButton
            isVerified={isVerified}
            disabled={isLocked}
            onDisabledAttempt={() => onLockedAttempt(stopSeq)}
            onToggle={() => onToggleStatus(stopSeq, item.id)}
          />
        </div>
      </div>
    </div>
  );
}
