import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  onPageChange,
}: DataTablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-xs text-muted-foreground tabular-nums">
        Page {currentPage} of {totalPages}
      </div>
      <Pagination className="justify-end w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={cn(
                currentPage >= totalPages && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
