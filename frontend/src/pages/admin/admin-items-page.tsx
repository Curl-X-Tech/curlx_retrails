import * as React from "react";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader, FilterBar, DataTable } from "@/components/shared";
import {
  useAdminItems,
  useAdminBrands,
  useAdminActivePrices,
  useAdminStore,
  ItemKpiStrip,
  ItemFilterControls,
  getItemColumns,
  sortItems,
  type ItemSortKey,
  type MasterItem,
  type MasterBrand,
  type ActivePrice,
} from "@/features/admin";

export function AdminItemsPage() {
  const { selectedBrand, setSelectedBrand } = useAdminStore();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [coldChainFilter, setColdChainFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<ItemSortKey | null>("sku");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 15;

  const {
    data: items = [],
    isLoading: isItemsLoading,
    refetch: refetchItems,
  } = useAdminItems();
  const { data: brands = [], isLoading: isBrandsLoading } = useAdminBrands();
  const { data: activePrices = [], isLoading: isPricesLoading } = useAdminActivePrices();
  const isLoading = isItemsLoading || isBrandsLoading || isPricesLoading;

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

  const columns = React.useMemo(
    () => getItemColumns({ getBrandCode, getActivePrice }),
    [getBrandCode, getActivePrice]
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card">
        <PageHeader
          className="mb-0"
          title="Product Catalog & Master SKUs"
          description="Standard unit weights, cargo volumes, valuations, and special handling classifications"
          actions={
            <Button
              variant="outline"
              size="xs"
              className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
              onClick={() => refetchItems()}
            >
              <ArrowsClockwiseIcon className="size-3 text-muted-foreground" />
              <span>Refresh</span>
            </Button>
          }
        />
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20">
        <ItemKpiStrip items={items} categoriesCount={categories.length} />
      </div>

      <div className="flex-1 p-4 sm:p-6 flex flex-col min-h-0 space-y-3 overflow-hidden">
        <FilterBar
          search={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          placeholder="Search by SKU, product name, or category..."
          filters={
            <ItemFilterControls
              selectedBrand={selectedBrand}
              onBrandChange={(b) => {
                setSelectedBrand(b);
                setCurrentPage(1);
              }}
              selectedCategory={selectedCategory}
              onCategoryChange={(c) => {
                setSelectedCategory(c);
                setCurrentPage(1);
              }}
              categories={categories}
              coldChainFilter={coldChainFilter}
              onColdChainChange={(f) => {
                setColdChainFilter(f);
                setCurrentPage(1);
              }}
            />
          }
          onReset={() => {
            setSearchQuery("");
            setSelectedBrand("ALL");
            setSelectedCategory("all");
            setColdChainFilter("all");
            setCurrentPage(1);
          }}
          activeCount={
            (selectedBrand !== "ALL" ? 1 : 0) +
            (selectedCategory !== "all" ? 1 : 0) +
            (coldChainFilter !== "all" ? 1 : 0)
          }
        />

        <DataTable
          columns={columns}
          data={paginatedItems}
          isLoading={isLoading}
          sortKey={sortKey || undefined}
          sortDirection={sortDirection}
          onSort={(key) => {
            if (sortKey === key)
              setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
            else {
              setSortKey(key as ItemSortKey);
              setSortDirection("asc");
            }
          }}
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
          emptyMessage="No product SKUs match your filter criteria."
          keyExtractor={(i) => i.id}
        />
      </div>
    </div>
  );
}

export default AdminItemsPage;
