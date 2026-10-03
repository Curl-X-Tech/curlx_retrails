import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  WarningCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  PlusIcon,
  SnowflakeIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStoreOrders } from "@/features/store";

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
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background font-sans">
      {/* Top Header */}
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
            className="h-9 px-3 text-xs gap-1.5 rounded-xl bg-primary text-primary-foreground font-semibold cursor-pointer self-start sm:self-auto"
          >
            <PlusIcon className="size-4 font-bold" />
            Create New Order
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground font-medium block">
              Total Store Orders
            </span>
            <p className="text-2xl font-bold text-foreground mt-1">{totalOrders}</p>
            <span className="text-[11px] text-muted-foreground">
              {totalWeight.toFixed(1)} kg allocated
            </span>
          </Card>

          <Card className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/5 shadow-xs">
            <span className="text-[11px] text-sky-700 dark:text-sky-300 font-medium block">
              Active In Transit
            </span>
            <p className="text-2xl font-bold text-sky-700 dark:text-sky-300 mt-1">
              {inTransitCount}
            </p>
            <span className="text-[11px] text-muted-foreground">
              Arriving before 08:30 AM
            </span>
          </Card>

          <Card className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-xs">
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium block">
              Loading / Pending
            </span>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
              {loadingCount + pendingCount}
            </p>
            <span className="text-[11px] text-muted-foreground">Depot bay staging</span>
          </Card>

          <Card className="p-4 rounded-xl border border-primary/20 bg-primary/5 shadow-xs">
            <span className="text-[11px] text-primary font-semibold block">
              Total Valuation
            </span>
            <p className="text-2xl font-extrabold text-primary mt-1">
              LKR {(totalOrderValue / 1000).toFixed(0)}k
            </p>
            <span className="text-[11px] text-muted-foreground">
              {servedCount} fulfilled today
            </span>
          </Card>
        </div>

        {/* System Alerts Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm sm:text-base text-foreground flex items-center gap-2">
              <WarningCircleIcon className="size-4 text-amber-500" />
              Store System Alerts
            </h3>
            <Badge variant="outline" className="text-[10px]">
              2 Active Alerts
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Alert 1: Cold Chain Notice */}
            <Card className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SnowflakeIcon className="size-4 text-sky-600 dark:text-sky-400" />
                  <span className="font-bold text-xs text-foreground">
                    Cold Chain Reefer Run Inbound
                  </span>
                </div>
                <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 text-[10px]">
                  TRP-0928-COL
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Reefer truck carrying dairy and chilled produce is scheduled to dock at
                Fort Dock at 06:30 AM. Ensure dock receiving team is standing by.
              </p>
            </Card>

            {/* Alert 2: Deferral Carryover Notice */}
            <Card className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClockIcon className="size-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-xs text-foreground">
                    Deferred Order Auto-Escalated
                  </span>
                </div>
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px]">
                  ORD-2026-085
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Negombo Bay order was deferred yesterday due to vehicle volume cap. System
                has escalated this run to Level 1 Priority for dispatch tomorrow.
              </p>
            </Card>
          </div>
        </div>

        {/* Recent Orders Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm sm:text-base text-foreground">
              Today's Manifest Runs
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/store/orders")}
              className="text-xs gap-1 rounded-lg border-border"
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
                className="p-3.5 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between gap-3 text-xs cursor-pointer hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">{order.orderRef}</span>
                    <span className="text-muted-foreground">• {order.outletName}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {order.totalItems} pkgs • {order.totalWeightKg.toFixed(1)} kg • ETA{" "}
                    {order.eta || "Pending"}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-foreground block">
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
