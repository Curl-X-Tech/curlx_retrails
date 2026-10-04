import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import {
  StoreDeferralsHeader,
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
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const pageSize = 10;

  const handleTabChange = (tab: "unserved" | "log" | "carryover") => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
    setCurrentPage(1);
  };

  const { carryoverOrders, auditLogs, totalCarryovers } = useStoreDeferrals(searchQuery);

  const displayedOrders = React.useMemo(() => {
    if (activeMode === "carryover") {
      return carryoverOrders.filter((o) => o.deferredYesterday === 1);
    }
    return carryoverOrders;
  }, [carryoverOrders, activeMode]);

  const totalWeightKg = React.useMemo(
    () => displayedOrders.reduce((sum, o) => sum + o.totalWeightKg, 0),
    [displayedOrders]
  );

  const totalValueLkr = React.useMemo(
    () => displayedOrders.reduce((sum, o) => sum + o.totalValueLkr, 0),
    [displayedOrders]
  );

  const mustDispatchCount = React.useMemo(
    () => carryoverOrders.filter((o) => o.deferredYesterday === 1).length,
    [carryoverOrders]
  );

  const totalPagesOrders = Math.max(1, Math.ceil(displayedOrders.length / pageSize));
  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedOrders.slice(start, start + pageSize);
  }, [displayedOrders, currentPage, pageSize]);

  const totalPagesLogs = Math.max(1, Math.ceil(auditLogs.length / pageSize));
  const paginatedLogs = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return auditLogs.slice(start, start + pageSize);
  }, [auditLogs, currentPage, pageSize]);

  const handleExport = () => {
    const csvRows = [
      [
        "Order Ref",
        "Outlet",
        "District",
        "Reason",
        "Priority",
        "Weight (kg)",
        "Value (LKR)",
      ],
      ...displayedOrders.map((o) => [
        o.orderRef,
        `"${o.outletName}"`,
        `"${o.district}"`,
        `"${o.deferralReason}"`,
        o.deferredYesterday === 1 ? "Must Dispatch Tomorrow" : "Deferred Today",
        o.totalWeightKg.toString(),
        o.totalValueLkr.toString(),
      ]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `store-deferrals-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background font-sans">
      <StoreDeferralsHeader
        activeTab={activeMode}
        onTabChange={handleTabChange}
        onRefresh={() => window.location.reload()}
        onExport={handleExport}
      />

      <StoreDeferralsKpi
        totalPending={totalCarryovers}
        totalWeightKg={totalWeightKg}
        totalValueLkr={totalValueLkr}
        mustDispatchCount={mustDispatchCount}
      />

      {/* Filter toolbar */}
      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search order ref, outlet, or reason..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-7 pr-7 h-7 text-xs bg-card"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 min-h-0 margin-responsive py-4 sm:py-5 overflow-hidden flex flex-col">
        {activeMode === "log" ? (
          <StoreDeferralsAuditTable
            logs={paginatedLogs}
            totalCount={auditLogs.length}
            currentPage={currentPage}
            totalPages={totalPagesLogs}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        ) : (
          <StoreDeferralsTable
            orders={paginatedOrders}
            totalCount={displayedOrders.length}
            currentPage={currentPage}
            totalPages={totalPagesOrders}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
