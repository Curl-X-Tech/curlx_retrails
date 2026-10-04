import { Badge } from "@/components/ui/badge";
import type { StoreOrderItemRow } from "../types";

interface OrderDetailItemsTableProps {
  isLoading: boolean;
  items: StoreOrderItemRow[];
}

export function OrderDetailItemsTable({ isLoading, items }: OrderDetailItemsTableProps) {
  if (isLoading) {
    return (
      <p className="text-xs text-muted-foreground py-8 text-center">
        Loading line items...
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground rounded-xl border border-border bg-muted/20">
        No itemized packages available.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/80 overflow-hidden bg-card shadow-2xs">
      <table className="w-full text-xs">
        <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border/60">
          <tr>
            <th className="text-left p-3 font-semibold">Item & SKU</th>
            <th className="text-left p-3 font-semibold">Category</th>
            <th className="text-right p-3 font-semibold">Qty</th>
            <th className="text-right p-3 font-semibold">Unit Price</th>
            <th className="text-right p-3 font-semibold">Weight</th>
            <th className="text-right p-3 font-semibold pr-4">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {items.map((item, idx) => (
            <tr key={item.id || idx} className="hover:bg-muted/20 transition-colors">
              <td className="p-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-foreground">{item.name}</span>
                  {item.specialHandlingCode && (
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 h-4 font-mono font-bold"
                    >
                      {item.specialHandlingCode}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {item.sku}
                </span>
              </td>
              <td className="p-3 text-muted-foreground">{item.category || "General"}</td>
              <td className="p-3 text-right">
                <span className="font-bold text-foreground bg-muted/50 px-2 py-0.5 rounded-md tabular-nums">
                  {item.quantity}
                </span>
              </td>
              <td className="p-3 text-right tabular-nums text-muted-foreground">
                LKR {item.unitPriceLkr.toLocaleString()}
              </td>
              <td className="p-3 text-right tabular-nums text-muted-foreground">
                {item.totalWeightKg.toFixed(1)} kg
              </td>
              <td className="p-3 text-right font-bold text-foreground tabular-nums pr-4">
                LKR {item.totalPriceLkr.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-muted/30 border-t border-border font-semibold text-xs">
          <tr>
            <td colSpan={2} className="p-3 text-foreground font-bold">
              Total Order Manifest
            </td>
            <td className="p-3 text-right font-bold text-foreground tabular-nums">
              {items.reduce((sum, i) => sum + i.quantity, 0)}
            </td>
            <td className="p-3"></td>
            <td className="p-3 text-right font-bold text-foreground tabular-nums">
              {items.reduce((sum, i) => sum + i.totalWeightKg, 0).toFixed(1)} kg
            </td>
            <td className="p-3 text-right font-extrabold text-primary tabular-nums pr-4">
              LKR {items.reduce((sum, i) => sum + i.totalPriceLkr, 0).toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
