import { MagnifyingGlassIcon, FunnelIcon, RowsIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="xs"
                className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
              />
            }
          >
            <FunnelIcon className="size-3 text-muted-foreground" />
            <span>
              Brand: {brandFilter === "all" ? "All" : `Waypoint ${brandFilter}`}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36">
            <DropdownMenuLabel className="text-xs">Filter Brand</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={brandFilter}
              onValueChange={(val) => onBrandChange(val ?? "all")}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Brands
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Fresh" className="text-xs">
                Waypoint Fresh
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Style" className="text-xs">
                Waypoint Style
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Tech" className="text-xs">
                Waypoint Tech
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="xs"
                className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
              />
            }
          >
            <RowsIcon className="size-3 text-muted-foreground" />
            <span>
              Group:{" "}
              {groupBy === "none"
                ? "None"
                : groupBy === "action"
                  ? "By Action"
                  : "By Reason"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel className="text-xs">Group Orders</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={groupBy}
              onValueChange={(val) =>
                onGroupByChange((val as CarryoverGroupBy) ?? "none")
              }
            >
              <DropdownMenuRadioItem value="none" className="text-xs">
                None (Flat Table)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="action" className="text-xs">
                Group by Action
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="reason" className="text-xs">
                Group by Deferral Reason
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

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
