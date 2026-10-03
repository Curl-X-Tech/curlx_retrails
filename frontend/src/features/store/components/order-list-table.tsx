import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { OrderListTableRow } from "./order-list-table-row";
import type { StoreOrderRecord } from "../types";

interface OrderListTableProps {
  orders: StoreOrderRecord[];
  selectedIds: string[];
  allSelected: boolean;
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: string) => void;
  onSelectOrder: (order: StoreOrderRecord) => void;
}

export function OrderListTable({
  orders,
  selectedIds,
  allSelected,
  onToggleSelectAll,
  onToggleSelectRow,
  onSelectOrder,
}: OrderListTableProps) {
  return (
    <div className="hidden md:block rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 px-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
              />
            </TableHead>
            <TableHead className="text-xs font-semibold text-foreground">
              Trip ID
            </TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Order</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">
              Outlet
            </TableHead>
            <TableHead className="text-xs font-semibold text-foreground">
              District
            </TableHead>
            <TableHead className="text-xs font-semibold text-foreground">ETA</TableHead>
            <TableHead className="text-xs font-semibold text-foreground text-right">
              Weight
            </TableHead>
            <TableHead className="text-xs font-semibold text-foreground text-right">
              Volume
            </TableHead>
            <TableHead className="text-xs font-semibold text-foreground text-center">
              Status
            </TableHead>
            <TableHead className="text-xs font-semibold text-foreground text-right pr-4">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
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
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
