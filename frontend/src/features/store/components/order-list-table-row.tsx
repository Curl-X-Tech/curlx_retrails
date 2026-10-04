import {
  ArrowCounterClockwiseIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  PrinterIcon,
  SnowflakeIcon,
  SunIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderStatusBadge } from "./order-status-badge";
import type { StoreOrderRecord } from "../types";

interface OrderListTableRowProps {
  order: StoreOrderRecord;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onSelectOrder: (order: StoreOrderRecord) => void;
  onReorder?: (order: StoreOrderRecord) => void;
  onCancelOrder?: (order: StoreOrderRecord) => void;
}

export function OrderListTableRow({
  order,
  isSelected,
  onToggleSelect,
  onSelectOrder,
  onReorder,
  onCancelOrder,
}: OrderListTableRowProps) {
  const isCold = order.tempRequirement === "chilled";
  const isPending = order.status === "pending";

  return (
    <TableRow
      className={`hover:bg-muted/30 transition-colors cursor-pointer group text-xs relative ${
        order.isUrgent ? "bg-amber-500/5" : ""
      }`}
      onClick={() => onSelectOrder(order)}
    >
      <TableCell
        className="px-3 relative"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(order.id);
        }}
      >
        {order.isUrgent ? (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r" />
        ) : null}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(order.id)}
          className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
        />
      </TableCell>
      <TableCell className="py-2.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`size-1.5 rounded-full shrink-0 ${
              order.isUrgent
                ? "bg-amber-500"
                : isPending
                  ? "bg-sky-500"
                  : "bg-emerald-500"
            }`}
          />
          <span className="font-bold text-foreground text-xs group-hover:text-primary transition-colors">
            #{order.orderRef}
          </span>
          {order.isUrgent && (
            <Badge
              variant="destructive"
              className="text-[9px] px-1 py-0 h-3.5 font-bold uppercase"
            >
              Urgent
            </Badge>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground block pl-3">
          {order.orderDate}
        </span>
      </TableCell>
      <TableCell className="py-2.5">
        <span className="text-foreground font-semibold text-xs block">
          {order.outletName}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {order.district} • {order.depot}
        </span>
      </TableCell>
      <TableCell className="py-2.5">
        <div className="flex items-center gap-1 text-xs font-semibold">
          {isCold ? (
            <>
              <SnowflakeIcon className="size-3 text-cyan-600 shrink-0" weight="bold" />
              <span className="text-cyan-700 dark:text-cyan-300 text-[11px]">
                Chilled
              </span>
            </>
          ) : (
            <>
              <SunIcon className="size-3 text-amber-600 shrink-0" weight="bold" />
              <span className="text-amber-700 dark:text-amber-300 text-[11px]">
                Ambient
              </span>
            </>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center py-2.5 font-mono text-xs text-foreground">
        {order.totalUnits || order.totalItems || "-"}
      </TableCell>
      <TableCell className="text-right font-medium text-foreground text-xs tabular-nums py-2.5">
        {order.totalWeightKg.toFixed(1)} kg
      </TableCell>
      <TableCell className="text-right text-muted-foreground text-xs tabular-nums py-2.5">
        {order.totalVolumeM3.toFixed(2)} m³
      </TableCell>
      <TableCell className="text-right font-bold text-foreground text-xs tabular-nums py-2.5">
        LKR {order.totalOrderValueLkr.toLocaleString()}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground font-medium py-2.5">
        {order.requiredDate || order.eta || "-"}
      </TableCell>
      <TableCell className="text-center py-2.5">
        <OrderStatusBadge status={order.status} />
      </TableCell>
      <TableCell className="text-right pr-4 py-2.5" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              />
            }
          >
            <DotsThreeVerticalIcon className="size-4" weight="bold" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-xs shadow-lg rounded-xl">
            <DropdownMenuItem
              onClick={() => onSelectOrder(order)}
              className="gap-2 cursor-pointer"
            >
              <EyeIcon className="size-4 text-muted-foreground" />
              View Details
            </DropdownMenuItem>
            {onReorder && (
              <DropdownMenuItem
                onClick={() => onReorder(order)}
                className="gap-2 cursor-pointer"
              >
                <ArrowCounterClockwiseIcon className="size-4 text-primary" />
                Reorder Items
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => window.print()}
              className="gap-2 cursor-pointer"
            >
              <PrinterIcon className="size-4 text-muted-foreground" />
              Print Invoice
            </DropdownMenuItem>
            {isPending && onCancelOrder && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onCancelOrder(order)}
                  className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <TrashIcon className="size-4" />
                  Cancel Order
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
