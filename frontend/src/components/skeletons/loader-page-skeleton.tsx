import { Skeleton } from "@/components/ui/skeleton";

export function LoaderPageSkeleton() {
  return (
    <div className="relative w-full max-w-[1440px] mx-auto">
      {/* 2-Column Dashboard Skeleton for md: (tablets) and lg: */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5 w-full items-start">
        {/* Left: Active Vehicle Card + Driver + Payload Center & Action Buttons (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-3.5">
          {/* Active Vehicle Skeleton */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-card">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-28 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
              </div>
            </div>
            <Skeleton className="h-9 w-20 rounded-xl" />
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4">
            <Skeleton className="size-12 rounded-2xl" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-36 rounded" />
            </div>
          </div>

          <div className="flex items-center justify-center rounded-2xl border border-border/80 bg-card p-5">
            <Skeleton className="h-44 w-56 rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>

        {/* Right: Waypoint Manifest & Checklist (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-3.5">
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col rounded-2xl border border-border/80 bg-card p-4 gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-xl" />
                    <Skeleton className="h-5 w-44 rounded" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                {i === 1 && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
