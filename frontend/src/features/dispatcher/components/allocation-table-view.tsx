import { Card } from "@/components/ui/card";
import { TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SortHeaderIcon } from "@/components/shared/sort-header-icon";
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
          Showing <span className="font-bold text-foreground">{sortedAllocations.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{" "}
          <span className="font-bold text-foreground">{Math.min(currentPage * pageSize, sortedAllocations.length)}</span> of{" "}
          <span className="font-bold text-foreground">{sortedAllocations.length}</span> vehicles
        </div>

        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => onPageChange(Math.max(currentPage - 1, 1))} disabled={currentPage <= 1} />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink isActive={currentPage === page} onClick={() => onPageChange(page)}>{page}</PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage >= totalPages} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <TooltipProvider delay={100}>
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <TableHeader className="sticky top-0 z-20 bg-card shadow-2xs border-b border-border/80">
              <TableRow className="border-b border-border/80 hover:bg-transparent">
                <TableHead className="w-[130px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs" onClick={() => onSort("plateNumber")}>
                  <div className="flex items-center gap-1"><span>Vehicle</span><SortHeaderIcon active={sortKey === "plateNumber"} direction={sortDirection} /></div>
                </TableHead>
                <TableHead className="w-[190px] font-bold text-foreground text-xs">Route</TableHead>
                <TableHead className="w-[150px] font-bold text-foreground text-xs">Driver</TableHead>
                <TableHead className="w-[80px] text-center cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs" onClick={() => onSort("crates")}>
                  <div className="flex items-center justify-center gap-1"><span>Crates</span><SortHeaderIcon active={sortKey === "crates"} direction={sortDirection} /></div>
                </TableHead>
                <TableHead className="w-[180px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs" onClick={() => onSort("weight")}>
                  <div className="flex items-center gap-1"><span>Weight Load</span><SortHeaderIcon active={sortKey === "weight"} direction={sortDirection} /></div>
                </TableHead>
                <TableHead className="w-[180px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs" onClick={() => onSort("volume")}>
                  <div className="flex items-center gap-1"><span>Volume Load</span><SortHeaderIcon active={sortKey === "volume"} direction={sortDirection} /></div>
                </TableHead>
                <TableHead className="w-[100px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs" onClick={() => onSort("departure")}>
                  <div className="flex items-center gap-1"><span>Departure</span><SortHeaderIcon active={sortKey === "departure"} direction={sortDirection} /></div>
                </TableHead>
                <TableHead className="w-[100px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs" onClick={() => onSort("status")}>
                  <div className="flex items-center gap-1"><span>Status</span><SortHeaderIcon active={sortKey === "status"} direction={sortDirection} /></div>
                </TableHead>
                <TableHead className="w-[60px] text-right font-bold text-foreground text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAllocations.map((alloc) => (
                <AllocationTableRow key={alloc.id} alloc={alloc} onSelect={onSelectAllocation} />
              ))}
            </TableBody>
          </table>
        </div>
      </TooltipProvider>
    </Card>
  );
}
