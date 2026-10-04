import { CaretDownIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CatalogProduct, StoreOrderItemRow } from "../types";

interface ProductChangeDropdownProps {
  row: StoreOrderItemRow;
  catalogProducts: CatalogProduct[];
  onUpdateProduct: (product: CatalogProduct) => void;
}

export function ProductChangeDropdown({
  row,
  catalogProducts,
  onUpdateProduct,
}: ProductChangeDropdownProps) {
  return (
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
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-bold">
                {row.specialHandlingCode}
              </Badge>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground block truncate">
            {row.sku} • {row.category}
          </span>
        </div>
        <CaretDownIcon className="size-3.5 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[320px] p-2 text-xs shadow-lg rounded-xl"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground px-2">
          Change Product
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-60 overflow-y-auto space-y-1">
          {catalogProducts.map((prod) => (
            <DropdownMenuItem
              key={prod.id}
              onClick={() => onUpdateProduct(prod)}
              className="p-2 rounded-lg cursor-pointer flex flex-col items-start gap-0.5"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-foreground truncate">
                  {prod.name}
                </span>
                {prod.specialHandlingCode && (
                  <Badge variant="outline" className="text-[9px] px-1 h-3.5">
                    {prod.specialHandlingCode}
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between w-full text-[11px] text-muted-foreground">
                <span>
                  {prod.sku} • {prod.category}
                </span>
                <span className="font-medium text-foreground">
                  LKR {prod.unitPriceLkr.toLocaleString()}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
