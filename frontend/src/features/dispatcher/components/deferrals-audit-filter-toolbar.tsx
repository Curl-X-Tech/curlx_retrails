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
import { getReasonLabel } from "./deferrals-carryover-row";
import type { AuditGroupBy } from "../types";

export function getResourceBadge(res: string) {
  switch (res) {
    case "weight_cap":
      return "Weight Cap";
    case "volume_cap":
      return "Volume Cap";
    case "time_budget":
      return "Driver Time";
    case "fleet_downtime":
      return "Workshop";
    default:
      return res;
  }
}

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
              Reason: {reasonFilter === "all" ? "All" : getReasonLabel(reasonFilter)}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs">
              Filter Deferral Reason
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={reasonFilter}
              onValueChange={(val) => onReasonChange(val ?? "all")}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Reasons
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="insufficient_reefer_capacity"
                className="text-xs"
              >
                Reefer Capacity Saturated
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="van_access_shortage" className="text-xs">
                Van Access Shortage
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="time_budget_limit" className="text-xs">
                Time Budget Exceeded
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="fuel_quota_exceeded" className="text-xs">
                Fleet Downtime / Workshop
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
            <span>
              Resource:{" "}
              {resourceFilter === "all" ? "All" : getResourceBadge(resourceFilter)}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs">Limiting Resource</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={resourceFilter}
              onValueChange={(val) => onResourceChange(val ?? "all")}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Resources
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="weight_cap" className="text-xs">
                Weight Cap
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="volume_cap" className="text-xs">
                Volume Cap
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="time_budget" className="text-xs">
                Driver Time Budget
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="fleet_downtime" className="text-xs">
                Fleet Downtime
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
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs">Group Audit Records</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={groupBy}
              onValueChange={(val) => onGroupByChange((val as AuditGroupBy) ?? "none")}
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
