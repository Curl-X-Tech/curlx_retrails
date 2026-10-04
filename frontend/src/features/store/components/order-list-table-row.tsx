import {
  ArrowCounterClockwiseIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  PrinterIcon,
  SnowflakeIcon,
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
      className="hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={() => onSelectOrder(order)}
    >
      <TableCell
        className="px-3"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(order.id);
        }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(order.id)}
          className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground text-xs">{order.orderRef}</span>
          {order.isUrgent && (
            <Badge
              variant="destructive"
              className="text-[9px] px-1 py-0 h-3.5 font-bold uppercase"
            >
              Urgent
            </Badge>
          )}
          {isCold && (
            <Badge
              variant="secondary"
              className="text-[9px] px-1 py-0 h-3.5 bg-sky-500/10 text-sky-700 dark:text-sky-300 gap-0.5"
            >
              <SnowflakeIcon className="size-2.5" />
              COL
            </Badge>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground block">{order.orderDate}</span>
      </TableCell>
      <TableCell>
        <span className="text-foreground font-medium text-xs block">
          {order.outletName}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {order.district} • {order.depot}
        </span>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground font-medium">
        {order.requiredDate || order.eta || "-"}
      </TableCell>
      <TableCell className="text-right font-medium text-foreground text-xs tabular-nums">
        {order.totalWeightKg.toFixed(1)} kg
      </TableCell>
      <TableCell className="text-right text-muted-foreground text-xs tabular-nums">
        {order.totalVolumeM3.toFixed(2)} m³
      </TableCell>
      <TableCell className="text-right font-semibold text-foreground text-xs tabular-nums">
        LKR {order.totalOrderValueLkr.toLocaleString()}
      </TableCell>
      <TableCell className="text-center">
        <OrderStatusBadge status={order.status} />
      </TableCell>
      <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
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
