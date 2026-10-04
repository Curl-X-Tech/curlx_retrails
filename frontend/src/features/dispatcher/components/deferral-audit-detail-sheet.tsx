import {
  ScalesIcon,
  CubeIcon,
  CurrencyDollarIcon,
  UserIcon,
  ClockIcon,
  CalendarCheckIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { getReasonLabel } from "./deferrals-carryover-row";
import { getResourceBadge } from "./deferrals-audit-filter-toolbar";
import { OrderDetailItemsTable } from "@/components/dispatcher/order-detail-items-table";
import { CopyableId } from "@/components/shared";
import type { DeferralAuditRecord, QueuedOrder } from "../types";

interface DeferralAuditDetailSheetProps {
  log: DeferralAuditRecord | null;
  order: QueuedOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeferralAuditDetailSheet({
  log,
  order,
  open,
  onOpenChange,
}: DeferralAuditDetailSheetProps) {
  if (!log && !order) return null;

  const orderRef = log?.orderRef || order?.orderRef || "N/A";
  const outletName = log?.outletName || order?.outletName || "Outlet Store";
  const brand = log?.brand || order?.brand || "Fresh";
  const district = log?.district || order?.district || "Colombo";
  const weightKg = log?.totalWeightKg || order?.totalWeightKg || 0;
  const volumeM3 = log?.totalVolumeM3 || order?.totalVolumeM3 || 0;
  const valueLkr = log?.totalValueLkr || order?.totalOrderValueLkr || 0;
  const tempReq = log?.tempRequirement || order?.tempRequirement || "ambient";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full data-[side=right]:sm:max-w-2xl data-[side=right]:md:max-w-3xl data-[side=right]:lg:max-w-4xl p-0 flex flex-col h-full bg-card border-l border-border/80 shadow-2xl"
      >
        <SheetHeader className="p-5 border-b border-border/80 bg-muted/20 shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SheetTitle className="font-heading font-black text-xl text-foreground tracking-tight">
                Deferral Audit #{orderRef}
              </SheetTitle>
              <CopyableId id={log?.outletId || order?.outletId || ""} />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" className="text-xs font-semibold uppercase">
                {brand}
              </Badge>
              <Badge
                variant={tempReq === "chilled" ? "info" : "secondary"}
                className="text-xs font-semibold capitalize"
              >
                {tempReq}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{outletName}</span>
            <span>•</span>
            <span>{district} District</span>
            {log?.dispatchDate && (
              <>
                <span>•</span>
                <span className="font-medium">
                  Scheduled Dispatch: {log.dispatchDate}
                </span>
              </>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {log && (
            <div className="p-4 bg-muted/40 border border-border/80 rounded-xl space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Audit Decision Record
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Deferral Reason
                  </span>
                  <span className="font-bold text-foreground text-sm">
                    {getReasonLabel(log.deferralReason)}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Limiting Resource
                  </span>
                  <div className="mt-0.5">
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {getResourceBadge(log.limitingResource)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Decision Maker
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <UserIcon className="size-3.5 text-muted-foreground" />
                    <span className="font-bold text-foreground">
                      {log.decisionMakerName}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      ({log.decisionMakerRole})
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Audit Timestamp
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[11px] text-foreground">
                    <CalendarCheckIcon className="size-3.5 text-muted-foreground" />
                    <span>
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString()
                        : log.dispatchDate}
                    </span>
                  </div>
                </div>
              </div>

              {log.notes && (
                <div className="pt-2 border-t border-border/60 text-xs">
                  <span className="text-muted-foreground block text-[11px] font-semibold">
                    Dispatcher Rationale
                  </span>
                  <p className="text-foreground mt-0.5 leading-relaxed bg-background/80 p-2.5 rounded-lg border border-border/50">
                    {log.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-background border border-border/70 rounded-xl">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
                <span>Total Weight</span>
              </div>
              <p className="font-heading font-black text-sm text-foreground mt-1">
                {weightKg.toLocaleString()} kg
              </p>
            </div>

            <div className="p-3 bg-background border border-border/70 rounded-xl">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
                <span>Total Volume</span>
              </div>
              <p className="font-heading font-black text-sm text-foreground mt-1">
                {volumeM3.toFixed(2)} m³
              </p>
            </div>

            <div className="p-3 bg-background border border-border/70 rounded-xl">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <CurrencyDollarIcon className="size-3.5 text-amber-600 shrink-0" />
                <span>Valuation</span>
              </div>
              <p className="font-heading font-black text-sm text-foreground mt-1">
                LKR {valueLkr.toLocaleString()}
              </p>
            </div>

            <div className="p-3 bg-background border border-border/70 rounded-xl">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <ClockIcon className="size-3.5 text-sky-600 shrink-0" />
                <span>Delivery Window</span>
              </div>
              <p className="font-semibold text-xs text-foreground mt-1 truncate">
                {order?.deliveryWindow || "06:00 - 10:00 AM"}
              </p>
            </div>
          </div>

          {order?.items && order.items.length > 0 && (
            <OrderDetailItemsTable items={order.items} />
          )}
        </div>

        <SheetFooter className="p-4 border-t border-border/80 bg-muted/20 shrink-0 flex flex-row items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Audit ID: {log?.id || orderRef}
          </span>
          <SheetClose
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 text-xs font-semibold cursor-pointer rounded-lg"
              >
                Close
              </Button>
            }
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
