import {
  ArrowCounterClockwiseIcon,
  SnowflakeIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/shared/table-pagination";
import { OrderStatusBadge } from "./order-status-badge";
import type { StoreOrderRecord } from "../types";

interface OrderListCardsProps {
  orders: StoreOrderRecord[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectOrder: (order: StoreOrderRecord) => void;
  onReorder?: (order: StoreOrderRecord) => void;
  onCancelOrder?: (order: StoreOrderRecord) => void;
}

export function OrderListCards({
  orders,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onSelectOrder,
  onReorder,
  onCancelOrder,
}: OrderListCardsProps) {
  if (orders.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground text-xs rounded-2xl border-border">
        No orders found matching the filter criteria.
      </Card>
    );
  }

  return (
    <div className="space-y-4 flex-1 flex flex-col">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {orders.map((order) => {
          const isCold = order.tempRequirement === "chilled";
          const isPending = order.status === "pending";

          return (
            <Card
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs text-primary tabular-nums">
                      {order.orderRef}
                    </span>
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
                        className="text-[9px] px-1 py-0 h-3.5 bg-sky-600 text-white font-bold gap-0.5"
                      >
                        <SnowflakeIcon className="size-2.5" />
                        COL
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold text-foreground text-xs mt-1">
                    {order.outletName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {order.district} • {order.depot}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border text-center text-xs">
                <div className="bg-muted/30 p-1.5 rounded-lg">
                  <span className="text-[9px] text-muted-foreground block">Weight</span>
                  <span className="font-bold text-foreground text-[11px] tabular-nums">
                    {order.totalWeightKg.toFixed(1)} kg
                  </span>
                </div>
                <div className="bg-muted/30 p-1.5 rounded-lg">
                  <span className="text-[9px] text-muted-foreground block">Volume</span>
                  <span className="font-bold text-foreground text-[11px] tabular-nums">
                    {order.totalVolumeM3.toFixed(2)} m³
                  </span>
                </div>
                <div className="bg-muted/30 p-1.5 rounded-lg">
                  <span className="text-[9px] text-muted-foreground block">
                    Valuation
                  </span>
                  <span className="font-bold text-primary text-[11px] tabular-nums">
                    {(order.totalOrderValueLkr / 1000).toFixed(0)}k LKR
                  </span>
                </div>
              </div>

              <div
                className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px]"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] text-muted-foreground">
                  Window: {order.requiredDate}
                </span>
                <div className="flex items-center gap-1">
                  {onReorder && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-6 px-1.5 text-[10px] gap-1 cursor-pointer"
                      onClick={() => onReorder(order)}
                    >
                      <ArrowCounterClockwiseIcon className="size-3" />
                      Reorder
                    </Button>
                  )}
                  {isPending && onCancelOrder && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-6 px-1.5 text-[10px] text-destructive hover:text-destructive cursor-pointer"
                      onClick={() => onCancelOrder(order)}
                    >
                      <TrashIcon className="size-3" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
        <span className="text-muted-foreground text-xs tabular-nums">
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount} orders
        </span>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
