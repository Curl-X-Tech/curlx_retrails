import * as React from "react";
import { ArrowsClockwiseIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { AdminCrudShell, DataTable } from "@/components/shared";
import { useItems, useBrands, useActivePrices } from "@/api/master";
import {
  useAdminStore,
  ItemKpiStrip,
  ItemFilterControls,
  getItemColumns,
  ItemDialogs,
  type DialogState,
  type ItemSortKey,
} from "@/features/admin";
import type { MasterItem } from "@/features/admin";
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
  const [dialog, setDialog] = React.useState<DialogState<MasterItem>>(null);

  const {
    data: items = [],
    isLoading: isItemsLoading,
    error: itemsError,
    refetch: refetchItems,
  } = useItems();
  const { data: brands = [], isLoading: isBrandsLoading } = useBrands();
  const { data: activePrices = [], isLoading: isPricesLoading } = useActivePrices();

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
    () =>
      getItemColumns({
        getBrandCode,
        getActivePrice,
        actions: {
          onEdit: (row) => setDialog({ kind: "edit", row }),
          onDelete: (row) => setDialog({ kind: "delete", row }),
        },
      }),
    [getBrandCode, getActivePrice]
  );

  return (
    <AdminCrudShell
      title="Product Catalog & Master SKUs"
      description="Standard unit weights, cargo volumes, valuations, and special handling classifications"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={() => refetchItems()}
          >
            <ArrowsClockwiseIcon className="size-3 text-muted-foreground" />
            <span>Refresh</span>
          </Button>
          <Button
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={() => setDialog({ kind: "create" })}
          >
            <PlusIcon className="size-3" />
            <span>Add Item</span>
          </Button>
        </div>
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
        emptyMessage={
          itemsError
            ? `Failed to load items: ${itemsError.message}`
            : "No product SKUs match your filter criteria."
        }
        keyExtractor={(i) => i.id}
      />
      <ItemDialogs state={dialog} onClose={() => setDialog(null)} />
    </AdminCrudShell>
  );
}

export default AdminItemsPage;
