import { DownloadSimpleIcon, PrinterIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function StoreReportsPage() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background font-sans">
      {/* Top Header */}
      <div className="border-b border-border bg-card px-4 md:px-8 py-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-foreground">
              Store Logistics & Fulfillment Reports
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fulfillment service rate analytics, crate reconciliation, and procurement
              spend summaries
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs gap-1.5 rounded-xl border-border"
          >
            <PrinterIcon className="size-4" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground font-medium block">
              On-Time Delivery Rate
            </span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              98.4%
            </p>
            <span className="text-[11px] text-muted-foreground">
              Within 15-min scheduled window
            </span>
          </Card>

          <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground font-medium block">
              Crate Reconciliation
            </span>
            <p className="text-2xl font-bold text-primary mt-1">100% Balanced</p>
            <span className="text-[11px] text-muted-foreground">
              Empty crates returned to depot
            </span>
          </Card>

          <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground font-medium block">
              Monthly Replenishment Spend
            </span>
            <p className="text-2xl font-extrabold text-foreground mt-1">LKR 4.82M</p>
            <span className="text-[11px] text-muted-foreground">
              Adhering to active price list
            </span>
          </Card>
        </div>

        {/* Available Report Downloads */}
        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-sm sm:text-base text-foreground">
            Standard Operating Reports
          </h3>

          <div className="space-y-2">
            {[
              {
                title: "Daily Store Delivery & POD Manifest Summary",
                desc: "Complete itemized log of all deliveries, signature proofs, and driver drop times.",
                format: "PDF • 2.4 MB",
              },
              {
                title: "Monthly Cold Chain Integrity & Temp Logs",
                desc: "Reefer compartment sensor logs during transit and dock unloading intervals.",
                format: "CSV • 850 KB",
              },
              {
                title: "Order Deferral & Recovery Audit Log",
                desc: "Full record of capacity bottleneck deferrals and Level 1 next-day dispatch recoveries.",
                format: "PDF • 1.1 MB",
              },
            ].map((report, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    {report.title}
                  </h4>
                  <p className="text-muted-foreground mt-0.5">{report.desc}</p>
                  <span className="text-[10px] text-muted-foreground font-medium mt-1 inline-block">
                    {report.format}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {}}
                  className="gap-1.5 rounded-lg border-border text-xs shrink-0"
                >
                  <DownloadSimpleIcon className="size-4" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
