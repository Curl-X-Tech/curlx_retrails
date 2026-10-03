import {
  WarningOctagonIcon,
  SnowflakeIcon,
  LockKeyIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react";
import { TableRow, TableCell } from "@/components/ui/table";
import { IconButton } from "@/components/ui/icon-button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { CarryoverOrder } from "../types";

export function getReasonLabel(reason: string) {
  switch (reason) {
    case "insufficient_reefer_capacity": return "Reefer Capacity Saturated";
    case "van_access_shortage": return "Van Access Shortage";
    case "time_budget_limit": return "Time Budget Exceeded";
    case "fuel_quota_exceeded": return "Fleet Downtime / Maintenance";
    default: return reason.replace(/_/g, " ");
  }
}

interface DeferralsCarryoverRowProps {
  order: CarryoverOrder;
  onSelectOrderRef: (orderRef: string) => void;
}

export function DeferralsCarryoverRow({
  order: ord,
  onSelectOrderRef,
}: DeferralsCarryoverRowProps) {
  const isMandatory = ord.deferredYesterday === 1;
  const isCold = ord.tempRequirement === "chilled";

  return (
    <TableRow
      key={ord.id}
      onClick={() => onSelectOrderRef(ord.orderRef)}
      className="border-border/30 hover:bg-muted/30 cursor-pointer text-xs"
    >
      <TableCell className="font-bold text-foreground py-2.5 px-4 whitespace-nowrap relative">
        <span
          className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r ${
            isMandatory ? "bg-red-500" : "bg-amber-500"
          }`}
        />
        <Tooltip>
          <TooltipTrigger
            render={
              <div className="flex items-center gap-2 pl-1 cursor-help group/ref">
                <span className={`size-1.5 rounded-full shrink-0 ${isMandatory ? "bg-red-500" : "bg-amber-500"}`} />
                <span className="group-hover/ref:text-primary transition-colors">#{ord.orderRef}</span>
                {isMandatory && <LockKeyIcon className="size-3 text-red-500 shrink-0" weight="bold" />}
              </div>
            }
          />
          <TooltipContent className="flex items-center gap-1.5 p-1.5">
            <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              Waypoint {ord.brand}
            </span>
            {isMandatory ? (
              <span className="text-red-700 bg-red-100 dark:bg-red-950 text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                <WarningOctagonIcon className="size-2.5" weight="bold" />
                Mandatory Serve Tomorrow (Consecutive Skip Lock)
              </span>
            ) : (
              <span className="text-amber-700 bg-amber-100 dark:bg-amber-950 text-[11px] font-bold px-1.5 py-0.5 rounded">
                Carryover to Wave 1
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      </TableCell>

      <TableCell>
        <div>
          <span className="font-bold text-xs text-foreground block truncate max-w-[200px]">{ord.outletName}</span>
          <span className="text-[10px] text-muted-foreground">{ord.outletId} • {ord.district} ({ord.dockType.replace("_", " ")})</span>
        </div>
      </TableCell>

      <TableCell>
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
            isCold ? "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300" : "bg-muted text-foreground"
          }`}
        >
          {isCold && <SnowflakeIcon className="size-2.5 shrink-0" />}
          <span className="capitalize">{ord.tempRequirement}</span>
        </span>
      </TableCell>

      <TableCell className="text-right font-bold text-foreground">
        {ord.totalWeightKg.toLocaleString()} kg
      </TableCell>
      <TableCell className="text-right font-medium text-foreground">
        {ord.totalVolumeM3} m³
      </TableCell>
      <TableCell className="text-right font-bold text-foreground">
        LKR {ord.totalValueLkr.toLocaleString()}
      </TableCell>

      <TableCell>
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="text-[11px] font-medium text-foreground block truncate max-w-[160px] cursor-help">
                {getReasonLabel(ord.deferralReason)}
              </span>
            }
          />
          <TooltipContent className="max-w-xs">
            <span>{ord.notes || getReasonLabel(ord.deferralReason)}</span>
          </TooltipContent>
        </Tooltip>
      </TableCell>

      <TableCell>
        <span className="text-[11px] font-semibold text-muted-foreground block truncate max-w-[160px]">
          {ord.suggestedVehicleCategory}
        </span>
      </TableCell>

      <TableCell className="text-right">
        <IconButton
          variant="ghost"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onSelectOrderRef(ord.orderRef);
          }}
          className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
          title="Inspect Order"
        >
          <ArrowSquareOutIcon className="size-3.5" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
