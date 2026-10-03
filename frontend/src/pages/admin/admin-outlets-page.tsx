import * as React from "react";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader, FilterBar, DataTable } from "@/components/shared";
import {
  useAdminOutlets,
  useAdminBrands,
  useAdminDepots,
  useAdminDistricts,
  useAdminStore,
  OutletKpiStrip,
  OutletFilterControls,
  getOutletColumns,
  sortOutlets,
  type OutletSortKey,
  type MasterOutlet,
  type MasterBrand,
  type MasterDepot,
  type MasterDistrict,
} from "@/features/admin";

export function AdminOutletsPage() {
  const { selectedHub, setSelectedHub, selectedBrand, setSelectedBrand } = useAdminStore();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dockFilter, setDockFilter] = React.useState("all");
  const [constraintFilter, setConstraintFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<OutletSortKey | null>("outletId");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 15;

  const { data: outlets = [], isLoading: isOutletsLoading, refetch: refetchOutlets } = useAdminOutlets();
  const { data: brands = [], isLoading: isBrandsLoading } = useAdminBrands();
  const { data: depots = [], isLoading: isDepotsLoading } = useAdminDepots();
  const { data: districts = [], isLoading: isDistrictsLoading } = useAdminDistricts();
  const isLoading = isOutletsLoading || isBrandsLoading || isDepotsLoading || isDistrictsLoading;

  const getBrandCode = React.useCallback(
    (id: string) => brands.find((b: MasterBrand) => b.id === id)?.code || "N/A",
    [brands]
  );
  const getDepotCode = React.useCallback(
    (id: string) => depots.find((d: MasterDepot) => d.id === id)?.code || "N/A",
    [depots]
  );
  const getDistrictName = React.useCallback(
    (id: string) => districts.find((d: MasterDistrict) => d.id === id)?.name || "Unknown",
    [districts]
  );

  const filteredOutlets = React.useMemo(() => {
    return outlets.filter((o: MasterOutlet) => {
      if (selectedHub !== "ALL" && depots.find((d: MasterDepot) => d.code === selectedHub)?.id !== o.depot_id) return false;
      if (selectedBrand !== "ALL" && brands.find((b: MasterBrand) => b.code === selectedBrand)?.id !== o.brand_id) return false;
      if (dockFilter !== "all" && o.dock_type !== dockFilter) return false;
      if (constraintFilter !== "all" && o.parking_constraint !== constraintFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return o.name.toLowerCase().includes(q) || o.outlet_id.toLowerCase().includes(q) || getDistrictName(o.district_id).toLowerCase().includes(q);
    });
  }, [outlets, depots, brands, selectedHub, selectedBrand, dockFilter, constraintFilter, searchQuery, getDistrictName]);

  const sortedOutlets = React.useMemo(
    () => sortOutlets(filteredOutlets, sortKey, sortDirection, getBrandCode, getDistrictName),
    [filteredOutlets, sortKey, sortDirection, getBrandCode, getDistrictName]
  );

  const totalPages = Math.max(1, Math.ceil(sortedOutlets.length / pageSize));
  const paginatedOutlets = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedOutlets.slice(start, start + pageSize);
  }, [sortedOutlets, currentPage, pageSize]);

  const columns = React.useMemo(() => getOutletColumns({ getBrandCode, getDepotCode, getDistrictName }), [getBrandCode, getDepotCode, getDistrictName]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card">
        <PageHeader
          className="mb-0"
          title="Retail Outlets Directory"
          description="Store delivery windows, unloading dock configurations, and vehicle access limits"
          actions={
            <Button variant="outline" size="xs" className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg" onClick={() => refetchOutlets()}>
              <ArrowsClockwiseIcon className="size-3 text-muted-foreground" />
              <span>Refresh</span>
            </Button>
          }
        />
      </div>

      <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20">
        <OutletKpiStrip outlets={outlets} />
      </div>

      <div className="flex-1 p-4 sm:p-6 flex flex-col min-h-0 space-y-3 overflow-hidden">
        <FilterBar
          search={searchQuery}
          onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
          placeholder="Search outlet ID, store name, district..."
          filters={
            <OutletFilterControls
              selectedHub={selectedHub}
              onHubChange={(h) => { setSelectedHub(h); setCurrentPage(1); }}
              selectedBrand={selectedBrand}
              onBrandChange={(b) => { setSelectedBrand(b); setCurrentPage(1); }}
              dockFilter={dockFilter}
              onDockChange={(d) => { setDockFilter(d); setCurrentPage(1); }}
              constraintFilter={constraintFilter}
              onConstraintChange={(c) => { setConstraintFilter(c); setCurrentPage(1); }}
            />
          }
          onReset={() => {
            setSearchQuery(""); setSelectedHub("ALL"); setSelectedBrand("ALL"); setDockFilter("all"); setConstraintFilter("all"); setCurrentPage(1);
          }}
          activeCount={(selectedHub !== "ALL" ? 1 : 0) + (selectedBrand !== "ALL" ? 1 : 0) + (dockFilter !== "all" ? 1 : 0) + (constraintFilter !== "all" ? 1 : 0)}
        />

        <DataTable
          columns={columns}
          data={paginatedOutlets}
          isLoading={isLoading}
          sortKey={sortKey || undefined}
          sortDirection={sortDirection}
          onSort={(key) => {
            if (sortKey === key) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
            else { setSortKey(key as OutletSortKey); setSortDirection("asc"); }
          }}
          pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
          emptyMessage="No matching retail outlets found."
          keyExtractor={(o) => o.id}
        />
      </div>
    </div>
  );
}

export default AdminOutletsPage;
