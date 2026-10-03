import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CaretUpDownIcon, CaretUpIcon, CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "./data-table-pagination";

export type { DataTablePaginationProps };

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  pagination?: DataTablePaginationProps;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  emptyMessage?: string;
  className?: string;
  keyExtractor?: (row: T, index: number) => string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  onRowClick,
  pagination,
  sortKey,
  sortDirection = "asc",
  onSort,
  emptyMessage = "No records found.",
  className,
  keyExtractor,
}: DataTableProps<T>) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.sortable && onSort && "cursor-pointer select-none",
                    col.className
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="shrink-0">
                        {sortKey === col.key ? (
                          sortDirection === "asc" ? (
                            <CaretUpIcon className="size-3.5 text-primary" />
                          ) : (
                            <CaretDownIcon className="size-3.5 text-primary" />
                          )
                        ) : (
                          <CaretUpDownIcon className="size-3.5 text-muted-foreground/40" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={`skeleton-${rIdx}`}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      <Skeleton className="h-5 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground text-sm"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIdx) => (
                <TableRow
                  key={keyExtractor ? keyExtractor(row, rowIdx) : rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-muted/50 transition-colors"
                  )}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render
                        ? col.render(row, rowIdx)
                        : String((row as Record<string, unknown>)[col.key] ?? "-")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <DataTablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
