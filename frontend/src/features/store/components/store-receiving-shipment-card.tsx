import { useNavigate } from "react-router-dom";
import { PlusIcon, SnowflakeIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/shared/table-pagination";
import { StoreReceivingStage, getReceivingActionLabel } from "./store-receiving-stage";
import type { InboundShipment } from "../types";

interface StoreReceivingCardsProps {
  shipments: InboundShipment[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onInspect: (shipment: InboundShipment) => void;
}

export function StoreReceivingShipmentCard({
  shipment,
  onInspect,
}: {
  shipment: InboundShipment;
  onInspect: (shipment: InboundShipment) => void;
}) {
  return (
    <Card
      onClick={() => onInspect(shipment)}
      className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-xs text-primary tabular-nums">
              {shipment.orderRef}
            </span>
            {shipment.isUrgent && (
              <Badge
                variant="destructive"
                className="text-[9px] px-1 py-0 h-3.5 font-bold uppercase"
              >
                Urgent
              </Badge>
            )}
            {shipment.tempRequirement === "chilled" && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 gap-0.5">
                <SnowflakeIcon className="size-2.5" />
                COL
              </Badge>
            )}
          </div>
          <p className="font-semibold text-foreground text-xs mt-1">
            {shipment.outletName}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {shipment.district} • {shipment.depot}
          </p>
        </div>
      </div>

      <StoreReceivingStage status={shipment.status} />

      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border text-center text-xs">
        <div className="bg-muted/30 p-1.5 rounded-lg">
          <span className="text-[9px] text-muted-foreground block">Packages</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            {shipment.totalPackages}
          </span>
        </div>
        <div className="bg-muted/30 p-1.5 rounded-lg">
          <span className="text-[9px] text-muted-foreground block">Weight</span>
          <span className="font-bold text-foreground text-[11px] tabular-nums">
            {shipment.totalWeightKg.toFixed(1)} kg
          </span>
        </div>
        <div className="bg-muted/30 p-1.5 rounded-lg">
          <span className="text-[9px] text-muted-foreground block">Valuation</span>
          <span className="font-bold text-primary text-[11px] tabular-nums">
            {(shipment.totalValueLkr / 1000).toFixed(0)}k LKR
          </span>
        </div>
      </div>

      <div
        className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] text-muted-foreground">
          Delivery: {shipment.requiredDate}
        </span>
        <Button
          variant={shipment.status === "in_transit" ? "default" : "ghost"}
          size="xs"
          className="h-6 px-2 text-[10px] cursor-pointer"
          onClick={() => onInspect(shipment)}
        >
          {getReceivingActionLabel(shipment.status)}
        </Button>
      </div>
    </Card>
  );
}

export function StoreReceivingCards({
  shipments,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onInspect,
}: StoreReceivingCardsProps) {
  const navigate = useNavigate();

  if (shipments.length === 0) {
    return (
      <Card className="min-h-64 flex flex-col items-center justify-center gap-3 text-center rounded-2xl border-border">
        <p className="text-sm font-semibold text-foreground">
          No inbound deliveries for today
        </p>
        <p className="text-xs text-muted-foreground">
          Orders due today will appear here once they are allocated.
        </p>
        <Button
          size="xs"
          className="h-7 text-[11px] gap-1.5 cursor-pointer rounded-lg"
          onClick={() => navigate("/store/orders/new")}
        >
          <PlusIcon className="size-3" />
          Create Order
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4 flex-1 flex flex-col">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {shipments.map((s) => (
          <StoreReceivingShipmentCard key={s.id} shipment={s} onInspect={onInspect} />
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
        <span className="text-muted-foreground text-xs tabular-nums">
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount} deliveries
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
