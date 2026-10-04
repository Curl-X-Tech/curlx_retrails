import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { DeferralAuditRecord } from "@/features/dispatcher/types";

interface StoreDeferralsAuditTableProps {
  logs: DeferralAuditRecord[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function StoreDeferralsAuditTable({
  logs,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
}: StoreDeferralsAuditTableProps) {
  return (
    <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
      <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="text-muted-foreground text-xs tabular-nums">
          Showing{" "}
          <span className="font-bold text-foreground">
            {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-bold text-foreground">
            {Math.min(currentPage * pageSize, totalCount)}
          </span>{" "}
          of <span className="font-bold text-foreground">{totalCount}</span> audit records
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <Table className="w-full text-xs">
          <TableHeader className="bg-muted/30 sticky top-0 z-10">
            <TableRow className="hover:bg-transparent border-b border-border/60">
              <TableHead className="text-xs font-semibold text-foreground pl-4">
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
                Weight
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right">
                Valuation
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right pr-4">
                Decision Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-48 text-center text-muted-foreground text-xs"
                >
                  No audit logs found matching the filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="pl-4 font-bold text-primary tabular-nums">
                    {log.orderRef}
                  </TableCell>
                  <TableCell className="font-medium text-foreground text-xs">
                    {log.outletName}
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize text-xs">
                    {log.deferralReason.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {log.limitingResource.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground text-xs tabular-nums">
                    {log.totalWeightKg.toFixed(1)} kg
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground text-xs tabular-nums">
                    LKR {log.totalValueLkr.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs tabular-nums pr-4">
                    {log.dispatchDate}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
