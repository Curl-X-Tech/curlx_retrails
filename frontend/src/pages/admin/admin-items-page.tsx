import * as React from "react";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { AdminCrudShell, DataTable } from "@/components/shared";
import {
  useAdminItems,
  useAdminBrands,
  useAdminActivePrices,
  useAdminStore,
  ItemKpiStrip,
  ItemFilterControls,
  getItemColumns,
  type ItemSortKey,
} from "@/features/admin";
import { useAdminItemsFilter } from "@/features/admin/hooks/use-admin-items-filter";

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

  const { getBrandCode, getActivePrice, categories, paginatedItems, totalPages } =
    useAdminItemsFilter({
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
      pageSize,
    });

  const columns = React.useMemo(
    () => getItemColumns({ getBrandCode, getActivePrice }),
    [getBrandCode, getActivePrice]
  );

  return (
    <AdminCrudShell
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
      kpi={<ItemKpiStrip items={items} categoriesCount={categories.length} />}
      search={searchQuery}
      onSearchChange={(val) => {
        setSearchQuery(val);
        setCurrentPage(1);
      }}
      searchPlaceholder="Search by SKU, product name, or category..."
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
      onResetFilters={() => {
        setSearchQuery("");
        setSelectedBrand("ALL");
        setSelectedCategory("all");
        setColdChainFilter("all");
        setCurrentPage(1);
      }}
      activeFilterCount={
        (selectedBrand !== "ALL" ? 1 : 0) +
        (selectedCategory !== "all" ? 1 : 0) +
        (coldChainFilter !== "all" ? 1 : 0)
      }
    >
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
    </AdminCrudShell>
  );
}

export default AdminItemsPage;
