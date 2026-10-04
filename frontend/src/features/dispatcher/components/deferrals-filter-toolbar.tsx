import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { DeferralsFilterDropdowns } from "./deferrals-filter-dropdowns";
import type { CarryoverGroupBy } from "../types";

interface DeferralsFilterToolbarProps {
  searchQuery: string;
  brandFilter: string;
  groupBy: CarryoverGroupBy;
  onSearchChange: (val: string) => void;
  onBrandChange: (val: string) => void;
  onGroupByChange: (group: CarryoverGroupBy) => void;
}

export function DeferralsFilterToolbar({
  searchQuery,
  brandFilter,
  groupBy,
  onSearchChange,
  onBrandChange,
  onGroupByChange,
}: DeferralsFilterToolbarProps) {
  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search carryover orders..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 h-7 text-xs bg-card"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <DeferralsFilterDropdowns
          brandFilter={brandFilter}
          groupBy={groupBy}
          onBrandChange={onBrandChange}
          onGroupByChange={onGroupByChange}
        />
      </div>
    </div>
  );
}
