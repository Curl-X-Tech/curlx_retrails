import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  StoreDeferralsKpi,
  StoreDeferralsTable,
  StoreDeferralsAuditTable,
} from "@/features/store/components";
import { useStoreDeferrals } from "@/features/store/hooks";

interface StoreDeferralsPageProps {
  viewMode?: "unserved" | "log" | "carryover";
}

export function StoreDeferralsPage({ viewMode = "unserved" }: StoreDeferralsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeMode =
    (searchParams.get("tab") as "unserved" | "log" | "carryover") || viewMode;
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const handleTabChange = (tab: "unserved" | "log" | "carryover") => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const { carryoverOrders, auditLogs, totalCarryovers } = useStoreDeferrals(searchQuery);

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-4rem)] overflow-hidden bg-background font-sans">
      <div className="border-b border-border bg-card px-4 md:px-8 py-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-bold text-xl sm:text-2xl text-foreground">
                Store Order Deferrals & Carryovers
              </h1>
              <Badge
                variant="outline"
                className="text-xs font-semibold border-amber-500/30 text-amber-700 dark:text-amber-300"
              >
                Rule: Max 1 Day Deferral
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track postponed retail replenishments, bottleneck reasons, and scheduled
              recovery runs
            </p>
          </div>

          <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
            {(["unserved", "carryover", "log"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer capitalize ${
                  activeMode === tab
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "log"
                  ? "Audit Log"
                  : tab === "unserved"
                    ? "Unserved Queue"
                    : "Carryover"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
        <StoreDeferralsKpi totalPending={totalCarryovers} />

        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by order ref, outlet, or reason..."
            className="pl-9 h-9 text-xs rounded-xl bg-card border-border"
          />
        </div>

        {activeMode === "log" ? (
          <StoreDeferralsAuditTable logs={auditLogs} />
        ) : (
          <StoreDeferralsTable orders={carryoverOrders} />
        )}
      </div>
    </div>
  );
}
