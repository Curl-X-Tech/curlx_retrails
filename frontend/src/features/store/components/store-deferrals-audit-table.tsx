import { Badge } from "@/components/ui/badge";
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
}

export function StoreDeferralsAuditTable({ logs }: StoreDeferralsAuditTableProps) {
  return (
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
          {logs.map((log) => (
            <TableRow key={log.id} className="hover:bg-muted/20">
              <TableCell className="font-semibold text-primary">{log.orderRef}</TableCell>
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
  );
}
