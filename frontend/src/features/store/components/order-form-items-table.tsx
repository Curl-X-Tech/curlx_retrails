import { PlusIcon, SnowflakeIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { OrderFormItemRow } from "./order-form-item-row";
import type { CatalogProduct, StoreOrderItemRow } from "../types";

interface OrderFormItemsTableProps {
  rows: StoreOrderItemRow[];
  catalogProducts: CatalogProduct[];
  hasColdChain: boolean;
  onUpdateProduct: (rowId: string, product: CatalogProduct) => void;
  onUpdateQuantity: (rowId: string, qty: number) => void;
  onRemoveRow: (rowId: string) => void;
  onAddRow: () => void;
}

export function OrderFormItemsTable({
  rows,
  catalogProducts,
  hasColdChain,
  onUpdateProduct,
  onUpdateQuantity,
  onRemoveRow,
  onAddRow,
}: OrderFormItemsTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-semibold text-sm sm:text-base text-foreground">
            Order Items ({rows.length})
          </h3>
          {hasColdChain && (
            <Badge className="bg-sky-600 text-white text-[10px] font-bold gap-1 shadow-2xs">
              <SnowflakeIcon className="size-3" weight="bold" />
              Reefer Temp Controlled
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddRow}
          className="h-8 text-xs gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
        >
          <PlusIcon className="size-3.5 font-bold" />
          Add Row
        </Button>
      </div>

      <div className="hidden sm:block rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-3"></TableHead>
              <TableHead className="text-xs font-semibold text-foreground min-w-[240px]">
                Item & SKU
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground w-24">
                Unit
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground w-36 text-center">
                Qty
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground w-28 text-right">
                Unit Price
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground w-24 text-right">
                Weight
              </TableHead>
              <TableHead className="text-xs font-semibold text-foreground w-32 text-right pr-4">
                Subtotal (LKR)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-36 text-center text-muted-foreground text-xs"
                >
                  No items in draft. Type in the search box above or click the + button to
                  add products.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <OrderFormItemRow
                  key={row.id}
                  row={row}
                  catalogProducts={catalogProducts}
                  onUpdateProduct={(prod) => onUpdateProduct(row.id, prod)}
                  onUpdateQuantity={(qty) => onUpdateQuantity(row.id, qty)}
                  onRemove={() => onRemoveRow(row.id)}
                />
              ))
            )}
          </TableBody>
        </Table>

        <div className="py-3 bg-muted/10 border-t border-border/50 flex justify-center">
          <button
            type="button"
            onClick={onAddRow}
            className="size-8 rounded-full bg-[#0080FF] hover:bg-[#0070E0] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Add New Row"
          >
            <PlusIcon className="size-4 font-bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
