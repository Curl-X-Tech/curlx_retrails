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
import {
  DeferralsAuditFilterDropdowns,
  getResourceBadge,
} from "./deferrals-audit-filter-dropdowns";
import type { AuditGroupBy } from "../types";

export { getResourceBadge };

interface DeferralsAuditFilterToolbarProps {
  searchQuery: string;
  reasonFilter: string;
  resourceFilter: string;
  groupBy: AuditGroupBy;
  totalFilteredCount: number;
  currentPage: number;
  totalPages: number;
  pageSize?: number;
  onSearchChange: (val: string) => void;
  onReasonChange: (val: string) => void;
  onResourceChange: (val: string) => void;
  onGroupByChange: (group: AuditGroupBy) => void;
  onPageChange: (page: number) => void;
}

export function DeferralsAuditFilterToolbar({
  searchQuery,
  reasonFilter,
  resourceFilter,
  groupBy,
  totalFilteredCount,
  currentPage,
  totalPages,
  onSearchChange,
  onReasonChange,
  onResourceChange,
  onGroupByChange,
  onPageChange,
}: DeferralsAuditFilterToolbarProps) {
  return (
    <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-56">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search audit records..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 h-7 text-xs bg-card"
          />
        </div>

        <DeferralsAuditFilterDropdowns
          reasonFilter={reasonFilter}
          resourceFilter={resourceFilter}
          groupBy={groupBy}
          onReasonChange={onReasonChange}
          onResourceChange={onResourceChange}
          onGroupByChange={onGroupByChange}
        />

        <div className="text-muted-foreground text-[11px] ml-2">
          <span className="font-bold text-foreground">{totalFilteredCount}</span> records
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
