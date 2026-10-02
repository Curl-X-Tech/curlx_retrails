import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CardGridSkeletonProps {
  count?: number;
  columnsClassName?: string;
  className?: string;
}

export function CardGridSkeleton({
  count = 8,
  columnsClassName = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  className,
}: CardGridSkeletonProps) {
  return (
    <div className={cn("grid gap-4", columnsClassName, className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <Card
          key={idx}
          className="p-4 bg-card border border-border/70 rounded-2xl shadow-xs flex flex-col justify-between h-48"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-32 rounded-md" />
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-2.5 w-12 rounded-sm" />
                <Skeleton className="h-2.5 w-12 rounded-sm" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-3 w-14 rounded-md" />
          </div>
        </Card>
      ))}
    </div>
  );
}
