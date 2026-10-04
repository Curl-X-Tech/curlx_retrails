import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { QueuedOrderItem } from "@/types";

interface OrderDetailItemsTableProps {
  items: QueuedOrderItem[];
}

export function OrderDetailItemsTable({ items }: OrderDetailItemsTableProps) {
  const totalUnits = items.reduce((s, i) => s + i.requestedQty, 0);

  return (
    <div className="border border-border/80 rounded-xl overflow-hidden bg-background">
      <div className="p-3 bg-muted/40 border-b border-border/60 flex items-center justify-between">
        <span className="font-heading font-bold text-xs text-foreground tracking-tight">
          Package Line Items ({items.length})
        </span>
        <span className="text-[11px] text-muted-foreground">
          Total Units: {totalUnits}
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border/60 bg-muted/20">
            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase h-9 px-4">
              Package Code
            </TableHead>
            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase h-9 px-4">
              Item SKU & Description
            </TableHead>
            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-center h-9 px-3">
              Qty
            </TableHead>
            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right h-9 px-3">
              Weight
            </TableHead>
            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right h-9 px-3">
              Volume
            </TableHead>
            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right h-9 px-4">
              Total (LKR)
            </TableHead>
            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-center h-9 px-3">
              SHC
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="border-border/40 text-xs">
              <TableCell className="font-bold text-foreground py-2.5 px-4 whitespace-nowrap">
                {item.packageCode}
              </TableCell>
              <TableCell className="py-2.5 px-4 max-w-[220px]">
                <div className="font-medium text-foreground truncate">
                  {item.itemName}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {item.category} • {item.itemId}
                </div>
              </TableCell>
              <TableCell className="text-center font-bold text-foreground py-2.5 px-3 whitespace-nowrap">
                {item.requestedQty}
              </TableCell>
              <TableCell className="text-right font-medium text-foreground py-2.5 px-3 whitespace-nowrap">
                {item.totalWeightKg.toFixed(1)} kg
              </TableCell>
              <TableCell className="text-right font-medium text-foreground py-2.5 px-3 whitespace-nowrap">
                {item.totalVolumeM3.toFixed(2)} m³
              </TableCell>
              <TableCell className="text-right font-bold text-foreground py-2.5 px-4 whitespace-nowrap">
                {item.totalPriceLkr.toLocaleString()}
              </TableCell>
              <TableCell className="text-center py-2.5 px-3 whitespace-nowrap">
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-muted rounded border border-border/80 text-foreground">
                  {item.specialHandlingCode}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
