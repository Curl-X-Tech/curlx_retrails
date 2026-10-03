import { UserIcon, ArrowSquareOutIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import { IconButton } from "@/components/ui/icon-button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { getReasonLabel } from "./deferrals-carryover-row";
import { getResourceBadge } from "./deferrals-audit-filter-toolbar";
import type { DeferralAuditRecord } from "../types";

interface DeferralsAuditRowProps {
  log: DeferralAuditRecord;
  onSelectOrderRef: (orderRef: string) => void;
}

export function DeferralsAuditRow({
  log,
  onSelectOrderRef,
}: DeferralsAuditRowProps) {
  return (
    <TableRow
      key={log.id}
      onClick={() => onSelectOrderRef(log.orderRef)}
      className="border-border/30 hover:bg-muted/30 cursor-pointer text-xs"
    >
      <TableCell className="font-semibold text-foreground py-2.5 px-4 whitespace-nowrap">
        {log.dispatchDate}
      </TableCell>

      <TableCell className="font-bold text-foreground py-2.5 px-4 whitespace-nowrap relative">
        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r" />
        <div className="flex items-center gap-2 pl-1">
          <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>#{log.orderRef}</span>
        </div>
      </TableCell>

      <TableCell>
        <div>
          <span className="font-bold text-xs text-foreground block truncate max-w-[180px]">
            {log.outletName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {log.outletId} • {log.district}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="font-semibold text-foreground text-[11px] block truncate max-w-[160px] cursor-help">
                {getReasonLabel(log.deferralReason)}
              </span>
            }
          />
          <TooltipContent className="max-w-xs">
            <span>{log.notes}</span>
          </TooltipContent>
        </Tooltip>
      </TableCell>

      <TableCell>
        <Badge
          variant="secondary"
          className="text-[10px] font-semibold px-1.5 py-0.5"
        >
          {getResourceBadge(log.limitingResource)}
        </Badge>
      </TableCell>

      <TableCell className="text-right font-bold text-foreground">
        {log.totalWeightKg} kg
      </TableCell>

      <TableCell className="text-right font-bold text-foreground">
        LKR {log.totalValueLkr.toLocaleString()}
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-1.5">
          <UserIcon className="size-3 text-muted-foreground shrink-0" />
          <div>
            <span className="font-semibold text-xs text-foreground block leading-tight">
              {log.decisionMakerName}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {log.decisionMakerStaffId}
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell className="text-right">
        <IconButton
          variant="ghost"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onSelectOrderRef(log.orderRef);
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
