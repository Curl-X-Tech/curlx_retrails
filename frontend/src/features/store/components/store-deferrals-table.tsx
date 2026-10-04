import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TablePagination } from "@/components/shared/table-pagination";
import { SnowflakeIcon } from "@phosphor-icons/react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { CarryoverOrder } from "@/features/dispatcher/types";

interface StoreDeferralsTableProps {
  orders: CarryoverOrder[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function StoreDeferralsTable({
  orders,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
}: StoreDeferralsTableProps) {
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
          of <span className="font-bold text-foreground">{totalCount}</span> deferred
          orders
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
                Destination Outlet
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground">
                Cargo Temp
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground">
                Deferral Reason
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-center">
                Priority Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right">
                Weight
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right pr-4">
                Valuation
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-48 text-center text-muted-foreground text-xs"
                >
                  No deferred orders found matching the filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="pl-4 font-bold text-primary tabular-nums">
                    {order.orderRef}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-foreground text-xs block">
                      {order.outletName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {order.district}
                    </span>
                  </TableCell>
                  <TableCell>
                    {order.tempRequirement === "chilled" ? (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1 py-0 h-3.5 gap-0.5"
                      >
                        <SnowflakeIcon className="size-2.5" />
                        COL
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">Ambient</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs capitalize">
                    {order.deferralReason.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-center">
                    {order.deferredYesterday === 1 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                        Must Dispatch Tomorrow
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                        Deferred Today (Level 1)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground text-xs tabular-nums">
                    {order.totalWeightKg.toFixed(1)} kg
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground text-xs tabular-nums pr-4">
                    LKR {order.totalValueLkr.toLocaleString()}
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
