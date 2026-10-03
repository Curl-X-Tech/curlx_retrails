import { FileTextIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { OrderDetailSheet } from "@/components/dispatcher/order-detail-sheet";
import { useSimulatedLoading } from "@/lib/simulated-delay";
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

  const isSimulatedLoading = useSimulatedLoading([
    d.carryoverSearch,
    d.carryoverBrandFilter,
    d.carryoverGroupBy,
    d.carryoverPage,
    d.auditSearch,
    d.auditReasonFilter,
    d.auditResourceFilter,
    d.auditGroupBy,
    d.auditSortKey,
    d.auditSortDirection,
    d.auditPage,
  ]);
  const effectiveLoading = isLoading || isSimulatedLoading;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
        <div>
          <h1 className="text-lg font-heading font-black tracking-tight text-foreground">
            {d.isAuditLog ? "Deferral Audit Log" : "Active Carryover & Next-Day Planning"}
          </h1>
          <p className="text-[11px] text-muted-foreground">
            {d.isAuditLog
              ? "Peliyagoda Depot | Historical Deferral Records & Dispatcher Accountability"
              : "Peliyagoda Depot | Next-Day Pre-Allocation & 2-Day Consecutive Skip Protection"}
          </p>
        </div>
        {d.isAuditLog && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
              onClick={d.handleExportJson}
            >
              <FileTextIcon className="size-3 text-muted-foreground" />
              <span>Export Audit Log</span>
            </Button>
          </div>
        )}
      </div>

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
