import * as React from "react";
import { MagnifyingGlassIcon, PlusIcon, SparkleIcon, XIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CatalogProduct } from "../types";

interface OrderFormCatalogSearchProps {
  catalogSearch: string;
  onChangeCatalogSearch: (value: string) => void;
  isSearchingCatalog: boolean;
  setIsSearchingCatalog: (searching: boolean) => void;
  searchResults: CatalogProduct[];
  catalogProducts: CatalogProduct[];
  onAddProduct: (product: CatalogProduct, qty?: number) => void;
}

export function OrderFormCatalogSearch({
  catalogSearch,
  onChangeCatalogSearch,
  isSearchingCatalog,
  setIsSearchingCatalog,
  searchResults,
  catalogProducts,
  onAddProduct,
}: OrderFormCatalogSearchProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          type="text"
          value={catalogSearch}
          onFocus={() => setIsSearchingCatalog(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchResults.length > 0) {
              e.preventDefault();
              onAddProduct(searchResults[0], 10);
            }
          }}
          onChange={(e) => {
            onChangeCatalogSearch(e.target.value);
            setIsSearchingCatalog(true);
          }}
          placeholder="Search product catalog to add items (e.g. Milk, Strawberries, Salmon, Bread)..."
          className="pl-10 pr-9 h-11 text-xs rounded-xl bg-card border-border shadow-2xs focus-visible:ring-primary"
        />
        {catalogSearch && (
          <button
            type="button"
            onClick={() => {
              onChangeCatalogSearch("");
              setIsSearchingCatalog(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <XIcon className="size-4" />
          </button>
        )}

        {isSearchingCatalog && catalogSearch.trim().length > 0 && (
          <Card className="absolute top-full mt-1.5 left-0 right-0 z-30 p-2 shadow-xl rounded-xl border border-border bg-card max-h-64 overflow-y-auto">
            {searchResults.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center">
                No matching catalog products found.
              </p>
            ) : (
              searchResults.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => onAddProduct(prod, 10)}
                  className="p-2.5 rounded-lg hover:bg-muted/60 transition-colors flex items-center justify-between gap-3 cursor-pointer text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">
                        {prod.name}
                      </span>
                      {prod.specialHandlingCode && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                          {prod.specialHandlingCode}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {prod.sku} • {prod.category} • {prod.unitWeightKg} kg/{prod.unit}
                    </span>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <span className="font-bold text-foreground">
                      LKR {prod.unitPriceLkr.toLocaleString()}
                    </span>
                    <Button
                      size="sm"
                      className="h-7 text-xs px-2.5 rounded-lg gap-1 cursor-pointer"
                    >
                      <PlusIcon className="size-3 font-bold" />
                      Add
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Card>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-[11px] font-medium flex items-center gap-1 mr-1">
          <SparkleIcon className="size-3.5 text-amber-500" />
          Frequently ordered:
        </span>
        {catalogProducts.slice(0, 6).map((prod) => (
          <button
            key={prod.id}
            type="button"
            onClick={() => onAddProduct(prod, 10)}
            className="px-2.5 py-1 rounded-lg bg-card hover:bg-muted border border-border/80 text-[11px] font-medium text-foreground transition-all cursor-pointer flex items-center gap-1 shadow-2xs hover:border-primary/40"
          >
            <PlusIcon className="size-3 text-primary" />
            <span>{prod.name.split("(")[0].trim()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
