import { useNavigate } from "react-router-dom";
import { ArrowRightIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  useStoreOrders,
  StoreDashboardKpi,
  StoreDashboardAlerts,
} from "@/features/store";

export function StoreDashboardPage() {
  const navigate = useNavigate();
  const { orders } = useStoreOrders();

  const totalOrders = orders.length;
  const inTransitCount = orders.filter((o) => o.status === "in_transit").length;
  const loadingCount = orders.filter((o) => o.status === "loading").length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const servedCount = orders.filter((o) => o.status === "served").length;
  const totalOrderValue = orders.reduce((sum, o) => sum + o.totalOrderValueLkr, 0);
  const totalWeight = orders.reduce((sum, o) => sum + o.totalWeightKg, 0);

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-4rem)] overflow-hidden bg-background font-sans">
      <div className="border-b border-border bg-card px-4 md:px-8 py-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-foreground">
              Store Manager Operations Hub
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live replenishment monitoring, dock status alerts, and daily manifest queues
            </p>
          </div>

          <Button
            onClick={() => navigate("/store/orders/new")}
            size="sm"
            className="h-9 px-3 text-xs gap-1.5 rounded-xl bg-primary text-primary-foreground font-semibold cursor-pointer self-start sm:self-auto active:scale-[0.98] transition-all"
          >
            <PlusIcon className="size-4 font-bold" />
            Create New Order
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
        <StoreDashboardKpi
          totalOrders={totalOrders}
          totalWeight={totalWeight}
          inTransitCount={inTransitCount}
          loadingCount={loadingCount}
          pendingCount={pendingCount}
          totalOrderValue={totalOrderValue}
          servedCount={servedCount}
        />

        <StoreDashboardAlerts />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm sm:text-base text-foreground">
              Today's Manifest Runs
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/store/orders")}
              className="text-xs gap-1 rounded-lg border-border cursor-pointer active:scale-[0.98] transition-all"
            >
              <span>View All in Queue</span>
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>

          <div className="space-y-2">
            {orders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                onClick={() => navigate("/store/orders")}
                className="p-3.5 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between gap-3 text-xs cursor-pointer hover:border-primary/40 active:scale-[0.99] transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary tabular-nums">
                      {order.orderRef}
                    </span>
                    <span className="text-muted-foreground">• {order.outletName}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {order.totalItems} pkgs • {order.totalWeightKg.toFixed(1)} kg • ETA{" "}
                    {order.eta || "Pending"}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-foreground block tabular-nums">
                    LKR {order.totalOrderValueLkr.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {order.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
