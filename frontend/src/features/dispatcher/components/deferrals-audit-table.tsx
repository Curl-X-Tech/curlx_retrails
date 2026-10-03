import * as React from "react";
import { TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SortHeaderIcon } from "@/components/shared/sort-header-icon";
import { DeferralsGroupHeader } from "./deferrals-group-header";
import { DeferralsAuditRow } from "./deferrals-audit-row";
import type { DeferralAuditRecord, AuditGroupBy } from "../types";

interface GroupedAudit {
  key: string;
  title: string;
  description?: string;
  items: DeferralAuditRecord[];
  totalWeightKg: number;
  totalVolumeM3: number;
  totalValueLkr: number;
}

interface DeferralsAuditTableProps {
  auditGroupBy: AuditGroupBy;
  groupedAuditLogs: GroupedAudit[] | null;
  paginatedAuditLogs: DeferralAuditRecord[];
  auditSortKey: string | null;
  auditSortDirection: "asc" | "desc";
  onSort: (key: string) => void;
  onSelectOrderRef: (orderRef: string) => void;
}

export function DeferralsAuditTable({
  auditGroupBy,
  groupedAuditLogs,
  paginatedAuditLogs,
  auditSortKey,
  auditSortDirection,
  onSort,
  onSelectOrderRef,
}: DeferralsAuditTableProps) {
  return (
    <TooltipProvider delay={100}>
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <TableHeader className="sticky top-0 z-20 bg-card shadow-2xs border-b border-border/80">
            <TableRow className="border-b border-border/80 hover:bg-transparent">
              <TableHead
                className="w-[110px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                onClick={() => onSort("date")}
              >
                <div className="flex items-center gap-1">
                  <span>Dispatch Date</span>
                  <SortHeaderIcon
                    active={auditSortKey === "date"}
                    direction={auditSortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                className="w-[120px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                onClick={() => onSort("orderRef")}
              >
                <div className="flex items-center gap-1">
                  <span>Order</span>
                  <SortHeaderIcon
                    active={auditSortKey === "orderRef"}
                    direction={auditSortDirection}
                  />
                </div>
              </TableHead>
              <TableHead className="w-[190px] font-bold text-foreground text-xs">
                Outlet / Store
              </TableHead>
              <TableHead className="w-[170px] font-bold text-foreground text-xs">
                Deferral Reason
              </TableHead>
              <TableHead className="w-[120px] font-bold text-foreground text-xs">
                Limiting Resource
              </TableHead>
              <TableHead
                className="w-[100px] text-right cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                onClick={() => onSort("weight")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Weight</span>
                  <SortHeaderIcon
                    active={auditSortKey === "weight"}
                    direction={auditSortDirection}
                  />
                </div>
              </TableHead>
              <TableHead
                className="w-[110px] text-right cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                onClick={() => onSort("value")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Value (LKR)</span>
                  <SortHeaderIcon
                    active={auditSortKey === "value"}
                    direction={auditSortDirection}
                  />
                </div>
              </TableHead>
              <TableHead className="w-[140px] font-bold text-foreground text-xs">
                Decision Maker
              </TableHead>
              <TableHead className="w-[50px] text-right font-bold text-foreground text-xs">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditGroupBy !== "none" && groupedAuditLogs
              ? groupedAuditLogs.map((group) => (
                  <React.Fragment key={group.key}>
                    <DeferralsGroupHeader
                      title={group.title}
                      itemCount={group.items.length}
                      description={group.description}
                      totalWeightKg={group.totalWeightKg}
                      totalVolumeM3={group.totalVolumeM3}
                      totalValueLkr={group.totalValueLkr}
                      colSpan={9}
                    />
                    {group.items.map((log) => (
                      <DeferralsAuditRow
                        key={log.id}
                        log={log}
                        onSelectOrderRef={onSelectOrderRef}
                      />
                    ))}
                  </React.Fragment>
                ))
              : paginatedAuditLogs.map((log) => (
                  <DeferralsAuditRow
                    key={log.id}
                    log={log}
                    onSelectOrderRef={onSelectOrderRef}
                  />
                ))}
          </TableBody>
        </table>
      </div>
    </TooltipProvider>
  );
}
