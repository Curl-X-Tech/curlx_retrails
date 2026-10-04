import { Skeleton } from "@/components/ui/skeleton";
import { QueryState } from "@/components/shared";
import { OrderFormView, useOrderCatalog } from "@/features/store";

export function StoreCreateOrderPage() {
  const catalog = useOrderCatalog();

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-4rem)] overflow-hidden bg-[#FBFBFB] dark:bg-background font-sans">
      <QueryState
        isLoading={catalog.isLoading}
        error={catalog.error}
        isEmpty={catalog.outlets.length === 0}
        onRetry={catalog.refetch}
        emptyMessage="No active outlets are available for ordering."
        loading={
          <div className="px-4 md:px-8 py-6 max-w-7xl w-full mx-auto space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <OrderFormView catalog={catalog} />
      </QueryState>
    </div>
  );
}
