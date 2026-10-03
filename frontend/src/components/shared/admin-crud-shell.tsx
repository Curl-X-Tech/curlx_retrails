import * as React from "react";
import { PageHeader } from "./page-header";
import { FilterBar } from "./filter-bar";
import { cn } from "@/lib/utils";

export interface AdminCrudShellProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  onResetFilters?: () => void;
  activeFilterCount?: number;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AdminCrudShell({
  title,
  description,
  badge,
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  onResetFilters,
  activeFilterCount,
  actions,
  children,
  className,
}: AdminCrudShellProps) {
  const showFilterBar = search !== undefined && onSearchChange !== undefined;

  return (
    <div className={cn("page-container-desktop py-6 space-y-6", className)}>
      <PageHeader
        title={title}
        description={description}
        badge={badge}
        actions={!showFilterBar ? actions : undefined}
      />

      {showFilterBar && (
        <FilterBar
          search={search}
          onSearchChange={onSearchChange}
          placeholder={searchPlaceholder}
          filters={filters}
          onReset={onResetFilters}
          activeCount={activeFilterCount}
          actions={actions}
        />
      )}

      <div>{children}</div>
    </div>
  );
}
