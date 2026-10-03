import { useNavigate } from "react-router-dom";
import {
  DotsThreeVerticalIcon,
  EyeIcon,
  PrinterIcon,
  TruckIcon,
} from "@phosphor-icons/react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderStatusBadge } from "./order-status-badge";
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
  const navigate = useNavigate();

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
              <TableRow
                key={order.id}
                className="hover:bg-muted/30 transition-colors cursor-pointer group"
                onClick={() => onSelectOrder(order)}
              >
                <TableCell
                  className="px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelectRow(order.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(order.id)}
                    onChange={() => onToggleSelectRow(order.id)}
                    className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </TableCell>
                <TableCell className="font-semibold text-primary hover:underline">
                  {order.tripId || "-"}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {order.orderRef}
                </TableCell>
                <TableCell className="text-foreground font-medium">
                  {order.outletName}
                </TableCell>
                <TableCell className="text-muted-foreground">{order.district}</TableCell>
                <TableCell className="text-muted-foreground font-medium">
                  {order.eta || "-"}
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {order.totalWeightKg.toFixed(1)} kg
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {order.totalVolumeM3.toFixed(2)} m³
                </TableCell>
                <TableCell className="text-center">
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell
                  className="text-right pr-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                        />
                      }
                    >
                      <DotsThreeVerticalIcon className="size-4" weight="bold" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 text-xs shadow-lg rounded-xl"
                    >
                      <DropdownMenuItem
                        onClick={() => onSelectOrder(order)}
                        className="gap-2 cursor-pointer"
                      >
                        <EyeIcon className="size-4 text-muted-foreground" />
                        View Order Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => window.print()}
                        className="gap-2 cursor-pointer"
                      >
                        <PrinterIcon className="size-4 text-muted-foreground" />
                        Print Manifest Receipt
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate("/dispatcher/live-map")}
                        className="gap-2 cursor-pointer"
                      >
                        <TruckIcon className="size-4 text-muted-foreground" />
                        Track in Live Map
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
