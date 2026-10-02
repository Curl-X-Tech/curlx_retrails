import * as React from "react";
import { useSearchParams } from "react-router-dom";
import {
  WarningOctagonIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  TruckIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { mockCarryoverOrders, mockDeferralAuditLogs } from "@/data/mock-deferrals";

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

  const filteredCarryovers = mockCarryoverOrders.filter(
    (order) =>
      order.orderRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.outletName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.deferralReason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = mockDeferralAuditLogs.filter(
    (log) =>
      log.orderRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.outletName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.deferralReason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background font-sans">
      {/* Top Header */}
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

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => handleTabChange("unserved")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeMode === "unserved"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Unserved Queue
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("carryover")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeMode === "carryover"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Carryover
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("log")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeMode === "log"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                Pending Unserved
              </span>
              <WarningOctagonIcon className="size-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">
              {mockCarryoverOrders.length} Orders
            </p>
            <span className="text-[11px] text-muted-foreground">
              Queued for next morning wave
            </span>
          </Card>

          <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                Consecutive Skip Block
              </span>
              <ShieldCheckIcon className="size-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              100% Guaranteed
            </p>
            <span className="text-[11px] text-muted-foreground">
              Auto-escalated to Level 1 Priority
            </span>
          </Card>

          <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                Recovery Fleet
              </span>
              <TruckIcon className="size-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary mt-1">Wave 1 (05:00 AM)</p>
            <span className="text-[11px] text-muted-foreground">
              Dedicated reefer & van allocation
            </span>
          </Card>
        </div>

        {/* Search Bar */}
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

        {/* Table View */}
        {activeMode === "log" ? (
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Order Ref
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Outlet
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Deferral Reason
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Limiting Resource
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground text-right">
                    Weight (kg)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground text-right">
                    Valuation (LKR)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground text-right">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/20">
                    <TableCell className="font-semibold text-primary">
                      {log.orderRef}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {log.outletName}
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize">
                      {log.deferralReason.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {log.limitingResource.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {log.totalWeightKg.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      LKR {log.totalValueLkr.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {log.dispatchDate}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Order Ref
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Destination Outlet
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Cargo Temp
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Deferral Reason
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Priority Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground text-right">
                    Weight (kg)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground text-right">
                    Valuation (LKR)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCarryovers.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/20">
                    <TableCell className="font-semibold text-primary">
                      {order.orderRef}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground block">
                        {order.outletName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {order.district}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${
                          order.tempRequirement === "chilled"
                            ? "border-sky-500/30 text-sky-700 dark:text-sky-300"
                            : ""
                        }`}
                      >
                        {order.tempRequirement}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {order.deferralReason}
                    </TableCell>
                    <TableCell>
                      {order.deferredYesterday === 1 ? (
                        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[10px] font-semibold">
                          Must Dispatch Tomorrow
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-medium">
                          Deferred Today
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {order.totalWeightKg.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      LKR {order.totalValueLkr.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
