import * as React from "react";
import { useDebounce } from "./use-debounce";

export interface UseTableFilterOptions<T> {
  data: T[];
  searchFields?: (keyof T | ((item: T) => string))[];
  filterFn?: (item: T, search: string) => boolean;
  initialSortKey?: keyof T | string;
  initialSortDirection?: "asc" | "desc";
}

export function useTableFilter<T>({
  data,
  searchFields = [],
  filterFn,
  initialSortKey,
  initialSortDirection = "asc",
}: UseTableFilterOptions<T>) {
  const [search, setSearch] = React.useState("");
  const [sortKey, setSortKey] = React.useState<keyof T | string | undefined>(
    initialSortKey
  );
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    initialSortDirection
  );

  const debouncedSearch = useDebounce(search, 250);

  const toggleSort = React.useCallback(
    (key: keyof T | string) => {
      if (sortKey === key) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDirection("asc");
      }
    },
    [sortKey]
  );

  const filteredData = React.useMemo(() => {
    let result = [...data];
    const query = debouncedSearch.trim().toLowerCase();

    if (query) {
      if (filterFn) {
        result = result.filter((item) => filterFn(item, query));
      } else if (searchFields.length > 0) {
        result = result.filter((item) =>
          searchFields.some((field) => {
            const val =
              typeof field === "function"
                ? field(item)
                : String(item[field] ?? "");
            return val.toLowerCase().includes(query);
          })
        );
      }
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey as string];
        const bVal = (b as Record<string, unknown>)[sortKey as string];

        if (aVal === bVal) return 0;
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        const comparison =
          typeof aVal === "number" && typeof bVal === "number"
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal));

        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [data, debouncedSearch, filterFn, searchFields, sortKey, sortDirection]);

  return {
    search,
    setSearch,
    debouncedSearch,
    sortKey,
    sortDirection,
    setSortKey,
    setSortDirection,
    toggleSort,
    filteredData,
    totalCount: data.length,
    filteredCount: filteredData.length,
  };
}
