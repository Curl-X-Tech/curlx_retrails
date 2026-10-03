import { Card } from "@/components/ui/card";
import { TableBody } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AllocationTableHeader } from "./allocation-table-header";
import { AllocationTableRow } from "./allocation-table-row";
import type { VehicleAllocation, AllocationSortKey } from "../types";

interface AllocationTableViewProps {
  sortedAllocations: VehicleAllocation[];
  paginatedAllocations: VehicleAllocation[];
  sortKey: AllocationSortKey | null;
  sortDirection: "asc" | "desc";
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onSort: (key: AllocationSortKey) => void;
  onPageChange: (page: number) => void;
  onSelectAllocation: (alloc: VehicleAllocation) => void;
}

export function AllocationTableView({
  sortedAllocations,
  paginatedAllocations,
  sortKey,
  sortDirection,
  currentPage,
  totalPages,
  pageSize,
  onSort,
  onPageChange,
  onSelectAllocation,
}: AllocationTableViewProps) {
  return (
    <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
      <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="text-muted-foreground text-[11px]">
          Showing{" "}
          <span className="font-bold text-foreground">
            {sortedAllocations.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-bold text-foreground">
            {Math.min(currentPage * pageSize, sortedAllocations.length)}
          </span>{" "}
          of <span className="font-bold text-foreground">{sortedAllocations.length}</span>{" "}
          vehicles
        </div>

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
      </div>

      <TooltipProvider delay={100}>
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <AllocationTableHeader
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <TableBody>
              {paginatedAllocations.map((alloc) => (
                <AllocationTableRow
                  key={alloc.id}
                  alloc={alloc}
                  onSelect={onSelectAllocation}
                />
              ))}
            </TableBody>
          </table>
        </div>
      </TooltipProvider>
    </Card>
  );
}
