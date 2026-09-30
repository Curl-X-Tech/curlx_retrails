import {
  ScalesIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  StorefrontIcon,
  WarningOctagonIcon,
  SnowflakeIcon,
  SunIcon,
  TagIcon,
  ShieldCheckIcon,
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { QueuedOrder } from "@/types";

interface OrderDetailSheetProps {
  order: QueuedOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function OrderDetailSheet({
  order,
  open,
  onOpenChange,
  className,
}: OrderDetailSheetProps) {
  if (!order) return null;

  const isChilled = order.tempRequirement === "chilled";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`w-full data-[side=right]:sm:max-w-2xl data-[side=right]:md:max-w-3xl data-[side=right]:lg:max-w-4xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 flex flex-col h-full bg-card border-l border-border/80 shadow-2xl ${className || ""}`}
      >
        <SheetHeader className="p-5 border-b border-border/80 bg-muted/20 shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SheetTitle className="font-heading font-black text-xl text-foreground tracking-tight">
                Order #{order.orderRef}
              </SheetTitle>
              <Badge
                variant="outline"
                className="text-xs font-semibold px-2 py-0.5 border-border/80"
              >
                {order.outletId}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {order.deferredYesterday === 1 && (
                <Badge
                  variant="destructive"
                  className="text-[10px] font-bold px-2 py-0.5 gap-1"
                >
                  <WarningOctagonIcon className="size-3" weight="bold" />
                  <span>Deferred Yesterday</span>
                </Badge>
              )}

              {order.isUrgent && (
                <Badge
                  variant="default"
                  className="bg-amber-600 hover:bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5"
                >
                  Urgent
                </Badge>
              )}

              <Badge
                variant={isChilled ? "default" : "secondary"}
                className={`text-[10px] font-bold px-2 py-0.5 gap-1 ${
                  isChilled ? "bg-sky-600 hover:bg-sky-600 text-white" : ""
                }`}
              >
                {isChilled ? (
                  <SnowflakeIcon className="size-3" weight="bold" />
                ) : (
                  <SunIcon className="size-3" weight="bold" />
                )}
                <span className="capitalize">{order.tempRequirement}</span>
              </Badge>

              <Badge
                variant="outline"
                className="text-[10px] font-bold px-2 py-0.5 border-primary/40 text-primary"
              >
                Waypoint {order.brand}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <StorefrontIcon className="size-4 text-primary shrink-0" />
            <span className="font-semibold text-foreground">{order.outletName}</span>
            <span>•</span>
            <span className="truncate">{order.outletAddress}</span>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-background border border-border/70 rounded-xl">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <ScalesIcon className="size-3.5 text-emerald-600 shrink-0" />
                <span>Total Weight</span>
              </div>
              <p className="font-heading font-black text-sm text-foreground mt-1">
                {order.totalWeightKg.toLocaleString()} kg
              </p>
            </div>

            <div className="p-3 bg-background border border-border/70 rounded-xl">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <CubeIcon className="size-3.5 text-violet-600 shrink-0" />
                <span>Total Volume</span>
              </div>
              <p className="font-heading font-black text-sm text-foreground mt-1">
                {order.totalVolumeM3.toFixed(2)} m³
              </p>
            </div>

            <div className="p-3 bg-background border border-border/70 rounded-xl">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <CurrencyDollarIcon className="size-3.5 text-amber-600 shrink-0" />
                <span>Order Valuation</span>
              </div>
              <p className="font-heading font-black text-sm text-foreground mt-1">
                LKR {order.totalOrderValueLkr.toLocaleString()}
              </p>
            </div>

            <div className="p-3 bg-background border border-border/70 rounded-xl">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <ClockIcon className="size-3.5 text-sky-600 shrink-0" />
                <span>Delivery Window</span>
              </div>
              <p className="font-semibold text-xs text-foreground mt-1 truncate">
                {order.deliveryWindow}
              </p>
            </div>
          </div>

          <div className="p-3 bg-muted/30 border border-border/60 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Dock Type:</span>
              <span className="font-bold text-foreground capitalize">
                {order.dockType.replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <TagIcon className="size-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Parking Constraint:</span>
              <span className="font-bold text-foreground capitalize">
                {order.parkingConstraint.replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Days Since Last Served:</span>
              <span className="font-bold text-foreground">
                {order.daysSinceLastServed} d
              </span>
            </div>
          </div>

          <div className="border border-border/80 rounded-xl overflow-hidden bg-background">
            <div className="p-3 bg-muted/40 border-b border-border/60 flex items-center justify-between">
              <span className="font-heading font-bold text-xs text-foreground tracking-tight">
                Package Line Items ({order.items.length})
              </span>
              <span className="text-[11px] text-muted-foreground">
                Total Units: {order.items.reduce((s, i) => s + i.requestedQty, 0)}
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/20">
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase h-9 px-4">
                    Package Code
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase h-9 px-4">
                    Item SKU & Description
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-center h-9 px-3">
                    Qty
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right h-9 px-3">
                    Weight
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right h-9 px-3">
                    Volume
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right h-9 px-4">
                    Total (LKR)
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-center h-9 px-3">
                    SHC
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id} className="border-border/40 text-xs">
                    <TableCell className="font-bold text-foreground py-2.5 px-4 whitespace-nowrap">
                      {item.packageCode}
                    </TableCell>
                    <TableCell className="py-2.5 px-4 max-w-[220px]">
                      <div className="font-medium text-foreground truncate">
                        {item.itemName}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {item.category} • {item.itemId}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-foreground py-2.5 px-3 whitespace-nowrap">
                      {item.requestedQty}
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground py-2.5 px-3 whitespace-nowrap">
                      {item.totalWeightKg.toFixed(1)} kg
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground py-2.5 px-3 whitespace-nowrap">
                      {item.totalVolumeM3.toFixed(2)} m³
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground py-2.5 px-4 whitespace-nowrap">
                      {item.totalPriceLkr.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center py-2.5 px-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold px-1.5 py-0 border-border/80"
                      >
                        {item.specialHandlingCode}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <SheetFooter className="p-4 border-t border-border/80 bg-muted/20 shrink-0 flex flex-row items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Target Date: {order.requiredDate} • Western Province Hub
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
