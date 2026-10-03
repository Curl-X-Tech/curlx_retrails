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
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/40 transition-colors select-none gap-3"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl font-heading font-black text-sm transition-colors",
              isLocked ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground"
            )}
          >
            {waypoint.seq}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm sm:text-base text-foreground truncate">
                {waypoint.outletName}
              </span>
              <span className="text-xs text-muted-foreground font-semibold shrink-0">
                ({waypoint.outletCode})
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="font-semibold text-foreground/90">
                {totalCrates} Crates ({totalWeightKg} kg)
              </span>
              <span>·</span>
              <span>{totalItems} Line Items</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isLocked ? (
            <div onClick={(e) => e.stopPropagation()} className="flex items-center">
              <HoldToUnlockButton isShaking={isShaking} onUnlock={() => onUnlock(waypoint.seq)} />
            </div>
          ) : isAllLoaded ? (
            <CheckCircleIcon className="size-7 text-primary fill-primary drop-shadow-xs" weight="fill" />
          ) : (
            <span className="text-xs font-bold text-muted-foreground bg-muted/80 px-2.5 py-1 rounded-lg">
              {verifiedItems}/{totalItems} Checked
            </span>
          )}
          {isExpanded ? (
            <CaretDownIcon className="size-4 text-muted-foreground" />
          ) : (
            <CaretRightIcon className="size-4 text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="h-1 w-full bg-muted/40 overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300", isLocked ? "bg-emerald-500" : "bg-primary")}
          style={{ width: totalItems > 0 ? `${(verifiedItems / totalItems) * 100}%` : "0%" }}
        />
      </div>

      {isExpanded && (
        <div className="flex flex-col border-t border-border/70 p-3 sm:p-3.5 gap-2.5 bg-muted/15">
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
