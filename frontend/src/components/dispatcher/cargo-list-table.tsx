import * as React from "react";
import { CaretDownIcon, CaretUpDownIcon } from "@phosphor-icons/react";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { CargoItem } from "@/types";
import { CargoListRow } from "./cargo-list-row";

export type CargoSortField = "code" | "weight" | null;
export type CargoSortOrder = "asc" | "desc";

export interface StopGroup {
  seq: number;
  name: string;
  items: CargoItem[];
  totalWeight: number;
}

interface CargoListTableProps {
  items: CargoItem[];
  stopGroups: StopGroup[];
  groupByStops: boolean;
  sortField: CargoSortField;
  sortOrder: CargoSortOrder;
  onSort: (field: CargoSortField) => void;
}

export function CargoListTable({
  items,
  stopGroups,
  groupByStops,
  sortField,
  sortOrder,
  onSort,
}: CargoListTableProps) {
  return (
    <div className="border border-border/80 rounded-xl overflow-hidden bg-background flex-1 min-h-0 flex flex-col">
      <TooltipProvider delay={100}>
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <TableHeader className="sticky top-0 z-20 bg-card shadow-2xs border-b border-border/80">
              <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                <TableHead
                  onClick={() => onSort("code")}
                  className="text-xs font-bold text-foreground cursor-pointer select-none whitespace-nowrap h-9 px-4 hover:text-primary transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>CARGO CODE</span>
                    {sortField === "code" ? (
                      <CaretDownIcon
                        className={`size-3 text-primary font-bold transition-transform ${
                          sortOrder === "desc" ? "rotate-180" : ""
                        }`}
                      />
                    ) : (
                      <CaretUpDownIcon className="size-3 text-muted-foreground/60" />
                    )}
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => onSort("weight")}
                  className="text-xs font-bold text-foreground cursor-pointer select-none whitespace-nowrap h-9 px-4 hover:text-primary transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>WEIGHT</span>
                    {sortField === "weight" ? (
                      <CaretDownIcon
                        className={`size-3 text-primary font-bold transition-transform ${
                          sortOrder === "desc" ? "rotate-180" : ""
                        }`}
                      />
                    ) : (
                      <CaretUpDownIcon className="size-3 text-muted-foreground/60" />
                    )}
                  </div>
                </TableHead>

                <TableHead className="text-xs font-bold text-foreground whitespace-nowrap h-9 px-4">
                  STORE
                </TableHead>

                <TableHead className="text-xs font-bold text-foreground whitespace-nowrap h-9 px-4">
                  DESTINATION
                </TableHead>

                <TableHead className="text-xs font-bold text-foreground text-right whitespace-nowrap h-9 px-4">
                  SHC
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {groupByStops
                ? stopGroups.map((group) => (
                    <React.Fragment key={group.seq}>
                      <TableRow className="bg-muted/60 hover:bg-muted/60 border-t border-b border-border/60">
                        <TableCell
                          colSpan={5}
                          className="py-2 px-4 text-xs font-heading font-bold text-foreground"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="size-4.5 rounded-full bg-foreground text-background font-bold text-[10px] flex items-center justify-center">
                                {group.seq}
                              </span>
                              <span>{group.name}</span>
                            </div>
                            <span className="text-[11px] font-normal text-muted-foreground">
                              {group.items.length}{" "}
                              {group.items.length === 1 ? "item" : "items"} •{" "}
                              {group.totalWeight} kg
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                      {group.items.map((item) => (
                        <CargoListRow key={item.id} item={item} />
                      ))}
                    </React.Fragment>
                  ))
                : items.map((item) => <CargoListRow key={item.id} item={item} />)}
            </TableBody>
          </table>
        </div>
      </TooltipProvider>
    </div>
  );
}
