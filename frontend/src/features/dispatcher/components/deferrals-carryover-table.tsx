import * as React from "react";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DeferralsGroupHeader } from "./deferrals-group-header";
import { DeferralsCarryoverRow } from "./deferrals-carryover-row";
import type { CarryoverOrder, CarryoverGroupBy } from "../types";

interface GroupedCarryover {
  key: string;
  title: string;
  description?: string;
  items: CarryoverOrder[];
  totalWeightKg: number;
  totalVolumeM3: number;
  totalValueLkr: number;
}

interface DeferralsCarryoverTableProps {
  groupBy: CarryoverGroupBy;
  groupedCarryover: GroupedCarryover[] | null;
  paginatedCarryover: CarryoverOrder[];
  onSelectOrderRef: (orderRef: string) => void;
}

export function DeferralsCarryoverTable({
  groupBy,
  groupedCarryover,
  paginatedCarryover,
  onSelectOrderRef,
}: DeferralsCarryoverTableProps) {
  return (
    <TooltipProvider delay={100}>
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <TableHeader className="sticky top-0 z-20 bg-card shadow-2xs border-b border-border/80">
            <TableRow className="border-b border-border/80 hover:bg-transparent">
              <TableHead className="w-[140px] font-bold text-foreground text-xs">
                Order
              </TableHead>
              <TableHead className="w-[220px] font-bold text-foreground text-xs">
                Destination Store
              </TableHead>
              <TableHead className="w-[90px] font-bold text-foreground text-xs">
                Temp Zone
              </TableHead>
              <TableHead className="w-[110px] text-right font-bold text-foreground text-xs">
                Weight
              </TableHead>
              <TableHead className="w-[100px] text-right font-bold text-foreground text-xs">
                Volume
              </TableHead>
              <TableHead className="w-[130px] text-right font-bold text-foreground text-xs">
                Value (LKR)
              </TableHead>
              <TableHead className="w-[170px] font-bold text-foreground text-xs">
                Deferral Reason
              </TableHead>
              <TableHead className="w-[170px] font-bold text-foreground text-xs">
                Recommended Fleet
              </TableHead>
              <TableHead className="w-[60px] text-right font-bold text-foreground text-xs">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {groupBy !== "none" && groupedCarryover
              ? groupedCarryover.map((group) => (
                  <React.Fragment key={group.key}>
                    <DeferralsGroupHeader
                      title={group.title}
                      itemCount={group.items.length}
                      description={group.description}
                      totalWeightKg={group.totalWeightKg}
                      totalVolumeM3={group.totalVolumeM3}
                      totalValueLkr={group.totalValueLkr}
                      colSpan={9}
                    />
                    {group.items.map((ord) => (
                      <DeferralsCarryoverRow
                        key={ord.id}
                        order={ord}
                        onSelectOrderRef={onSelectOrderRef}
                      />
                    ))}
                  </React.Fragment>
                ))
              : paginatedCarryover.map((ord) => (
                  <DeferralsCarryoverRow
                    key={ord.id}
                    order={ord}
                    onSelectOrderRef={onSelectOrderRef}
                  />
                ))}
          </TableBody>
        </table>
      </div>
    </TooltipProvider>
  );
}
