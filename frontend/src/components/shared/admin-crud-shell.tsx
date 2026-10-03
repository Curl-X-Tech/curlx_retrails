import * as React from "react";
import { PageHeader } from "./page-header";
import { FilterBar } from "./filter-bar";
import { cn } from "@/lib/utils";

export interface AdminCrudShellProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  kpi?: React.ReactNode;
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  onResetFilters?: () => void;
  activeFilterCount?: number;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AdminCrudShell({
  title,
  description,
  badge,
  kpi,
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  onResetFilters,
  activeFilterCount,
  actions,
  children,
  className,
  contentClassName,
}: AdminCrudShellProps) {
  const showFilterBar = search !== undefined && onSearchChange !== undefined;

  return (
    <div
      className={cn(
        "flex-1 flex flex-col h-full overflow-hidden bg-background",
        className
      )}
    >
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card">
        <PageHeader
          className="mb-0"
          title={title}
          description={description}
          badge={badge}
          actions={actions}
        />
      </div>

      {kpi && (
        <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20">
          {kpi}
        </div>
      )}

      <div
        className={cn(
          "flex-1 p-4 sm:p-6 flex flex-col min-h-0 space-y-3 overflow-hidden",
          contentClassName
        )}
      >
        {showFilterBar && (
          <FilterBar
            search={search}
            onSearchChange={onSearchChange}
            placeholder={searchPlaceholder}
            filters={filters}
            onReset={onResetFilters}
            activeCount={activeFilterCount}
          />
        )}
        {children}
      </div>
    </div>
  );
}
