import * as React from "react";
import {
  MagnifyingGlassIcon,
  ArrowsClockwiseIcon,
  SnowflakeIcon,
  PackageIcon,
  FunnelIcon,
  ScalesIcon,
  CaretUpDownIcon,
  CaretUpIcon,
  CaretDownIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import {
  useMasterItems,
  useMasterBrands,
  useActivePrices,
  type MasterItem,
} from "@/hooks/use-master-data";
import { useAdminStore } from "@/stores/use-admin-store";

type SortKey = "sku" | "name" | "brand" | "category" | "weight" | "volume" | "price";

function SortHeaderIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) {
  if (!active) {
    return (
      <CaretUpDownIcon className="size-3 text-muted-foreground/40 shrink-0 ml-0.5" />
    );
  }
  return direction === "asc" ? (
    <CaretUpIcon className="size-3 text-primary shrink-0 ml-0.5 font-bold" />
  ) : (
    <CaretDownIcon className="size-3 text-primary shrink-0 ml-0.5 font-bold" />
  );
}

export function AdminItemsPage() {
  const { selectedBrand, setSelectedBrand } = useAdminStore();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [coldChainFilter, setColdChainFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey | null>("sku");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const pageSize = 15;

  const {
    data: items,
    isLoading: isItemsLoading,
    refetch: refetchItems,
  } = useMasterItems();
  const { data: brands, isLoading: isBrandsLoading } = useMasterBrands();
  const { data: activePrices, isLoading: isPricesLoading } = useActivePrices();

  const isLoading = isItemsLoading || isBrandsLoading || isPricesLoading;

  const getBrandCode = React.useCallback(
    (brandId: string) => {
      const b = brands?.find((br) => br.id === brandId);
      return b ? b.code : "N/A";
    },
    [brands]
  );

  const getActivePrice = React.useCallback(
    (itemId: string) => {
      const p = activePrices?.find((pr) => pr.item_id === itemId);
      return p ? p.unit_price : null;
    },
    [activePrices]
  );

  const categories = React.useMemo(() => {
    if (!items) return [];
    const set = new Set(items.map((i) => i.category));
    return Array.from(set);
  }, [items]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const filteredItems = React.useMemo(() => {
    if (!items) return [];
    let list = items.filter((item) => {
      // Brand filter
      if (selectedBrand !== "ALL") {
        const b = brands?.find((br) => br.code === selectedBrand);
        if (b && item.brand_id !== b.id) return false;
      }
      // Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      // Cold chain filter
      if (coldChainFilter === "cold" && !item.requires_cold_chain) return false;
      if (coldChainFilter === "ambient" && item.requires_cold_chain) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSku = item.sku.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesCat) return false;
      }
      return true;
    });

    if (sortKey) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortKey === "sku") {
          cmp = a.sku.localeCompare(b.sku);
        } else if (sortKey === "name") {
          cmp = a.name.localeCompare(b.name);
        } else if (sortKey === "brand") {
          cmp = getBrandCode(a.brand_id).localeCompare(getBrandCode(b.brand_id));
        } else if (sortKey === "category") {
          cmp = a.category.localeCompare(b.category);
        } else if (sortKey === "weight") {
          cmp = a.unit_weight_kg - b.unit_weight_kg;
        } else if (sortKey === "volume") {
          cmp = a.unit_volume_m3 - b.unit_volume_m3;
        } else if (sortKey === "price") {
          const priceA = getActivePrice(a.id) ?? 0;
          const priceB = getActivePrice(b.id) ?? 0;
          cmp = priceA - priceB;
        }
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [
    items,
    brands,
    selectedBrand,
    selectedCategory,
    coldChainFilter,
    searchQuery,
    sortKey,
    sortDirection,
    getBrandCode,
    getActivePrice,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const coldChainCount = React.useMemo(() => {
    return items?.filter((i) => i.requires_cold_chain).length ?? 0;
  }, [items]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* 1. Header Bar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
            Product Catalog & Master SKUs
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Standard unit weights, cargo volumes, valuations, and special handling
            classifications
          </p>
        </div>

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
        </div>
      </div>

      {/* 2. KPI Summary Strip */}
      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <PackageIcon className="size-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground text-[11px]">Total SKUs:</span>
          <span className="font-bold text-foreground text-[11px]">
            {items?.length ?? 0}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <SnowflakeIcon className="size-3.5 text-sky-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Cold Chain SKUs:</span>
          <span className="font-bold text-foreground text-[11px]">{coldChainCount}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border/50 rounded-lg shadow-2xs">
          <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground text-[11px]">Categories:</span>
          <span className="font-bold text-foreground text-[11px]">
            {categories.length}
          </span>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by SKU, product name, or category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-7 h-7 text-xs bg-card"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Brand Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="xs"
                  className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
                />
              }
            >
              <FunnelIcon className="size-3 text-muted-foreground" />
              <span>Brand: {selectedBrand === "ALL" ? "All Brands" : selectedBrand}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Filter Brand</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={selectedBrand}
                onValueChange={(val) => {
                  setSelectedBrand((val as "ALL" | "FRESH" | "STYLE" | "TECH") || "ALL");
                  setCurrentPage(1);
                }}
              >
                <DropdownMenuRadioItem value="ALL" className="text-xs">
                  All Brands
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="FRESH" className="text-xs">
                  Fresh
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="STYLE" className="text-xs">
                  Style
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="TECH" className="text-xs">
                  Tech
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="xs"
                  className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
                />
              }
            >
              <FunnelIcon className="size-3 text-muted-foreground" />
              <span className="capitalize">
                Category: {selectedCategory === "all" ? "All" : selectedCategory}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs">Filter Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={selectedCategory}
                onValueChange={(val) => {
                  setSelectedCategory(val ?? "all");
                  setCurrentPage(1);
                }}
              >
                <DropdownMenuRadioItem value="all" className="text-xs">
                  All Categories
                </DropdownMenuRadioItem>
                {categories.map((cat) => (
                  <DropdownMenuRadioItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cold Chain Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="xs"
                  className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
                />
              }
            >
              <SnowflakeIcon className="size-3 text-muted-foreground" />
              <span className="capitalize">
                Temp:{" "}
                {coldChainFilter === "all"
                  ? "All"
                  : coldChainFilter === "cold"
                    ? "Cold Chain"
                    : "Ambient"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Filter Temp</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={coldChainFilter}
                onValueChange={(val) => {
                  setColdChainFilter(val ?? "all");
                  setCurrentPage(1);
                }}
              >
                <DropdownMenuRadioItem value="all" className="text-xs">
                  All Items
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="cold" className="text-xs">
                  Cold Chain
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ambient" className="text-xs">
                  Ambient
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 4. Table Container */}
      <div className="flex-1 min-h-0 margin-responsive py-3 sm:py-4 overflow-hidden flex flex-col">
        {isLoading ? (
          <TableSkeleton columns={7} rowCount={8} />
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PackageIcon className="size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">
              No matching catalog SKUs found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              No product items match your current filter and search parameters.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-xs"
              onClick={() => {
                setSearchQuery("");
                setSelectedBrand("ALL");
                setSelectedCategory("all");
                setColdChainFilter("all");
                setCurrentPage(1);
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
            {/* Top Table Bar with Count & Top Pagination */}
            <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="text-muted-foreground text-[11px]">
                Showing{" "}
                <span className="font-bold text-foreground">
                  {filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-foreground">
                  {Math.min(currentPage * pageSize, filteredItems.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-foreground">{filteredItems.length}</span>{" "}
                catalog SKUs
              </div>

              {/* Standard Pagination Controls */}
              {totalPages > 1 && (
                <Pagination className="mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage <= 1}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
                      )
                      .map((page, idx, arr) => (
                        <React.Fragment key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <PaginationItem>
                              <span className="px-1 text-muted-foreground text-xs">
                                ...
                              </span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              isActive={currentPage === page}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage >= totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>

            <TooltipProvider delay={100}>
              <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <TableHeader className="sticky top-0 z-20 bg-card shadow-2xs border-b border-border/80">
                    <TableRow className="border-b border-border/80 hover:bg-transparent">
                      <TableHead
                        className="w-[240px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs pl-4"
                        onClick={() => handleSort("sku")}
                      >
                        <div className="flex items-center gap-1">
                          <span>SKU & Product Name</span>
                          <SortHeaderIcon
                            active={sortKey === "sku" || sortKey === "name"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[110px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("brand")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Brand</span>
                          <SortHeaderIcon
                            active={sortKey === "brand"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[140px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("category")}
                      >
                        <div className="flex items-center gap-1">
                          <span>Category</span>
                          <SortHeaderIcon
                            active={sortKey === "category"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[120px] text-right cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("weight")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Unit Weight</span>
                          <SortHeaderIcon
                            active={sortKey === "weight"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead
                        className="w-[120px] text-right cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
                        onClick={() => handleSort("volume")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Unit Volume</span>
                          <SortHeaderIcon
                            active={sortKey === "volume"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>

                      <TableHead className="w-[130px] font-bold text-foreground text-xs">
                        Handling Code
                      </TableHead>

                      <TableHead
                        className="w-[140px] text-right cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs pr-4"
                        onClick={() => handleSort("price")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Active Price</span>
                          <SortHeaderIcon
                            active={sortKey === "price"}
                            direction={sortDirection}
                          />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedItems.map((item: MasterItem) => {
                      const activePrice = getActivePrice(item.id);

                      return (
                        <TableRow
                          key={item.id}
                          className="border-border/30 hover:bg-muted/30 transition-colors text-xs"
                        >
                          <TableCell className="font-bold text-foreground py-2.5 pl-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {item.requires_cold_chain ? (
                                <SnowflakeIcon
                                  weight="bold"
                                  className="size-3.5 text-sky-600 shrink-0"
                                />
                              ) : (
                                <PackageIcon className="size-3.5 text-muted-foreground shrink-0" />
                              )}
                              <div>
                                <div className="font-bold text-xs text-foreground">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {item.sku} ({item.unit})
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-2.5 whitespace-nowrap">
                            <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {getBrandCode(item.brand_id)}
                            </span>
                          </TableCell>

                          <TableCell className="py-2.5 text-xs text-foreground whitespace-nowrap">
                            {item.category}
                          </TableCell>

                          <TableCell className="text-right py-2.5 text-xs font-semibold text-foreground whitespace-nowrap">
                            {item.unit_weight_kg.toFixed(2)} kg
                          </TableCell>

                          <TableCell className="text-right py-2.5 text-xs font-medium text-foreground whitespace-nowrap">
                            {item.unit_volume_m3.toFixed(3)} m³
                          </TableCell>

                          <TableCell className="py-2.5 whitespace-nowrap">
                            {item.special_handling_code ? (
                              <span className="px-2 py-0.5 rounded bg-muted border border-border/70 text-[10px] font-bold text-foreground uppercase tracking-wide">
                                {item.special_handling_code}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Standard
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="pr-4 py-2.5 text-right font-bold text-xs text-foreground whitespace-nowrap">
                            {activePrice !== null ? (
                              <span className="text-primary font-bold">
                                LKR {activePrice.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs font-normal">
                                N/A
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </table>
              </div>
            </TooltipProvider>

            {/* Bottom Pagination Bar */}
            <div className="px-4 py-2 bg-muted/20 border-t border-border/50 shrink-0 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">
                Page {currentPage} of {totalPages}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-6 text-[11px] px-2 cursor-pointer"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-6 text-[11px] px-2 cursor-pointer"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AdminItemsPage;
