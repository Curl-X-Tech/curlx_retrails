import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { TablePagination } from "@/components/shared/table-pagination";
import { OrderListTableRow } from "./order-list-table-row";
import type { StoreOrderRecord } from "../types";

interface OrderListTableProps {
  orders: StoreOrderRecord[];
  selectedIds: string[];
  allSelected: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: string) => void;
  onSelectOrder: (order: StoreOrderRecord) => void;
  onReorder?: (order: StoreOrderRecord) => void;
  onCancelOrder?: (order: StoreOrderRecord) => void;
}

export function OrderListTable({
  orders,
  selectedIds,
  allSelected,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onToggleSelectAll,
  onToggleSelectRow,
  onSelectOrder,
  onReorder,
  onCancelOrder,
}: OrderListTableProps) {
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
          of <span className="font-bold text-foreground">{totalCount}</span> orders
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
              <TableHead className="w-10 px-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                />
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground">
                Order
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground">
                Destination
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground">
                Temp Zone
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-center">
                Packages
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right">
                Weight
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right">
                Volume
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right">
                Order Value
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground">
                Delivery Window
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-center">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground text-right pr-4">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="h-48 text-center text-muted-foreground text-xs"
                >
                  No orders found matching the filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <OrderListTableRow
                  key={order.id}
                  order={order}
                  isSelected={selectedIds.includes(order.id)}
                  onToggleSelect={onToggleSelectRow}
                  onSelectOrder={onSelectOrder}
                  onReorder={onReorder}
                  onCancelOrder={onCancelOrder}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
