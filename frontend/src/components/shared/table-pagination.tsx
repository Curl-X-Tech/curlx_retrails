import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  siblingCount?: number;
}

type PageItem = number | "ellipsis-left" | "ellipsis-right";

function getPaginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount = 1
): PageItem[] {
  const totalPageNumbers = siblingCount * 2 + 5;

  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, "ellipsis-right", totalPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [1, "ellipsis-left", ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  );
  return [1, "ellipsis-left", ...middleRange, "ellipsis-right", totalPages];
}

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  siblingCount = 1,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const paginationItems = getPaginationItems(currentPage, totalPages, siblingCount);

  return (
    <Pagination className={cn("mx-0 w-auto justify-end", className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage <= 1}
          />
        </PaginationItem>

        {paginationItems.map((item, index) => {
          if (item === "ellipsis-left" || item === "ellipsis-right") {
            return (
              <PaginationItem key={`${item}-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={item}>
              <PaginationLink
                isActive={currentPage === item}
                onClick={() => onPageChange(item)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage >= totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
