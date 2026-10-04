import { TablePagination } from "@/components/shared/table-pagination";
import { OrderCard } from "@/components/dispatcher/order-card";
import type { QueuedOrder } from "../types";

interface QueueGridViewProps {
  orders: QueuedOrder[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectOrder: (order: QueuedOrder) => void;
}

export function QueueGridView({
  orders,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onSelectOrder,
}: QueueGridViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 phone:grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4 wide:grid-cols-4 gutter-responsive">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onSelect={onSelectOrder} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs">
        <span className="text-muted-foreground text-xs">
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount} orders
        </span>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
