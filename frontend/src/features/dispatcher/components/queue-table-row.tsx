import {
  WarningOctagonIcon,
  SnowflakeIcon,
  SunIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react";
import { TableRow, TableCell } from "@/components/ui/table";
import { IconButton } from "@/components/ui/icon-button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CopyableId } from "@/components/shared";
import type { QueuedOrder } from "../types";

interface QueueTableRowProps {
  order: QueuedOrder;
  showDestination?: boolean;
  onSelect: (order: QueuedOrder) => void;
}

export function QueueTableRow({
  order,
  showDestination = true,
  onSelect,
}: QueueTableRowProps) {
  const isChilled = order.tempRequirement === "chilled";

  return (
    <TableRow
      onClick={() => onSelect(order)}
      className={`border-border/30 hover:bg-muted/30 cursor-pointer text-xs ${
        order.deferredYesterday === 1 ? "bg-[var(--status-skip-bg)]/20" : ""
      }`}
    >
      <TableCell className="font-bold text-foreground py-2 px-4 whitespace-nowrap relative">
        {order.deferredYesterday === 1 ? (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[var(--status-skip)] rounded-r" />
        ) : order.isUrgent ? (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[var(--status-urgent)] rounded-r" />
        ) : null}
        <Tooltip>
          <TooltipTrigger
            render={
              <div className="flex items-center gap-2 pl-1 cursor-help group/ref">
                <span
                  className={`size-1.5 rounded-full shrink-0 ${
                    order.deferredYesterday === 1
                      ? "bg-[var(--status-skip)]"
                      : order.isUrgent
                        ? "bg-[var(--status-urgent)]"
                        : "bg-primary"
                  }`}
                />
                <span className="group-hover/ref:text-primary transition-colors">
                  #{order.orderRef}
                </span>
              </div>
            }
          />
          <TooltipContent className="flex items-center gap-1.5 p-1.5">
            <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              Waypoint {order.brand}
            </span>
            {order.deferredYesterday === 1 && (
              <span className="text-[var(--status-skip)] bg-[var(--status-skip-bg)] text-[11px] font-bold px-1.5 py-0.5 rounded border border-[var(--status-skip-border)] flex items-center gap-0.5">
                <WarningOctagonIcon className="size-2.5" weight="bold" />
                Yesterday Skip
              </span>
            )}
            {order.isUrgent && (
              <span className="text-[var(--status-urgent)] bg-[var(--status-urgent-bg)] text-[11px] font-bold px-1.5 py-0.5 rounded border border-[var(--status-urgent-border)]">
                Urgent
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      </TableCell>

      {showDestination && (
        <TableCell className="py-2 px-4 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">{order.outletName}</span>
            <CopyableId id={order.outletId} />
          </div>
        </TableCell>
      )}

      <TableCell className="py-2 px-4 whitespace-nowrap">
        <Tooltip>
          <TooltipTrigger
            render={
              <div className="flex items-center gap-1 text-xs font-semibold cursor-help">
                {isChilled ? (
                  <>
                    <SnowflakeIcon
                      className="size-3 text-[var(--status-chilled)] shrink-0"
                      weight="bold"
                    />
                    <span className="text-[var(--status-chilled)] text-[11px]">
                      Chilled
                    </span>
                  </>
                ) : (
                  <>
                    <SunIcon
                      className="size-3 text-[var(--status-ambient)] shrink-0"
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
              {isChilled ? "Reefer vehicle (0°C to 4°C)" : "Ambient compartment"}
            </span>
          </TooltipContent>
        </Tooltip>
      </TableCell>

      <TableCell className="text-center font-bold text-foreground py-2 px-3 whitespace-nowrap tabular-nums">
        {order.totalPackages ??
          order.totalItems ??
          (order.items.length > 0
            ? order.items.reduce((s, i) => s + i.requestedQty, 0)
            : 3)}{" "}
        pkgs
      </TableCell>
      <TableCell className="text-right font-medium text-foreground py-2 px-4 whitespace-nowrap tabular-nums">
        {order.totalWeightKg.toLocaleString()} kg
      </TableCell>
      <TableCell className="text-right font-medium text-foreground py-2 px-4 whitespace-nowrap tabular-nums">
        {order.totalVolumeM3.toFixed(2)} m³
      </TableCell>
      <TableCell className="text-right font-bold text-foreground py-2 px-4 whitespace-nowrap tabular-nums">
        LKR {order.totalOrderValueLkr.toLocaleString()}
      </TableCell>
      <TableCell className="text-xs font-medium text-foreground py-2 px-4 whitespace-nowrap tabular-nums">
        {order.deliveryWindow}
      </TableCell>
      <TableCell className="text-right py-2 px-4 whitespace-nowrap">
        <IconButton
          variant="ghost"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(order);
          }}
          className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
          title="Inspect Order Details"
        >
          <ArrowSquareOutIcon className="size-3.5" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
