import {
  TruckIcon,
  PhoneIcon,
  ClockIcon,
  SnowflakeIcon,
  PackageIcon,
  ScalesIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { InboundShipment } from "../types";

interface StoreReceivingShipmentCardProps {
  shipment: InboundShipment;
  onInspect: (shipment: InboundShipment) => void;
}

export function StoreReceivingShipmentCard({
  shipment,
  onInspect,
}: StoreReceivingShipmentCardProps) {
  const isColdChain = shipment.tempRequirement === "chilled";
  const isDelivered = shipment.status === "delivered";
  const isDiscrepancy = shipment.status === "discrepancy";
  const isDocked = shipment.status === "docked";

  return (
    <div className="bg-card border border-border/70 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-border transition-all">
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm tracking-tight text-foreground">
                {shipment.vehicleNo}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {shipment.tripId}
              </span>
              {isColdChain && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-900 text-cyan-100 dark:bg-cyan-950 dark:text-cyan-200">
                  <SnowflakeIcon className="size-3" weight="bold" />
                  {shipment.reeferTempC !== undefined
                    ? `${shipment.reeferTempC.toFixed(1)}°C`
                    : "REEFER"}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span className="font-mono">{shipment.orderRef}</span>
              <span>•</span>
              <span>{shipment.outletName}</span>
            </div>
          </div>

          <div>
            {isDocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-emerald-600 text-white">
                <TruckIcon className="size-3.5" weight="bold" />
                Docked at Bay
              </span>
            )}
            {shipment.status === "in_transit" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-sky-700 text-white">
                <ClockIcon className="size-3.5" weight="bold" />
                In Transit
              </span>
            )}
            {isDelivered && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-slate-700 text-slate-100">
                <CheckCircleIcon className="size-3.5" weight="bold" />
                Received
              </span>
            )}
            {isDiscrepancy && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-rose-600 text-white">
                <WarningCircleIcon className="size-3.5" weight="bold" />
                Discrepancy
              </span>
            )}
          </div>
        </div>

        {/* Driver & ETA strip */}
        <div className="grid grid-cols-2 gap-3 p-2.5 bg-muted/30 rounded-lg text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Driver
            </span>
            <div className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
              <span>{shipment.driverName}</span>
              <a
                href={`tel:${shipment.driverPhone}`}
                className="text-muted-foreground hover:text-foreground"
                title={shipment.driverPhone}
              >
                <PhoneIcon className="size-3" />
              </a>
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              {isDelivered ? "Delivered At" : "ETA / Dock"}
            </span>
            <div className="font-mono font-medium text-foreground mt-0.5">
              {isDelivered ? shipment.deliveredAt : shipment.eta}
            </div>
          </div>
        </div>

        {/* Manifest Metrics */}
        <div className="grid grid-cols-3 gap-2 py-1 border-y border-border/50 text-center text-xs">
          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <PackageIcon className="size-3" /> Packages
            </div>
            <div className="font-bold text-foreground font-mono mt-0.5">
              {shipment.totalPackages}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <ScalesIcon className="size-3" /> Weight
            </div>
            <div className="font-bold text-foreground font-mono mt-0.5">
              {shipment.totalWeightKg.toFixed(1)} kg
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <CurrencyDollarIcon className="size-3" /> Value
            </div>
            <div className="font-bold text-foreground font-mono mt-0.5">
              LKR {shipment.totalValueLkr.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Item List Preview */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Shipment Items ({shipment.items.length})
          </span>
          <div className="space-y-1 text-xs">
            {shipment.items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-muted-foreground py-0.5 border-b border-border/30 last:border-0"
              >
                <span className="truncate max-w-[200px] text-foreground">
                  {item.name}
                </span>
                <span className="font-mono font-medium shrink-0 ml-2">
                  {item.quantity} {item.unit}s
                </span>
              </div>
            ))}
            {shipment.items.length > 3 && (
              <div className="text-[11px] text-muted-foreground italic">
                + {shipment.items.length - 3} more items...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-border/50">
        <Button
          className="w-full h-9 text-xs font-semibold"
          variant={isDelivered || isDiscrepancy ? "outline" : "default"}
          onClick={() => onInspect(shipment)}
        >
          {isDelivered || isDiscrepancy ? "View Receiving Slip" : "Inspect & Receive"}
        </Button>
      </div>
    </div>
  );
}
