import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { OrderDetailSheet } from "@/components/dispatcher/order-detail-sheet";
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
  onNavigateToOrder?: (orderRef: string) => void;
}

export function DeferralsPage({
  viewMode = "carryover",
  isLoading = false,
}: DeferralsPageProps = {}) {
  const d = useDeferrals(viewMode);
  const effectiveLoading = isLoading;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <DeferralsHeader isAuditLog={d.isAuditLog} onExportJson={d.handleExportJson} />

      {!d.isAuditLog ? (
        <DeferralsKpiHeader kpis={d.carryoverKPIs} />
      ) : (
        <DeferralsAuditKpiBar totalRecords={d.auditLogsCount} />
      )}

      <div className="flex-1 min-h-0 margin-responsive py-4 sm:py-5 overflow-hidden flex flex-col">
        {!d.isAuditLog ? (
          <>
            <DeferralsKpiBar />
            {effectiveLoading ? (
              <TableSkeleton columns={8} rowCount={5} />
            ) : (
              <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
                <DeferralsFilterToolbar
                  searchQuery={d.carryoverSearch}
                  brandFilter={d.carryoverBrandFilter}
                  groupBy={d.carryoverGroupBy}
                  totalFilteredCount={d.filteredCarryover.length}
                  currentPage={d.carryoverPage}
                  totalPages={d.totalCarryoverPages}
                  pageSize={d.carryoverPageSize}
                  onSearchChange={(search) => d.updateQueryParams({ search, page: 1 })}
                  onBrandChange={(brand) => d.updateQueryParams({ brand, page: 1 })}
                  onGroupByChange={(group) => d.updateQueryParams({ group })}
                  onPageChange={(page) => d.updateQueryParams({ page })}
                />
                <DeferralsCarryoverTable
                  groupBy={d.carryoverGroupBy}
                  groupedCarryover={d.groupedCarryover}
                  paginatedCarryover={d.paginatedCarryover}
                  onSelectOrderRef={(ref) => d.updateQueryParams({ order: ref })}
                />
              </Card>
            )}
          </>
        ) : effectiveLoading ? (
          <TableSkeleton columns={8} rowCount={5} />
        ) : (
          <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
            <DeferralsAuditFilterToolbar
              searchQuery={d.auditSearch}
              reasonFilter={d.auditReasonFilter}
              resourceFilter={d.auditResourceFilter}
              groupBy={d.auditGroupBy}
              totalFilteredCount={d.filteredAuditLogs.length}
              currentPage={d.auditPage}
              totalPages={d.totalAuditPages}
              pageSize={d.auditPageSize}
              onSearchChange={(search) => d.updateQueryParams({ search, page: 1 })}
              onReasonChange={(reason) => d.updateQueryParams({ reason, page: 1 })}
              onResourceChange={(resource) => d.updateQueryParams({ resource, page: 1 })}
              onGroupByChange={(group) => d.updateQueryParams({ group })}
              onPageChange={(page) => d.updateQueryParams({ page })}
            />
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
