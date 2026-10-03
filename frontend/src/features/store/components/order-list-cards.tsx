import { Card } from "@/components/ui/card";
import { OrderStatusBadge } from "./order-status-badge";
import type { StoreOrderRecord } from "../types";

interface OrderListCardsProps {
  orders: StoreOrderRecord[];
  onSelectOrder: (order: StoreOrderRecord) => void;
}

export function OrderListCards({ orders, onSelectOrder }: OrderListCardsProps) {
  if (orders.length === 0) {
    return (
      <div className="md:hidden">
        <Card className="p-6 text-center text-muted-foreground text-xs">
          No orders found matching the filter criteria.
        </Card>
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-3">
      {orders.map((order) => (
        <Card
          key={order.id}
          onClick={() => onSelectOrder(order)}
          className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3 cursor-pointer hover:border-primary/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-primary">
                  {order.tripId || order.orderRef}
                </span>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="font-semibold text-foreground text-sm mt-1">
                {order.outletName}
              </p>
              <p className="text-xs text-muted-foreground">
                {order.district} • {order.depot} Depot
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">ETA</span>
              <span className="font-semibold text-xs text-foreground">
                {order.eta || "Pending"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center text-xs">
            <div className="bg-muted/40 p-1.5 rounded-lg">
              <span className="text-[10px] text-muted-foreground block">Items</span>
              <span className="font-bold text-foreground">{order.totalItems} pkgs</span>
            </div>
            <div className="bg-muted/40 p-1.5 rounded-lg">
              <span className="text-[10px] text-muted-foreground block">Weight</span>
              <span className="font-bold text-foreground">
                {order.totalWeightKg.toFixed(1)} kg
              </span>
            </div>
            <div className="bg-muted/40 p-1.5 rounded-lg">
              <span className="text-[10px] text-muted-foreground block">Valuation</span>
              <span className="font-bold text-foreground">
                LKR {(order.totalOrderValueLkr / 1000).toFixed(0)}k
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
