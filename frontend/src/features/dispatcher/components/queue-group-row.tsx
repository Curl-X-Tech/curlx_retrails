import { StorefrontIcon } from "@phosphor-icons/react";
import { TableRow, TableCell } from "@/components/ui/table";
import type { StoreOrderGroup } from "../types";

export function QueueGroupHeaderRow({ group }: { group: StoreOrderGroup }) {
  return (
    <TableRow className="bg-muted/40 hover:bg-muted/40 border-t-2 border-b border-border/70">
      <TableCell
        colSpan={8}
        className="py-2.5 px-4 text-xs font-heading font-bold text-foreground"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StorefrontIcon className="size-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {group.outletId}
            </span>
            <span className="font-heading font-black text-sm text-foreground">
              {group.outletName}
            </span>
            <span className="text-xs font-semibold text-primary">
              Waypoint {group.brand}
            </span>
            <span className="text-muted-foreground text-xs font-normal">
              ({group.orders.length} {group.orders.length === 1 ? "order" : "orders"})
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground font-normal">
            <span>{group.outletAddress}</span>
            <span>•</span>
            <span className="capitalize">{group.dockType.replace("_", " ")}</span>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function QueueGroupTotalRow({ group }: { group: StoreOrderGroup }) {
  return (
    <TableRow className="bg-muted/20 border-b-2 border-border/80 text-xs font-semibold">
      <TableCell className="py-2 px-4 font-bold text-[11px] text-muted-foreground whitespace-nowrap">
        <span className="pl-2">
          TOTAL ({group.totalOrders} {group.totalOrders === 1 ? "order" : "orders"})
        </span>
      </TableCell>

      <TableCell className="py-2 px-4" />

      <TableCell className="text-center font-black text-foreground py-2 px-3 whitespace-nowrap">
        {group.totalPackages} pkgs
      </TableCell>

      <TableCell className="text-right font-black text-foreground py-2 px-4 whitespace-nowrap">
        {group.totalWeightKg.toLocaleString()} kg
      </TableCell>

      <TableCell className="text-right font-black text-foreground py-2 px-4 whitespace-nowrap">
        {group.totalVolumeM3.toFixed(2)} m³
      </TableCell>

      <TableCell className="text-right font-black text-primary py-2 px-4 whitespace-nowrap">
        LKR {group.totalValueLkr.toLocaleString()}
      </TableCell>

      <TableCell className="text-xs font-medium text-muted-foreground py-2 px-4 whitespace-nowrap">
        {group.deliveryWindow}
      </TableCell>

      <TableCell className="py-2 px-4" />
    </TableRow>
  );
}
