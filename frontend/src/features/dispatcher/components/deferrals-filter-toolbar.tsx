import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DeferralsFilterDropdowns } from "./deferrals-filter-dropdowns";
import type { CarryoverGroupBy } from "../types";

interface DeferralsFilterToolbarProps {
  searchQuery: string;
  brandFilter: string;
  groupBy: CarryoverGroupBy;
  totalFilteredCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onSearchChange: (val: string) => void;
  onBrandChange: (val: string) => void;
  onGroupByChange: (group: CarryoverGroupBy) => void;
  onPageChange: (page: number) => void;
}

export function DeferralsFilterToolbar({
  searchQuery,
  brandFilter,
  groupBy,
  totalFilteredCount,
  currentPage,
  totalPages,
  pageSize,
  onSearchChange,
  onBrandChange,
  onGroupByChange,
  onPageChange,
}: DeferralsFilterToolbarProps) {
  const fromCount =
    totalFilteredCount === 0
      ? 0
      : groupBy === "none"
        ? (currentPage - 1) * pageSize + 1
        : 1;
  const toCount =
    groupBy === "none"
      ? Math.min(currentPage * pageSize, totalFilteredCount)
      : totalFilteredCount;

  return (
    <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-3">
        <div className="relative w-56">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search carryover orders..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 h-7 text-xs bg-card"
          />
        </div>

        <DeferralsFilterDropdowns
          brandFilter={brandFilter}
          groupBy={groupBy}
          onBrandChange={onBrandChange}
          onGroupByChange={onGroupByChange}
        />

        <div className="text-muted-foreground text-[11px]">
          Showing <span className="font-bold text-foreground">{fromCount}</span> to{" "}
          <span className="font-bold text-foreground">{toCount}</span> of{" "}
          <span className="font-bold text-foreground">{totalFilteredCount}</span> orders
        </div>
      </div>

      {groupBy === "none" && totalPages > 1 && (
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage <= 1}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
