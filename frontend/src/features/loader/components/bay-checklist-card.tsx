import { CheckCircleIcon, CaretDownIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { HoldToUnlockButton } from "./hold-to-unlock-button";
import { BayChecklistItem } from "./bay-checklist-item";
import type { LoaderWaypoint, LoaderOrderItem } from "../types";
import { cn } from "@/lib/utils";

interface BayChecklistCardProps {
  waypoint: LoaderWaypoint;
  isExpanded: boolean;
  isLocked: boolean;
  isShaking: boolean;
  disabled?: boolean;
  onToggleExpand: (seq: number) => void;
  onUnlock: (seq: number) => void;
  onLockedAttempt: (seq: number) => void;
  onToggleItemStatus: (stopSeq: number, itemId: string) => void;
  onReportItem: (stopSeq: number, item: LoaderOrderItem) => void;
}

export function BayChecklistCard({
  waypoint,
  isExpanded,
  isLocked,
  isShaking,
  disabled = false,
  onToggleExpand,
  onUnlock,
  onLockedAttempt,
  onToggleItemStatus,
  onReportItem,
}: BayChecklistCardProps) {
  const totalItems = waypoint.items.length;
  const verifiedItems = waypoint.items.filter((i) => i.status === "verified").length;
  const isAllLoaded = totalItems > 0 && verifiedItems === totalItems;
  const totalCrates = waypoint.items.reduce((acc, i) => acc + i.crateCount, 0);
  const totalWeightKg = waypoint.items.reduce((acc, i) => acc + i.weightKg, 0);

  return (
    <Card
      className={cn(
        "flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs",
        isLocked
          ? "border-emerald-500/40 bg-card shadow-emerald-500/5 ring-1 ring-emerald-500/15"
          : "border-border/80 bg-card"
      )}
    >
      <div
        onClick={() => onToggleExpand(waypoint.seq)}
        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 cursor-pointer hover:bg-accent/40 transition-colors select-none gap-2.5 sm:gap-3"
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "flex flex-col min-w-11 px-2.5 h-10 sm:h-11 shrink-0 items-center justify-center rounded-xl font-heading font-black transition-colors mt-0.5 sm:mt-0 leading-none",
              isLocked
                ? "bg-emerald-500 text-white"
                : "bg-primary text-primary-foreground"
            )}
            title={`Drop #${waypoint.seq}`}
          >
            <span className="text-[9px] uppercase font-bold tracking-tighter opacity-80">
              Drop
            </span>
            <span className="text-sm sm:text-base font-black">#{waypoint.seq}</span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-heading font-bold text-sm sm:text-base text-foreground break-words leading-tight">
                {waypoint.outletName}
              </span>
              <span className="text-xs text-muted-foreground font-semibold shrink-0">
                ({waypoint.outletCode})
              </span>
              {waypoint.seq === 1 && (
                <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300">
                  Door Drop
                </span>
              )}
              {isLocked && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <CheckCircleIcon className="size-3" weight="fill" />
                  Loaded
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
              <span className="font-semibold text-foreground/90">
                {totalCrates} Crates ({totalWeightKg} kg)
              </span>
              <span>·</span>
              <span>{totalItems} Items</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
          <div className="flex items-center gap-2">
            {disabled ? (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30">
                <CheckCircleIcon className="size-4" weight="fill" />
                <span>Loaded & Sealed</span>
              </div>
            ) : isLocked ? (
              <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                <HoldToUnlockButton
                  isShaking={isShaking}
                  onUnlock={() => onUnlock(waypoint.seq)}
                />
              </div>
            ) : isAllLoaded ? (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30">
                <CheckCircleIcon className="size-4" weight="fill" />
                <span>Loaded</span>
              </div>
            ) : (
              <span className="text-xs font-bold text-muted-foreground bg-muted/80 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg">
                {verifiedItems}/{totalItems} Checked
              </span>
            )}
          </div>

          <div className="flex items-center text-muted-foreground">
            {isExpanded ? (
              <CaretDownIcon className="size-4" />
            ) : (
              <CaretRightIcon className="size-4" />
            )}
          </div>
        </div>
      </div>

      <div className="h-1 w-full bg-muted/40 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            isLocked ? "bg-emerald-500" : "bg-primary"
          )}
          style={{
            width: totalItems > 0 ? `${(verifiedItems / totalItems) * 100}%` : "0%",
          }}
        />
      </div>

      {isExpanded && (
        <div className="flex flex-col border-t border-border/70 p-2.5 sm:p-3.5 gap-2.5 bg-muted/15">
          {waypoint.items.map((item) => (
            <BayChecklistItem
              key={item.id}
              item={item}
              stopSeq={waypoint.seq}
              isLocked={isLocked}
              onLockedAttempt={onLockedAttempt}
              onToggleStatus={onToggleItemStatus}
              onReport={onReportItem}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
