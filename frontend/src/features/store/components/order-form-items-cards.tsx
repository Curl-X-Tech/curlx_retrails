import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StoreOrderItemRow } from "../types";

interface OrderFormItemsCardsProps {
  rows: StoreOrderItemRow[];
  onUpdateQuantity: (rowId: string, qty: number) => void;
  onRemoveRow: (rowId: string) => void;
  onAddRow: () => void;
}

export function OrderFormItemsCards({
  rows,
  onUpdateQuantity,
  onRemoveRow,
  onAddRow,
}: OrderFormItemsCardsProps) {
  return (
    <div className="sm:hidden space-y-3">
      {rows.map((row) => (
        <Card
          key={row.id}
          className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs text-foreground truncate">{row.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {row.sku} • {row.category}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemoveRow(row.id)}
              className="p-1 text-muted-foreground hover:text-destructive"
            >
              <TrashIcon className="size-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-[11px]">Qty:</span>
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(row.id, row.quantity - 1)}
                  className="px-2.5 py-1 bg-muted/40 hover:bg-muted text-xs font-bold"
                >
                  -
                </button>
                <span className="px-3 py-1 font-semibold text-xs bg-background">
                  {row.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(row.id, row.quantity + 1)}
                  className="px-2.5 py-1 bg-muted/40 hover:bg-muted text-xs font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-muted-foreground text-[11px] font-semibold">
                {row.unit}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block">
                {row.totalWeightKg.toFixed(1)} kg
              </span>
              <span className="font-bold text-xs text-foreground">
                LKR {row.totalPriceLkr.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      ))}

      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          onClick={onAddRow}
          className="w-full py-2.5 text-xs gap-2 rounded-xl border-dashed border-primary/40 text-primary font-semibold"
        >
          <PlusIcon className="size-4" />
          Add Another Item
        </Button>
      </div>
    </div>
  );
}
