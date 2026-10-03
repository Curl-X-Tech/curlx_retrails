import {
  SnowflakeIcon,
  WarningCircleIcon,
  FlagIcon,
  ClockIcon,
} from "@phosphor-icons/react";
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
        "flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all duration-200 select-none gap-3.5",
        isVerified
          ? "border-emerald-500/30 bg-card/75 opacity-90 shadow-2xs"
          : isFlagged
            ? "border-amber-500/40 bg-amber-500/5 shadow-xs"
            : "border-border/80 bg-card hover:border-foreground/20 shadow-xs",
        isLocked && "cursor-pointer"
      )}
    >
      <div className="flex flex-col min-w-0 flex-1 gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "font-heading font-bold text-sm sm:text-base text-foreground leading-snug truncate",
              isVerified &&
                "text-muted-foreground line-through decoration-muted-foreground/50"
            )}
          >
            {item.itemTitle}
          </span>
          {isVerified && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <ClockIcon className="size-3" weight="bold" />
              Queued for Sync
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border/70">
            {item.packageCode}
          </span>
          <span className="font-medium">#{item.orderRef}</span>
          <span>·</span>
          <span>{item.category}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
          <span className="font-bold text-foreground bg-accent/80 px-2 py-0.5 rounded border border-border">
            {item.stagingBay}
          </span>
          <span>·</span>
          <span className="font-bold text-foreground text-sm font-sans">
            {item.crateCount} Crates
          </span>
          <span>·</span>
          <span className="font-medium text-foreground/80">{item.weightKg} kg</span>
          <span>·</span>
          <span className="font-medium">{item.volumeM3.toFixed(2)} m³</span>
          {item.isReefer && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold">
                <SnowflakeIcon className="size-3 text-sky-500" weight="bold" />
                {item.temperature}
              </span>
            </>
          )}
          {handlingText && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-foreground/80 font-medium">
                <WarningCircleIcon className="size-3 text-amber-500" weight="bold" />
                {handlingText}
              </span>
            </>
          )}
        </div>

        {isFlagged && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold pt-0.5">
            <WarningCircleIcon className="size-3.5" weight="bold" />
            <span>Issue Reported: {item.notes}</span>
          </div>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()} className="flex items-center shrink-0">
        <Button
          variant="ghost"
          size="sm"
          disabled={isLocked}
          onClick={() => onReport(stopSeq, item)}
          className={cn(
            "h-8 px-2.5 rounded-lg text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border cursor-pointer",
            isFlagged &&
              "text-amber-600 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
          )}
          title="Report discrepancy or shortage for this item"
        >
          <FlagIcon className="size-3.5" weight={isFlagged ? "fill" : "bold"} />
          <span className="hidden sm:inline">Report</span>
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center shrink-0 pl-1">
        <HoldToVerifyButton
          isVerified={isVerified}
          disabled={isLocked}
          onDisabledAttempt={() => onLockedAttempt(stopSeq)}
          onToggle={() => onToggleStatus(stopSeq, item.id)}
        />
        {isVerified && (
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            Verified
          </span>
        )}
      </div>
    </div>
  );
}
