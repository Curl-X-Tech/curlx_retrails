import * as React from "react";
import { ArrowsClockwiseIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { AdminCrudShell, DataTable } from "@/components/shared";
import { useOutlets, useBrands, useDepots, useDistricts } from "@/api/master";
import {
  useAdminStore,
  OutletKpiStrip,
  OutletFilterControls,
  getOutletColumns,
  OutletDialogs,
  type DialogState,
  type MasterOutlet,
  type OutletSortKey,
} from "@/features/admin";
import { useAdminOutletsFilter } from "@/features/admin/hooks/use-admin-outlets-filter";

export function AdminOutletsPage() {
  const { selectedHub, setSelectedHub, selectedBrand, setSelectedBrand } =
    useAdminStore();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dockFilter, setDockFilter] = React.useState("all");
  const [constraintFilter, setConstraintFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<OutletSortKey | null>("outletId");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 15;
  const [dialog, setDialog] = React.useState<DialogState<MasterOutlet>>(null);

  const {
    data: outlets = [],
    isLoading: isOutletsLoading,
    error: outletsError,
    refetch: refetchOutlets,
  } = useOutlets();
  const { data: brands = [], isLoading: isBrandsLoading } = useBrands();
  const { data: depots = [], isLoading: isDepotsLoading } = useDepots();
  const { data: districts = [], isLoading: isDistrictsLoading } = useDistricts();

  const isLoading =
    isOutletsLoading || isBrandsLoading || isDepotsLoading || isDistrictsLoading;

  const { getBrandCode, getDepotCode, getDistrictName, paginatedOutlets, totalPages } =
    useAdminOutletsFilter({
      outlets,
      depots,
      brands,
      districts,
      selectedHub,
      selectedBrand,
      dockFilter,
      constraintFilter,
      searchQuery,
      sortKey,
      sortDirection,
      currentPage,
      pageSize,
    });

  const columns = React.useMemo(
    () =>
      getOutletColumns({
        getBrandCode,
        getDepotCode,
        getDistrictName,
        actions: {
          onEdit: (row) => setDialog({ kind: "edit", row }),
          onDelete: (row) => setDialog({ kind: "delete", row }),
        },
      }),
    [getBrandCode, getDepotCode, getDistrictName]
  );

  return (
    <AdminCrudShell
      title="Retail Outlets Directory"
      description="Store delivery windows, unloading dock configurations, and vehicle access limits"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
            onClick={() => refetchOutlets()}
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
            <span>Add Outlet</span>
          </Button>
        </div>
      }
      kpi={<OutletKpiStrip outlets={outlets} />}
      search={searchQuery}
      onSearchChange={(val) => {
        setSearchQuery(val);
        setCurrentPage(1);
      }}
      searchPlaceholder="Search outlet ID, store name, district..."
      filters={
        <OutletFilterControls
          selectedHub={selectedHub}
          onHubChange={(h) => {
            setSelectedHub(h);
            setCurrentPage(1);
          }}
          selectedBrand={selectedBrand}
          onBrandChange={(b) => {
            setSelectedBrand(b);
            setCurrentPage(1);
          }}
          dockFilter={dockFilter}
          onDockChange={(d) => {
            setDockFilter(d);
            setCurrentPage(1);
          }}
          constraintFilter={constraintFilter}
          onConstraintChange={(c) => {
            setConstraintFilter(c);
            setCurrentPage(1);
          }}
        />
      }
      onResetFilters={() => {
        setSearchQuery("");
        setSelectedHub("ALL");
        setSelectedBrand("ALL");
        setDockFilter("all");
        setConstraintFilter("all");
        setCurrentPage(1);
      }}
      activeFilterCount={
        (selectedHub !== "ALL" ? 1 : 0) +
        (selectedBrand !== "ALL" ? 1 : 0) +
        (dockFilter !== "all" ? 1 : 0) +
        (constraintFilter !== "all" ? 1 : 0)
      }
    >
      <DataTable
        columns={columns}
        data={paginatedOutlets}
        isLoading={isLoading}
        sortKey={sortKey || undefined}
        sortDirection={sortDirection}
        onSort={(key) => {
          if (sortKey === key)
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
          else {
            setSortKey(key as OutletSortKey);
            setSortDirection("asc");
          }
        }}
        pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
        emptyMessage={
          outletsError
            ? `Failed to load outlets: ${outletsError.message}`
            : "No matching retail outlets found."
        }
        keyExtractor={(o) => o.id}
      />
      <OutletDialogs state={dialog} onClose={() => setDialog(null)} />
    </AdminCrudShell>
  );
}

export default AdminOutletsPage;
