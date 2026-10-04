import * as React from "react";
import { Card } from "@/components/ui/card";
import { TableBody } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueueTableHeader } from "./queue-table-header";
import { QueueTableRow } from "./queue-table-row";
import { QueueGroupHeaderRow, QueueGroupTotalRow } from "./queue-group-row";
import type { QueuedOrder, StoreOrderGroup, QueueSortKey } from "../types";

interface QueueTableViewProps {
  groupByStore: boolean;
  sortedOrders: QueuedOrder[];
  storeGroups: StoreOrderGroup[];
  paginatedOrders: QueuedOrder[];
  paginatedStoreGroups: StoreOrderGroup[];
  filteredCount: number;
  sortKey: QueueSortKey | null;
  sortDirection: "asc" | "desc";
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onSort: (key: QueueSortKey) => void;
  onPageChange: (page: number) => void;
  onSelectOrder: (order: QueuedOrder) => void;
}

export function QueueTableView({
  groupByStore,
  sortedOrders,
  storeGroups,
  paginatedOrders,
  paginatedStoreGroups,
  filteredCount,
  sortKey,
  sortDirection,
  currentPage,
  totalPages,
  pageSize,
  onSort,
  onPageChange,
  onSelectOrder,
}: QueueTableViewProps) {
  return (
    <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
      <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="text-muted-foreground text-xs tabular-nums">
          {groupByStore ? (
            <span>
              Showing{" "}
              <strong className="text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-foreground">
                {Math.min(currentPage * pageSize, storeGroups.length)}
              </strong>{" "}
              of <strong className="text-foreground">{storeGroups.length}</strong> retail
              destinations ({filteredCount} orders)
            </span>
          ) : (
            <span>
              Showing{" "}
              <span className="font-bold text-foreground">
                {sortedOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-foreground">
                {Math.min(currentPage * pageSize, sortedOrders.length)}
              </span>{" "}
              of <span className="font-bold text-foreground">{sortedOrders.length}</span>{" "}
              orders
            </span>
          )}
        </div>

        {totalPages > 1 && (
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage <= 1}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <TooltipProvider delay={100}>
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <QueueTableHeader
              groupByStore={groupByStore}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <TableBody>
              {groupByStore
                ? paginatedStoreGroups.map((group: StoreOrderGroup) => (
                    <React.Fragment key={group.outletId}>
                      <QueueGroupHeaderRow group={group} />
                      {group.orders.map((ord: QueuedOrder) => (
                        <QueueTableRow
                          key={ord.id}
                          order={ord}
                          showDestination={false}
                          onSelect={onSelectOrder}
                        />
                      ))}
                      <QueueGroupTotalRow group={group} />
                    </React.Fragment>
                  ))
                : paginatedOrders.map((ord: QueuedOrder) => (
                    <QueueTableRow
                      key={ord.id}
                      order={ord}
                      showDestination={true}
                      onSelect={onSelectOrder}
                    />
                  ))}
            </TableBody>
          </table>
        </div>
      </TooltipProvider>
    </Card>
  );
}
