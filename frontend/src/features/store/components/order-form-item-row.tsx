import { TrashIcon, CaretDownIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CatalogProduct, StoreOrderItemRow } from "../types";

interface OrderFormItemRowProps {
  row: StoreOrderItemRow;
  catalogProducts: CatalogProduct[];
  isSelected: boolean;
  onToggleSelect: () => void;
  onUpdateProduct: (product: CatalogProduct) => void;
  onUpdateQuantity: (qty: number) => void;
  onRemove: () => void;
}

export function OrderFormItemRow({
  row,
  catalogProducts,
  isSelected,
  onToggleSelect,
  onUpdateProduct,
  onUpdateQuantity,
  onRemove,
}: OrderFormItemRowProps) {
  return (
    <TableRow className="hover:bg-muted/15 transition-colors">
      <TableCell className="px-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
        />
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="w-full text-left p-1.5 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
              />
            }
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                  {row.name}
                </span>
                {row.specialHandlingCode && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-700 dark:text-amber-300">
                    {row.specialHandlingCode}
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground block truncate">{row.sku} • {row.category}</span>
            </div>
            <CaretDownIcon className="size-3.5 text-muted-foreground shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[320px] p-2 text-xs shadow-lg rounded-xl">
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2">Change Product</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {catalogProducts.map((prod) => (
                <DropdownMenuItem
                  key={prod.id}
                  onClick={() => onUpdateProduct(prod)}
                  className="p-2 rounded-lg cursor-pointer flex flex-col items-start gap-0.5"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-foreground truncate">{prod.name}</span>
                    {prod.specialHandlingCode && (
                      <Badge variant="outline" className="text-[9px] px-1 h-3.5">{prod.specialHandlingCode}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full text-[11px] text-muted-foreground">
                    <span>{prod.sku} • {prod.category}</span>
                    <span className="font-medium text-foreground">LKR {prod.unitPriceLkr.toLocaleString()}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
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
      <TableCell className="text-right text-xs text-muted-foreground font-medium">
        LKR {row.unitPriceLkr.toLocaleString()}
      </TableCell>
      <TableCell className="text-right text-xs text-muted-foreground font-medium">
        {row.totalWeightKg.toFixed(1)} kg
      </TableCell>
      <TableCell className="text-right text-xs font-bold text-foreground">
        LKR {row.totalPriceLkr.toLocaleString()}
      </TableCell>
      <TableCell className="text-right pr-3">
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          title="Remove item"
        >
          <TrashIcon className="size-4" />
        </button>
      </TableCell>
    </TableRow>
  );
}
