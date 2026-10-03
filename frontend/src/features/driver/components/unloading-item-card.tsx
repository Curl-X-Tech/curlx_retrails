import {
  CaretRightIcon,
  SnowflakeIcon,
  MapPinIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { HoldToVerifyButton } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { DriverOrderItem, DriverWaypoint } from "../types";

interface UnloadingItemCardProps {
  item: DriverOrderItem;
  currentWp: DriverWaypoint;
  isVerified: boolean;
  isExpanded: boolean;
  onToggleVerification: () => void;
  onToggleExpand: () => void;
  onOpenFlagModal: () => void;
}

export function UnloadingItemCard({
  item,
  currentWp,
  isVerified,
  isExpanded,
  onToggleVerification,
  onToggleExpand,
  onOpenFlagModal,
}: UnloadingItemCardProps) {
  const orderRef =
    (item as { orderRef?: string }).orderRef || item.order_ref || item.order_id;
  const packageCode =
    (item as { packageCode?: string }).packageCode || item.package_code || item.id;
  const crateCount =
    (item as { crateCount?: number }).crateCount ?? item.crate_count ?? 1;
  const itemTitle =
    (item as { itemTitle?: string }).itemTitle ||
    item.item_title ||
    item.category ||
    "Cargo Item";
  const weightKg = (item as { weightKg?: number }).weightKg ?? item.weight_kg ?? 0;
  const shc =
    (item as { specialHandlingCode?: string | null }).specialHandlingCode ??
    item.special_handling_code;
  const isReefer = (item as { isReefer?: boolean }).isReefer ?? shc === "COL";
  const tempText =
    (item as { temperature?: string }).temperature ||
    (isReefer ? "Cold Chain (-18°C)" : "Ambient");
  const stagingLocation =
    (currentWp as { stagingLocation?: string }).stagingLocation ||
    `Bay #${currentWp.seq}`;

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all bg-card relative",
        isVerified
          ? "border-emerald-500/40 shadow-xs"
          : "border-border/80 hover:border-primary/40"
      )}
    >
      <div
        onClick={onToggleExpand}
        className={cn(
          "p-3.5 flex items-center justify-between gap-3 cursor-pointer bg-card hover:bg-accent/30 transition-colors",
          isExpanded ? "rounded-t-2xl" : "rounded-2xl"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-transform"
            aria-label="Toggle item details"
          >
            <CaretRightIcon
              className={cn(
                "size-4 transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
              weight="bold"
            />
          </button>

          <span className="font-heading font-black text-xs sm:text-sm text-foreground">
            #{orderRef || packageCode}
          </span>

          <span className="font-heading font-bold text-xs sm:text-sm text-[#0070BA]">
            {crateCount} Crates
          </span>

          {isReefer && (
            <div
              className="size-6 rounded-full bg-sky-100 dark:bg-sky-950/80 flex items-center justify-center text-[#0070BA] shrink-0"
              title="Cold Chain Temperature Controlled"
            >
              <SnowflakeIcon className="size-3.5" weight="bold" />
            </div>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()} className="flex items-center shrink-0">
          <HoldToVerifyButton
            isVerified={isVerified}
            onToggle={onToggleVerification}
            durationMs={400}
            className="size-10"
            ariaLabel={
              isVerified
                ? `Hold to uncheck ${orderRef || packageCode}`
                : `Hold to verify ${orderRef || packageCode}`
            }
          />
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-3.5 pt-1 border-t border-border/60 bg-muted/20 space-y-2 text-xs rounded-b-2xl">
          <div className="font-heading font-black text-xs sm:text-sm text-foreground leading-snug">
            {item.category || itemTitle}
          </div>

          <div className="border-t border-border/50 divide-y divide-border/40 pt-1">
            <div className="py-1.5 flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Total Weight</span>
              <strong className="font-heading font-bold text-foreground">
                {weightKg} kg
              </strong>
            </div>

            <div className="py-1.5 flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Handling Type</span>
              <strong className="font-heading font-bold text-foreground">
                {isReefer
                  ? tempText
                  : shc === "FRG"
                    ? "Fragile Intake"
                    : shc === "MAL"
                      ? "Mall Bay"
                      : "Ambient Cargo"}
              </strong>
            </div>

            <div className="py-1.5 flex items-center justify-between">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <MapPinIcon className="size-3.5 text-[#0070BA]" weight="bold" />
                <span>Staging Location</span>
              </span>
              <strong className="font-heading font-bold text-foreground">
                {stagingLocation}
              </strong>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFlagModal();
              }}
              className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer"
            >
              <WarningIcon className="size-3.5" weight="fill" />
              <span>Flag Issue</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
