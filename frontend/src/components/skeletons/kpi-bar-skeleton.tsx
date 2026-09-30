import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface KPIBarSkeletonProps {
  count?: number;
  className?: string;
}

export function KPIBarSkeleton({ count = 4, className }: KPIBarSkeletonProps) {
  return (
    <div
      className={cn(
        "px-4 sm:px-6 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 sm:gap-4 overflow-x-auto shrink-0",
        className
      )}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border/50 rounded-lg shadow-2xs shrink-0"
        >
          <Skeleton className="size-3.5 rounded-full shrink-0" />
          <Skeleton className="h-3 w-20 rounded-md" />
          <Skeleton className="h-3.5 w-10 rounded-md font-bold" />
        </div>
      ))}
    </div>
  );
}
