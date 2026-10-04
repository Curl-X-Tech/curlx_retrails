import { useNavigate } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusIcon, SnowflakeIcon } from "@phosphor-icons/react";
import { TablePagination } from "@/components/shared/table-pagination";
import { StoreReceivingStage, getReceivingActionLabel } from "./store-receiving-stage";
import type { InboundShipment } from "../types";

interface StoreReceivingTableProps {
  shipments: InboundShipment[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onInspect: (shipment: InboundShipment) => void;
}

export function StoreReceivingTable({
  shipments,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onInspect,
}: StoreReceivingTableProps) {
  const navigate = useNavigate();
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
          of <span className="font-bold text-foreground">{totalCount}</span> deliveries
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
                Outlet & Depot
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground">
                Delivery Date
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right">
                Packages
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right">
                Weight
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right">
                Order Total
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground">
                Stage
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      No inbound deliveries for today
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Orders due today will appear here once they are allocated.
                    </p>
                    <Button
                      size="xs"
                      className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
                      onClick={() => navigate("/store/orders/new")}
                    >
                      <PlusIcon className="size-3" />
                      Create Order
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              shipments.map((s) => (
                <TableRow
                  key={s.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => onInspect(s)}
                >
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground text-xs">
                        {s.orderRef}
                      </span>
                      {s.isUrgent && (
                        <Badge
                          variant="destructive"
                          className="text-[9px] px-1 py-0 h-3.5 font-bold uppercase"
                        >
                          Urgent
                        </Badge>
                      )}
                      {s.tempRequirement === "chilled" && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1 py-0 h-3.5 gap-0.5"
                        >
                          <SnowflakeIcon className="size-2.5" />
                          COL
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground font-medium text-xs block">
                      {s.outletName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {s.district} • {s.depot}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {s.requiredDate}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {s.totalPackages}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground text-xs tabular-nums">
                    {s.totalWeightKg.toFixed(1)} kg
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground text-xs tabular-nums">
                    LKR {s.totalValueLkr.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <StoreReceivingStage status={s.status} />
                  </TableCell>
                  <TableCell
                    className="text-right pr-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant={s.status === "in_transit" ? "default" : "outline"}
                      size="xs"
                      className="h-6 px-2 text-[11px] cursor-pointer"
                      onClick={() => onInspect(s)}
                    >
                      {getReceivingActionLabel(s.status)}
                    </Button>
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
