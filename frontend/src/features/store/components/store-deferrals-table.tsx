import { Badge } from "@/components/ui/badge";
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
}

export function StoreDeferralsTable({ orders }: StoreDeferralsTableProps) {
  return (
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
          {orders.map((order) => (
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
  );
}
