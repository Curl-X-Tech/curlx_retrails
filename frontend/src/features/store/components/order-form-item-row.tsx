import { TrashIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { TableRow, TableCell } from "@/components/ui/table";
import { ProductChangeDropdown } from "./product-change-dropdown";
import type { CatalogProduct, StoreOrderItemRow } from "../types";

interface OrderFormItemRowProps {
  row: StoreOrderItemRow;
  catalogProducts: CatalogProduct[];
  onUpdateProduct: (product: CatalogProduct) => void;
  onUpdateQuantity: (qty: number) => void;
  onRemove: () => void;
}

export function OrderFormItemRow({
  row,
  catalogProducts,
  onUpdateProduct,
  onUpdateQuantity,
  onRemove,
}: OrderFormItemRowProps) {
  return (
    <TableRow className="hover:bg-muted/15 transition-colors">
      <TableCell className="px-3 w-10">
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
          title="Remove item"
        >
          <TrashIcon className="size-4" />
        </button>
      </TableCell>
      <TableCell>
        <ProductChangeDropdown
          row={row}
          catalogProducts={catalogProducts}
          onUpdateProduct={onUpdateProduct}
        />
      </TableCell>
      <TableCell>
        <span className="px-2 py-1 rounded-md bg-muted/40 border border-border text-xs font-semibold text-muted-foreground inline-block">
          {row.unit}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onUpdateQuantity(row.quantity - 1)}
            className="size-7 rounded-lg bg-muted/40 hover:bg-muted text-foreground font-bold flex items-center justify-center transition-colors cursor-pointer text-xs"
          >
            -
          </button>
          <Input
            type="number"
            min={1}
            value={row.quantity}
            onChange={(e) => onUpdateQuantity(parseInt(e.target.value, 10) || 1)}
            className="h-7 w-14 text-center text-xs rounded-lg bg-muted/30 border-border font-bold p-0"
          />
          <button
            type="button"
            onClick={() => onUpdateQuantity(row.quantity + 1)}
            className="size-7 rounded-lg bg-muted/40 hover:bg-muted text-foreground font-bold flex items-center justify-center transition-colors cursor-pointer text-xs"
          >
            +
          </button>
        </div>
      </TableCell>
      <TableCell className="text-right text-xs text-muted-foreground font-medium tabular-nums">
        LKR {row.unitPriceLkr.toLocaleString()}
      </TableCell>
      <TableCell className="text-right text-xs text-muted-foreground font-medium tabular-nums">
        {row.totalWeightKg.toFixed(1)} kg
      </TableCell>
      <TableCell className="text-right text-xs font-bold text-foreground tabular-nums pr-4">
        LKR {row.totalPriceLkr.toLocaleString()}
      </TableCell>
    </TableRow>
  );
}
