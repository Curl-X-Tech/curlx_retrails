import * as React from "react";
import { sortOutlets } from "../admin-utils";
import type {
  OutletSortKey,
  MasterOutlet,
  MasterBrand,
  MasterDepot,
  MasterDistrict,
} from "../types";
import type { AdminHubFilter, AdminBrandFilter } from "../store";

interface UseAdminOutletsFilterProps {
  outlets: MasterOutlet[];
  depots: MasterDepot[];
  brands: MasterBrand[];
  districts: MasterDistrict[];
  selectedHub: AdminHubFilter;
  selectedBrand: AdminBrandFilter;
  dockFilter: string;
  constraintFilter: string;
  searchQuery: string;
  sortKey: OutletSortKey | null;
  sortDirection: "asc" | "desc";
  currentPage: number;
  pageSize?: number;
}

export function useAdminOutletsFilter({
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
  pageSize = 15,
}: UseAdminOutletsFilterProps) {
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
      if (
        selectedHub !== "ALL" &&
        depots.find((d: MasterDepot) => d.code === selectedHub)?.id !== o.depot_id
      )
        return false;
      if (
        selectedBrand !== "ALL" &&
        brands.find((b: MasterBrand) => b.code === selectedBrand)?.id !== o.brand_id
      )
        return false;
      if (dockFilter !== "all" && o.dock_type !== dockFilter) return false;
      if (constraintFilter !== "all" && o.parking_constraint !== constraintFilter)
        return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.name.toLowerCase().includes(q) ||
        o.outlet_id.toLowerCase().includes(q) ||
        getDistrictName(o.district_id).toLowerCase().includes(q)
      );
    });
  }, [
    outlets,
    depots,
    brands,
    selectedHub,
    selectedBrand,
    dockFilter,
    constraintFilter,
    searchQuery,
    getDistrictName,
  ]);

  const sortedOutlets = React.useMemo(
    () =>
      sortOutlets(filteredOutlets, sortKey, sortDirection, getBrandCode, getDistrictName),
    [filteredOutlets, sortKey, sortDirection, getBrandCode, getDistrictName]
  );

  const totalPages = Math.max(1, Math.ceil(sortedOutlets.length / pageSize));
  const paginatedOutlets = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedOutlets.slice(start, start + pageSize);
  }, [sortedOutlets, currentPage, pageSize]);

  return {
    getBrandCode,
    getDepotCode,
    getDistrictName,
    sortedOutlets,
    paginatedOutlets,
    totalPages,
  };
}
