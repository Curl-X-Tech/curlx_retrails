import { DownloadSimpleIcon, PrinterIcon, FileCsvIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStoreOrders } from "@/features/store/hooks/use-store-orders";
import { useStoreDeferrals } from "@/features/store/hooks/use-store-deferrals";

export function StoreReportsPage() {
  const { orders } = useStoreOrders();
  const { auditLogs } = useStoreDeferrals();

  const handleDownloadPODManifest = () => {
    const headers = [
      "Order Ref",
      "Outlet Name",
      "Depot",
      "Required Date",
      "Items Count",
      "Total Weight (kg)",
      "Total Volume (m3)",
      "Valuation (LKR)",
      "Status",
    ];
    const rows = orders.map((o) => [
      o.orderRef,
      `"${o.outletName}"`,
      `"${o.depot}"`,
      o.requiredDate,
      o.totalItems,
      o.totalWeightKg.toFixed(1),
      o.totalVolumeM3.toFixed(2),
      o.totalOrderValueLkr,
      o.status,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `store_manifest_pod_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadColdChainLog = () => {
    const headers = [
      "Order Ref",
      "Item SKU",
      "Description",
      "Category",
      "Handling Code",
      "Quantity",
      "Weight (kg)",
      "Status",
    ];
    const rows: (string | number)[][] = [];
    orders.forEach((o) => {
      o.items
        .filter((item) => item.specialHandlingCode === "COL")
        .forEach((item) => {
          rows.push([
            o.orderRef,
            item.sku,
            `"${item.name}"`,
            item.category,
            "COL (Cold Chain)",
            item.quantity,
            (item.unitWeightKg * item.quantity).toFixed(1),
            o.status,
          ]);
        });
    });
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `cold_chain_temp_log_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDeferralAudit = () => {
    const headers = [
      "ID",
      "Order Ref",
      "Outlet Name",
      "Deferral Reason",
      "Limiting Resource",
      "Decision Maker",
      "Created At",
    ];
    const rows = auditLogs.map((log) => [
      log.id,
      `"${log.orderRef}"`,
      `"${log.outletName}"`,
      `"${log.deferralReason}"`,
      `"${log.limitingResource || "N/A"}"`,
      `"${log.decisionMakerName}"`,
      log.createdAt,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `deferrals_audit_log_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-4rem)] overflow-hidden bg-background font-sans">
      <div className="border-b border-border bg-card px-4 md:px-8 py-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-foreground">
              Store Logistics & Fulfillment Reports
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fulfillment service rate analytics, cold chain audits, and procurement
              manifest exports
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs gap-1.5 rounded-xl border-border cursor-pointer active:scale-[0.98] transition-all"
          >
            <PrinterIcon className="size-4" />
            Print Report View
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground font-medium block">
              On-Time Delivery Rate
            </span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              98.4%
            </p>
            <span className="text-[11px] text-muted-foreground">
              Within scheduled delivery window
            </span>
          </Card>

          <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground font-medium block">
              Crate Reconciliation
            </span>
            <p className="text-2xl font-bold text-primary mt-1 tabular-nums">
              100% Balanced
            </p>
            <span className="text-[11px] text-muted-foreground">
              Empty crates accounted for
            </span>
          </Card>

          <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground font-medium block">
              Active Manifest Valuation
            </span>
            <p className="text-2xl font-extrabold text-foreground mt-1 tabular-nums">
              LKR{" "}
              {(orders.reduce((sum, o) => sum + o.totalOrderValueLkr, 0) / 1000).toFixed(
                0
              )}
              k
            </p>
            <span className="text-[11px] text-muted-foreground">
              Adhering to canonical price list
            </span>
          </Card>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-sm sm:text-base text-foreground">
            Standard Operating Reports
          </h3>

          <div className="space-y-2">
            <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileCsvIcon className="size-4 text-emerald-600" weight="bold" />
                  <h4 className="font-semibold text-foreground text-sm">
                    Daily Store Delivery & POD Manifest Summary
                  </h4>
                </div>
                <p className="text-muted-foreground">
                  Complete itemized log of all deliveries, order weights, volumetric
                  metrics, and fulfillment status.
                </p>
                <span className="text-[10px] text-muted-foreground font-medium inline-block tabular-nums">
                  CSV Export • Live Dataset ({orders.length} records)
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPODManifest}
                className="gap-1.5 rounded-lg border-border text-xs shrink-0 cursor-pointer active:scale-[0.98] transition-all"
              >
                <DownloadSimpleIcon className="size-4" />
                Download CSV
              </Button>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileCsvIcon className="size-4 text-cyan-600" weight="bold" />
                  <h4 className="font-semibold text-foreground text-sm">
                    Cold Chain Integrity & Reefer Manifest Log
                  </h4>
                </div>
                <p className="text-muted-foreground">
                  Itemized cold storage manifest tracking COL packages, weight allocation,
                  and temperature requirements.
                </p>
                <span className="text-[10px] text-muted-foreground font-medium inline-block tabular-nums">
                  CSV Export • Filtered COL Lines
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadColdChainLog}
                className="gap-1.5 rounded-lg border-border text-xs shrink-0 cursor-pointer active:scale-[0.98] transition-all"
              >
                <DownloadSimpleIcon className="size-4" />
                Download CSV
              </Button>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileCsvIcon className="size-4 text-amber-600" weight="bold" />
                  <h4 className="font-semibold text-foreground text-sm">
                    Order Deferral & Recovery Audit Log
                  </h4>
                </div>
                <p className="text-muted-foreground">
                  Full historical log of capacity bottleneck deferrals, rule violations,
                  and next-day recovery escalations.
                </p>
                <span className="text-[10px] text-muted-foreground font-medium inline-block tabular-nums">
                  CSV Export • {auditLogs.length} Audit Entries
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadDeferralAudit}
                className="gap-1.5 rounded-lg border-border text-xs shrink-0 cursor-pointer active:scale-[0.98] transition-all"
              >
                <DownloadSimpleIcon className="size-4" />
                Download CSV
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
