import * as React from "react";
import { sortItems } from "../admin-utils";
import type { ItemSortKey, MasterItem, MasterBrand, ActivePrice } from "../types";
import type { AdminBrandFilter } from "../store";

interface UseAdminItemsFilterProps {
  items: MasterItem[];
  brands: MasterBrand[];
  activePrices: ActivePrice[];
  selectedBrand: AdminBrandFilter;
  selectedCategory: string;
  coldChainFilter: string;
  searchQuery: string;
  sortKey: ItemSortKey | null;
  sortDirection: "asc" | "desc";
  currentPage: number;
  pageSize?: number;
}

export function useAdminItemsFilter({
  items,
  brands,
  activePrices,
  selectedBrand,
  selectedCategory,
  coldChainFilter,
  searchQuery,
  sortKey,
  sortDirection,
  currentPage,
  pageSize = 15,
}: UseAdminItemsFilterProps) {
  const getBrandCode = React.useCallback(
    (id: string) => brands.find((b: MasterBrand) => b.id === id)?.code || "N/A",
    [brands]
  );
  const getActivePrice = React.useCallback(
    (itemId: string) =>
      activePrices.find((p: ActivePrice) => p.item_id === itemId)?.unit_price ?? null,
    [activePrices]
  );

  const categories = React.useMemo(
    () => Array.from(new Set(items.map((i: MasterItem) => i.category))),
    [items]
  );

  const filteredItems = React.useMemo(() => {
    return items.filter((item: MasterItem) => {
      if (
        selectedBrand !== "ALL" &&
        brands.find((b: MasterBrand) => b.code === selectedBrand)?.id !== item.brand_id
      )
        return false;
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (coldChainFilter === "cold" && !item.requires_cold_chain) return false;
      if (coldChainFilter === "ambient" && item.requires_cold_chain) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [items, brands, selectedBrand, selectedCategory, coldChainFilter, searchQuery]);

  const sortedItems = React.useMemo(
    () => sortItems(filteredItems, sortKey, sortDirection, getBrandCode, getActivePrice),
    [filteredItems, sortKey, sortDirection, getBrandCode, getActivePrice]
  );

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  return {
    getBrandCode,
    getActivePrice,
    categories,
    paginatedItems,
    totalPages,
  };
}
