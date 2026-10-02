import {
  StorefrontIcon,
  ClockIcon,
  SnowflakeIcon,
  SunIcon,
  ArrowSquareOutIcon,
  ScalesIcon,
  CubeIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { QueuedOrder } from "@/types";

interface OrderCardProps {
  order: QueuedOrder;
  onSelect?: (order: QueuedOrder) => void;
  className?: string;
}

export function OrderCard({ order, onSelect, className }: OrderCardProps) {
  const isChilled = order.tempRequirement === "chilled";

  return (
    <Card
      onClick={() => onSelect?.(order)}
      className={`bg-card border border-border/80 shadow-xs rounded-2xl p-4 flex flex-col justify-between select-none hover:border-border hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden min-w-0 group ${
        order.deferredYesterday === 1
          ? "border-l-4 border-l-[var(--status-skip)] bg-[var(--status-skip-bg)]/20"
          : order.isUrgent
            ? "border-l-4 border-l-[var(--status-urgent)]"
            : ""
      } ${className || ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-black text-base text-foreground tracking-tight group-hover:text-primary transition-colors">
              #{order.orderRef}
            </span>

            <span className="text-[11px] font-bold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
              {order.outletId}
            </span>

            <span className="text-[11px] font-bold text-primary">
              Waypoint {order.brand}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-1.5 truncate">
            <StorefrontIcon className="size-3.5 text-primary shrink-0" />
            <span className="truncate">{order.outletName}</span>
          </div>
        </div>

        <IconButton
          variant="ghost"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(order);
          }}
          className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer shrink-0"
          title="Inspect order details"
        >
          <ArrowSquareOutIcon className="size-4" />
        </IconButton>
      </div>

      <div className="my-3 py-2.5 px-3 bg-muted/30 border border-border/50 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
            <span>Weight</span>
          </div>
          <span className="font-bold text-foreground">
            {order.totalWeightKg.toLocaleString()} kg
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
            <span>Volume</span>
          </div>
          <span className="font-bold text-foreground">
            {order.totalVolumeM3.toFixed(2)} m³
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/40">
          <span className="text-[11px] text-muted-foreground">Order Valuation</span>
          <span className="font-bold text-foreground">
            LKR {order.totalOrderValueLkr.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium truncate">
          <ClockIcon className="size-3.5 text-primary shrink-0" />
          <span className="truncate">{order.deliveryWindow}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger
              render={
                <div className="flex items-center gap-1 text-xs font-semibold cursor-help">
                  {isChilled ? (
                    <>
                      <SnowflakeIcon
                        className="size-3 text-[var(--status-chilled)]"
                        weight="bold"
                      />
                      <span className="text-[var(--status-chilled)] text-[11px]">
                        Chilled
                      </span>
                    </>
                  ) : (
                    <>
                      <SunIcon
                        className="size-3 text-[var(--status-ambient)]"
                        weight="bold"
                      />
                      <span className="text-[var(--status-ambient)] text-[11px]">
                        Ambient
                      </span>
                    </>
                  )}
                </div>
              }
            />
            <TooltipContent>
              <span>
                {isChilled
                  ? "Reefer vehicle required (0°C to 4°C)"
                  : "Ambient dry freight compartment"}
              </span>
            </TooltipContent>
          </Tooltip>

          {(order.deferredYesterday === 1 || order.isUrgent) && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span
                    className={`size-2 rounded-full cursor-help ${
                      order.deferredYesterday === 1
                        ? "bg-[var(--status-skip)]"
                        : "bg-[var(--status-urgent)]"
                    }`}
                  />
                }
              />
              <TooltipContent>
                <span>
                  {order.deferredYesterday === 1
                    ? "Yesterday Skip — Priority dispatch escalation"
                    : "Urgent — High priority SLA delivery window"}
                </span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </Card>
  );
}
