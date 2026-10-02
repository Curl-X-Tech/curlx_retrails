import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ColumnSkeletonConfig {
  width?: string;
  align?: "left" | "center" | "right";
  headerWidth?: string;
}

export interface TableSkeletonProps {
  columns?: number | ColumnSkeletonConfig[];
  rowCount?: number;
  showHeader?: boolean;
  showToolbar?: boolean;
  showPagination?: boolean;
  dense?: boolean;
  className?: string;
}

export function TableSkeleton({
  columns = 6,
  rowCount = 5,
  showHeader = true,
  showToolbar = true,
  showPagination = true,
  dense = false,
  className,
}: TableSkeletonProps) {
  const columnConfigs: ColumnSkeletonConfig[] = React.useMemo(() => {
    if (Array.isArray(columns)) return columns;
    return Array.from({ length: columns }, (_, idx) => {
      if (idx === 0) return { width: "w-28", headerWidth: "w-20" };
      if (idx === columns - 1)
        return { width: "w-16", headerWidth: "w-12", align: "right" as const };
      return { width: "w-24", headerWidth: "w-16" };
    });
  }, [columns]);

  return (
    <Card
      className={cn(
        "bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col",
        className
      )}
    >
      {/* Table Toolbar Skeleton */}
      {showToolbar && (
        <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Skeleton className="h-7 w-48 sm:w-56 rounded-lg" />
            <Skeleton className="h-7 w-28 rounded-lg" />
            <Skeleton className="h-7 w-28 rounded-lg" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        </div>
      )}

      {/* Table Viewport */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <table className="w-full caption-bottom text-sm border-collapse">
          {showHeader && (
            <thead>
              <tr className="border-b border-border/70 bg-muted/20">
                {columnConfigs.map((col, idx) => (
                  <th
                    key={idx}
                    className={cn(
                      "px-3 py-2.5 text-left",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center"
                    )}
                  >
                    <Skeleton
                      className={cn(
                        "h-3.5 rounded-sm",
                        col.headerWidth || "w-16",
                        col.align === "right" && "ml-auto",
                        col.align === "center" && "mx-auto"
                      )}
                    />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-border/40">
            {Array.from({ length: rowCount }).map((_, rowIdx) => (
              <tr
                key={rowIdx}
                className={cn(
                  "hover:bg-muted/10 transition-colors",
                  dense ? "h-10" : "h-13"
                )}
              >
                {columnConfigs.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={cn(
                      "px-3 py-2.5",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        col.align === "right" && "justify-end",
                        col.align === "center" && "justify-center"
                      )}
                    >
                      {colIdx === 0 && (
                        <Skeleton className="size-3.5 rounded-full shrink-0" />
                      )}
                      <Skeleton
                        className={cn(
                          dense ? "h-3" : "h-3.5",
                          "rounded-md",
                          col.width || "w-20"
                        )}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Skeleton */}
      {showPagination && (
        <div className="px-4 py-2.5 bg-muted/20 border-t border-border/50 shrink-0 flex items-center justify-between text-xs">
          <Skeleton className="h-3.5 w-32 rounded-md" />
          <div className="flex items-center gap-1">
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="size-7 rounded-md" />
          </div>
        </div>
      )}
    </Card>
  );
}
