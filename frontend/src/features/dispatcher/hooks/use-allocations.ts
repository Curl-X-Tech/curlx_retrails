import * as React from "react";
import { useSearchParams } from "react-router-dom";
import {
  mockVehicleAllocations,
  mockAllocationKPIs,
} from "@/data/mock-allocations";
import { getManifestForAllocation } from "@/data/mock-allocation-details";
import type {
  VehicleAllocation,
  AllocationSortKey,
  AllocationViewMode,
  AllocationManifestDetail,
} from "../types";

export function useAllocations() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("search") || searchParams.get("q") || "";
  const viewMode = (searchParams.get("view") as AllocationViewMode) || "grid";
  const statusFilter = searchParams.get("status") || "all";
  const categoryFilter = searchParams.get("category") || "all";
  const sortKey = (searchParams.get("sort") as AllocationSortKey) || null;
  const sortDirection = (searchParams.get("dir") as "asc" | "desc") || "asc";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 5;

  const [allocations] = React.useState<VehicleAllocation[]>(mockVehicleAllocations);

  const updateQueryParams = React.useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, val]) => {
            if (
              val === null ||
              val === undefined ||
              val === "" ||
              val === "all" ||
              (key === "view" && val === "grid") ||
              (key === "page" && Number(val) <= 1)
            ) {
              next.delete(key);
            } else {
              next.set(key, String(val));
            }
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const filteredAllocations = React.useMemo(() => {
    return allocations.filter((alloc) => {
      const matchesSearch =
        alloc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alloc.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alloc.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alloc.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || alloc.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        (categoryFilter === "van" && alloc.vehicleCategory === "van") ||
        (categoryFilter === "lorry" &&
          (alloc.vehicleCategory === "dry_lorry" ||
            alloc.vehicleCategory === "freeze_lorry"));

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [allocations, searchQuery, statusFilter, categoryFilter]);

  const sortedAllocations = React.useMemo(() => {
    if (!sortKey) return filteredAllocations;

    return [...filteredAllocations].sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "plateNumber":
          comparison = a.plateNumber.localeCompare(b.plateNumber);
          break;
        case "crates":
          comparison = a.cratesAllocated - b.cratesAllocated;
          break;
        case "weight":
          comparison = a.allocatedWeightKg - b.allocatedWeightKg;
          break;
        case "volume":
          comparison = a.allocatedVolumeCbm - b.allocatedVolumeCbm;
          break;
        case "departure":
          comparison = a.departureTime.localeCompare(b.departureTime);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredAllocations, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedAllocations.length / pageSize));

  const paginatedAllocations = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAllocations.slice(start, start + pageSize);
  }, [sortedAllocations, currentPage, pageSize]);

  const getManifest = React.useCallback(
    (allocation: VehicleAllocation): AllocationManifestDetail => {
      return getManifestForAllocation(allocation);
    },
    []
  );

  return {
    allocations,
    searchQuery,
    viewMode,
    statusFilter,
    categoryFilter,
    sortKey,
    sortDirection,
    currentPage,
    pageSize,
    totalPages,
    kpis: mockAllocationKPIs,
    filteredAllocations,
    sortedAllocations,
    paginatedAllocations,
    updateQueryParams,
    getManifest,
  };
}
