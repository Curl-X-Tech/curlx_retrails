import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
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
  onSearchChange: (val: string) => void;
  onReasonChange: (val: string) => void;
  onResourceChange: (val: string) => void;
  onGroupByChange: (group: AuditGroupBy) => void;
}

export function DeferralsAuditFilterToolbar({
  searchQuery,
  reasonFilter,
  resourceFilter,
  groupBy,
  onSearchChange,
  onReasonChange,
  onResourceChange,
  onGroupByChange,
}: DeferralsAuditFilterToolbarProps) {
  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search audit records..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 h-7 text-xs bg-card"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <DeferralsAuditFilterDropdowns
          reasonFilter={reasonFilter}
          resourceFilter={resourceFilter}
          groupBy={groupBy}
          onReasonChange={onReasonChange}
          onResourceChange={onResourceChange}
          onGroupByChange={onGroupByChange}
        />
      </div>
    </div>
  );
}
