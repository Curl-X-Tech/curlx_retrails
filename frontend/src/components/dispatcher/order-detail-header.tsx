import {
  StorefrontIcon,
  WarningOctagonIcon,
  SnowflakeIcon,
  SunIcon,
} from "@phosphor-icons/react";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CopyableId } from "@/components/shared";
import type { QueuedOrder } from "@/types";

interface OrderDetailHeaderProps {
  order: QueuedOrder;
}

export function OrderDetailHeader({ order }: OrderDetailHeaderProps) {
  const isChilled = order.tempRequirement === "chilled";

  return (
    <SheetHeader className="p-5 border-b border-border/80 bg-muted/20 shrink-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SheetTitle className="font-heading font-black text-xl text-foreground tracking-tight">
            Order #{order.orderRef}
          </SheetTitle>
          <CopyableId id={order.outletId} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {order.deferredYesterday === 1 && (
            <span className="text-[var(--status-skip)] text-xs font-bold flex items-center gap-1">
              <WarningOctagonIcon className="size-3.5" weight="bold" />
              Deferred Yesterday
            </span>
          )}

          {order.isUrgent && (
            <span className="text-[var(--status-urgent)] text-xs font-bold">
              [URGENT]
            </span>
          )}

          <div className="flex items-center gap-1 text-xs font-semibold">
            {isChilled ? (
              <>
                <SnowflakeIcon
                  className="size-3.5 text-[var(--status-chilled)]"
                  weight="bold"
                />
                <span className="text-[var(--status-chilled)]">Chilled</span>
              </>
            ) : (
              <>
                <SunIcon
                  className="size-3.5 text-[var(--status-ambient)]"
                  weight="bold"
                />
                <span className="text-[var(--status-ambient)]">Ambient</span>
              </>
            )}
          </div>

          <span className="text-xs font-bold text-primary">Waypoint {order.brand}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <StorefrontIcon className="size-4 text-primary shrink-0" />
        <span className="font-semibold text-foreground">{order.outletName}</span>
        <span>•</span>
        <span className="truncate">{order.outletAddress}</span>
      </div>
    </SheetHeader>
  );
}
