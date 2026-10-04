import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { OrderDetailSheet } from "@/components/dispatcher/order-detail-sheet";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  useDeferrals,
  DeferralsKpiBar,
  DeferralsKpiHeader,
  DeferralsFilterToolbar,
  DeferralsCarryoverTable,
  DeferralsAuditKpiBar,
  DeferralsAuditFilterToolbar,
  DeferralsAuditTable,
} from "@/features/dispatcher";
import { DeferralsHeader } from "@/features/dispatcher/components/deferrals-header";

interface DeferralsPageProps {
  viewMode?: "carryover" | "deferral-log" | "audit-log";
  isLoading?: boolean;
}

export function DeferralsPage({
  viewMode = "carryover",
  isLoading = false,
}: DeferralsPageProps = {}) {
  const d = useDeferrals(viewMode);
  const effectiveLoading = isLoading;

  const carryoverFromCount =
    d.filteredCarryover.length === 0
      ? 0
      : d.carryoverGroupBy === "none"
        ? (d.carryoverPage - 1) * d.carryoverPageSize + 1
        : 1;
  const carryoverToCount =
    d.carryoverGroupBy === "none"
      ? Math.min(d.carryoverPage * d.carryoverPageSize, d.filteredCarryover.length)
      : d.filteredCarryover.length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <DeferralsHeader isAuditLog={d.isAuditLog} onExportJson={d.handleExportJson} />

      {!d.isAuditLog ? (
        <>
          <DeferralsKpiHeader kpis={d.carryoverKPIs} />
          <DeferralsKpiBar orders={d.carryoverOrders} />
          <DeferralsFilterToolbar
            searchQuery={d.carryoverSearch}
            brandFilter={d.carryoverBrandFilter}
            groupBy={d.carryoverGroupBy}
            onSearchChange={(search) => d.updateQueryParams({ search, page: 1 })}
            onBrandChange={(brand) => d.updateQueryParams({ brand, page: 1 })}
            onGroupByChange={(group) => d.updateQueryParams({ group })}
          />
        </>
      ) : (
        <>
          <DeferralsAuditKpiBar totalRecords={d.auditLogsCount} />
          <DeferralsAuditFilterToolbar
            searchQuery={d.auditSearch}
            reasonFilter={d.auditReasonFilter}
            resourceFilter={d.auditResourceFilter}
            groupBy={d.auditGroupBy}
            onSearchChange={(search) => d.updateQueryParams({ search, page: 1 })}
            onReasonChange={(reason) => d.updateQueryParams({ reason, page: 1 })}
            onResourceChange={(resource) => d.updateQueryParams({ resource, page: 1 })}
            onGroupByChange={(group) => d.updateQueryParams({ group })}
          />
        </>
      )}

      <div className="flex-1 min-h-0 margin-responsive py-4 sm:py-5 overflow-hidden flex flex-col">
        {!d.isAuditLog ? (
          effectiveLoading ? (
            <TableSkeleton columns={8} rowCount={5} />
          ) : (
            <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
              <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <div className="text-muted-foreground text-[11px] tabular-nums">
                  Showing{" "}
                  <span className="font-bold text-foreground">{carryoverFromCount}</span>{" "}
                  to <span className="font-bold text-foreground">{carryoverToCount}</span>{" "}
                  of{" "}
                  <span className="font-bold text-foreground">
                    {d.filteredCarryover.length}
                  </span>{" "}
                  orders
                </div>

                {d.carryoverGroupBy === "none" && (
                  <TablePagination
                    currentPage={d.carryoverPage}
                    totalPages={d.totalCarryoverPages}
                    onPageChange={(page) => d.updateQueryParams({ page })}
                  />
                )}
              </div>

              <DeferralsCarryoverTable
                groupBy={d.carryoverGroupBy}
                groupedCarryover={d.groupedCarryover}
                paginatedCarryover={d.paginatedCarryover}
                onSelectOrderRef={(ref) => d.updateQueryParams({ order: ref })}
              />
            </Card>
          )
        ) : effectiveLoading ? (
          <TableSkeleton columns={8} rowCount={5} />
        ) : (
          <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="px-4 py-2.5 bg-muted/25 border-b border-border/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="text-muted-foreground text-[11px] tabular-nums">
                Showing{" "}
                <span className="font-bold text-foreground">
                  {d.filteredAuditLogs.length === 0
                    ? 0
                    : (d.auditPage - 1) * d.auditPageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-foreground">
                  {Math.min(d.auditPage * d.auditPageSize, d.filteredAuditLogs.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-foreground">
                  {d.filteredAuditLogs.length}
                </span>{" "}
                records
              </div>

              {d.auditGroupBy === "none" && (
                <TablePagination
                  currentPage={d.auditPage}
                  totalPages={d.totalAuditPages}
                  onPageChange={(page) => d.updateQueryParams({ page })}
                />
              )}
            </div>

            <DeferralsAuditTable
              auditGroupBy={d.auditGroupBy}
              groupedAuditLogs={d.groupedAuditLogs}
              paginatedAuditLogs={d.paginatedAuditLogs}
              auditSortKey={d.auditSortKey}
              auditSortDirection={d.auditSortDirection}
              onSort={(key) =>
                d.updateQueryParams(
                  d.auditSortKey === key
                    ? d.auditSortDirection === "asc"
                      ? { sort: key, dir: "desc" }
                      : { sort: null, dir: null }
                    : { sort: key, dir: "asc" }
                )
              }
              onSelectOrderRef={(ref) => d.updateQueryParams({ order: ref })}
            />
          </Card>
        )}
      </div>

      <OrderDetailSheet
        open={Boolean(d.orderParam)}
        order={d.selectedOrder}
        onOpenChange={(open) => !open && d.updateQueryParams({ order: null })}
      />
    </div>
  );
}

export default DeferralsPage;
