import * as React from "react";

export interface UsePaginationOptions<T> {
  items?: T[];
  totalItems?: number;
  pageSize?: number;
  initialPage?: number;
}

export interface UsePaginationResult<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  offset: number;
  limit: number;
  canNext: boolean;
  canPrev: boolean;
  paginatedItems: T[];
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export function usePagination<T>({
  items = [],
  totalItems: customTotal,
  pageSize = 10,
  initialPage = 1,
}: UsePaginationOptions<T>): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = React.useState(initialPage);

  const total = customTotal ?? items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const offset = (currentPage - 1) * pageSize;
  const limit = pageSize;

  const paginatedItems = React.useMemo(() => {
    if (customTotal !== undefined) {
      return items;
    }
    return items.slice(offset, offset + limit);
  }, [items, offset, limit, customTotal]);

  const setPage = React.useCallback(
    (page: number) => {
      setCurrentPage(Math.min(Math.max(1, page), totalPages));
    },
    [totalPages]
  );

  const nextPage = React.useCallback(() => {
    setPage(currentPage + 1);
  }, [currentPage, setPage]);

  const prevPage = React.useCallback(() => {
    setPage(currentPage - 1);
  }, [currentPage, setPage]);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems: total,
    offset,
    limit,
    canNext: currentPage < totalPages,
    canPrev: currentPage > 1,
    paginatedItems,
    setPage,
    nextPage,
    prevPage,
  };
}
