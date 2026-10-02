import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { KPIBarSkeleton } from "@/components/skeletons/kpi-bar-skeleton";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { Card } from "@/components/ui/card";

export function DeferralsPageSkeleton({ isAuditLog = false }: { isAuditLog?: boolean }) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top Header */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
        <div className="space-y-1">
          <Skeleton className="h-5 w-64 rounded-md" />
          <Skeleton className="h-3 w-96 rounded-sm" />
        </div>
        <Skeleton className="h-7 w-28 rounded-lg" />
      </div>

      {/* KPI Bar */}
      <KPIBarSkeleton count={4} />

      {/* Main Viewport Content */}
      <div className="flex-1 min-h-0 p-4 sm:p-6 flex flex-col overflow-hidden">
        {!isAuditLog && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 shrink-0">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="px-4 py-3.5 min-h-[82px] bg-card border border-border/70 rounded-xl flex items-center justify-between gap-3.5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Skeleton className="size-11 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                    <Skeleton className="h-2.5 w-32 rounded-sm" />
                  </div>
                </div>
                <Skeleton className="w-14 h-10 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Table Skeleton */}
        <TableSkeleton
          columns={isAuditLog ? 9 : 8}
          rowCount={5}
          showHeader={true}
          showToolbar={true}
          showPagination={true}
        />
      </div>
    </div>
  );
}

export function OrderQueuePageSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
        <div className="space-y-1">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-3 w-80 rounded-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-7 w-36 rounded-lg" />
        </div>
      </div>

      {/* KPI Bar */}
      <KPIBarSkeleton count={6} />

      {/* Main Table Content */}
      <div className="flex-1 min-h-0 p-4 sm:p-6 flex flex-col overflow-hidden">
        <TableSkeleton
          columns={9}
          rowCount={6}
          showHeader={true}
          showToolbar={true}
          showPagination={true}
        />
      </div>
    </div>
  );
}

export function AllocationSummaryPageSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
        <div className="space-y-1">
          <Skeleton className="h-5 w-52 rounded-md" />
          <Skeleton className="h-3 w-72 rounded-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-28 rounded-lg" />
        </div>
      </div>

      {/* KPI Bar */}
      <KPIBarSkeleton count={5} />

      {/* Toolbar & Grid Content */}
      <div className="flex-1 min-h-0 p-4 sm:p-6 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between pb-4 shrink-0">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-24 rounded-lg" />
            <Skeleton className="h-7 w-24 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <CardGridSkeleton count={10} />
        </div>
      </div>
    </div>
  );
}

export function AllocationDetailPageSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex items-center justify-between shrink-0">
        <div className="space-y-1">
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-3 w-64 rounded-sm" />
        </div>
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>

      {/* 2-Column Detail Viewport */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Master List */}
        <div className="lg:col-span-4 border-r border-border/60 flex flex-col p-3 space-y-3 bg-muted/10">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-7 w-full rounded-lg" />
          <div className="space-y-2.5 flex-1 overflow-hidden pt-1">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card
                key={idx}
                className="p-3 bg-card border border-border/60 rounded-xl space-y-2"
              >
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32 rounded-sm" />
                <Skeleton className="h-2 w-full rounded-full" />
              </Card>
            ))}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-8 p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div className="flex justify-between items-center pb-2 border-b border-border/50">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 h-36 bg-card border border-border/60 rounded-xl space-y-3">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-3 w-40 rounded-sm" />
              <Skeleton className="h-3 w-32 rounded-sm" />
            </Card>
            <Card className="p-4 h-36 bg-card border border-border/60 rounded-xl space-y-3">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-3 w-40 rounded-sm" />
              <Skeleton className="h-3 w-32 rounded-sm" />
            </Card>
          </div>

          <Card className="p-4 h-64 bg-card border border-border/60 rounded-2xl flex items-center justify-center">
            <Skeleton className="h-full w-full rounded-xl" />
          </Card>
        </div>
      </div>
    </div>
  );
}

export function LiveMapPageSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex items-center justify-between shrink-0">
        <div className="space-y-1">
          <Skeleton className="h-5 w-44 rounded-md" />
          <Skeleton className="h-3 w-72 rounded-sm" />
        </div>
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>

      <div className="flex-1 min-h-0 relative">
        <Skeleton className="h-full w-full rounded-none" />
        <div className="absolute top-4 left-4 z-10 w-72 space-y-2 pointer-events-none">
          <Card className="p-3 bg-card/90 backdrop-blur-xs border border-border/60 rounded-xl shadow-lg space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3 w-48 rounded-sm" />
          </Card>
        </div>
      </div>
    </div>
  );
}
