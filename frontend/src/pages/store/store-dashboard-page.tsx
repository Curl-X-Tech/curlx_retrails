import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  PlusIcon,
  TruckIcon,
  ClockCounterClockwiseIcon,
  PackageIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useStoreOrders,
  StoreDashboardKpi,
  StoreDashboardAlerts,
  StoreReplenishmentChart,
  StoreFulfillmentChart,
  StoreDockScheduleChart,
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
              Store Operations Hub
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Replenishment analytics, delivery schedule velocity, and intake status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/store/receiving")}
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs gap-1.5 rounded-xl border-border font-semibold cursor-pointer active:scale-[0.98] transition-all"
            >
              <TruckIcon className="size-4" weight="bold" />
              Inbound Dock
            </Button>
            <Button
              onClick={() => navigate("/store/orders/new")}
              size="sm"
              className="h-9 px-3 text-xs gap-1.5 rounded-xl bg-primary text-primary-foreground font-semibold cursor-pointer active:scale-[0.98] transition-all"
            >
              <PlusIcon className="size-4 font-bold" />
              New Order
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Main 2-Column Section (Stats & Charts) */}
          <div className="xl:col-span-2 space-y-6">
            <StoreDashboardKpi
              totalOrders={totalOrders}
              totalWeight={totalWeight}
              inTransitCount={inTransitCount}
              loadingCount={loadingCount}
              pendingCount={pendingCount}
              totalOrderValue={totalOrderValue}
              servedCount={servedCount}
            />

            <div className="space-y-6">
              <StoreReplenishmentChart />
              <StoreFulfillmentChart
                totalOrders={totalOrders}
                servedCount={servedCount}
                inTransitCount={inTransitCount}
                loadingCount={loadingCount}
                pendingCount={pendingCount}
              />
              <StoreDockScheduleChart orders={orders} />
            </div>
          </div>

          {/* Side 1-Column Section (Alerts & Quick Navigation) */}
          <div className="xl:col-span-1 space-y-6">
            <StoreDashboardAlerts />

            <div className="space-y-3">
              <h3 className="font-heading font-semibold text-sm text-foreground">
                Quick Navigation
              </h3>
              <div className="space-y-3">
                <Card
                  onClick={() => navigate("/store/receiving")}
                  className="p-4 rounded-xl border border-border/80 bg-card shadow-xs hover:border-primary/40 cursor-pointer active:scale-[0.99] transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <TruckIcon className="size-4 text-sky-600" weight="bold" />
                      Inbound Receiving
                    </span>
                    <ArrowRightIcon className="size-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Inspect incoming trucks, verify physical counts, and record shortages.
                  </p>
                </Card>

                <Card
                  onClick={() => navigate("/store/orders")}
                  className="p-4 rounded-xl border border-border/80 bg-card shadow-xs hover:border-primary/40 cursor-pointer active:scale-[0.99] transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <PackageIcon className="size-4 text-primary" weight="bold" />
                      Order Queue
                    </span>
                    <ArrowRightIcon className="size-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Track depot staging status, manage drafts, and review itemized
                    manifests.
                  </p>
                </Card>

                <Card
                  onClick={() => navigate("/store/deferrals")}
                  className="p-4 rounded-xl border border-border/80 bg-card shadow-xs hover:border-primary/40 cursor-pointer active:scale-[0.99] transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <ClockCounterClockwiseIcon
                        className="size-4 text-amber-600"
                        weight="bold"
                      />
                      Deferrals Queue
                    </span>
                    <ArrowRightIcon className="size-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Review rollover runs, auto-escalated priority batches, and audit
                    trails.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
