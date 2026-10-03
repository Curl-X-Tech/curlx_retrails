import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { SortHeaderIcon } from "@/components/shared/sort-header-icon";
import type { AllocationSortKey } from "../types";

interface AllocationTableHeaderProps {
  sortKey: AllocationSortKey | null;
  sortDirection: "asc" | "desc";
  onSort: (key: AllocationSortKey) => void;
}

export function AllocationTableHeader({
  sortKey,
  sortDirection,
  onSort,
}: AllocationTableHeaderProps) {
  return (
    <TableHeader className="sticky top-0 z-20 bg-card shadow-2xs border-b border-border/80">
      <TableRow className="border-b border-border/80 hover:bg-transparent">
        <TableHead
          className="w-[130px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
          onClick={() => onSort("plateNumber")}
        >
          <div className="flex items-center gap-1">
            <span>Vehicle</span>
            <SortHeaderIcon
              active={sortKey === "plateNumber"}
              direction={sortDirection}
            />
          </div>
        </TableHead>
        <TableHead className="w-[190px] font-bold text-foreground text-xs">
          Route
        </TableHead>
        <TableHead className="w-[150px] font-bold text-foreground text-xs">
          Driver
        </TableHead>
        <TableHead
          className="w-[80px] text-center cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
          onClick={() => onSort("crates")}
        >
          <div className="flex items-center justify-center gap-1">
            <span>Crates</span>
            <SortHeaderIcon active={sortKey === "crates"} direction={sortDirection} />
          </div>
        </TableHead>
        <TableHead
          className="w-[180px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
          onClick={() => onSort("weight")}
        >
          <div className="flex items-center gap-1">
            <span>Weight Load</span>
            <SortHeaderIcon active={sortKey === "weight"} direction={sortDirection} />
          </div>
        </TableHead>
        <TableHead
          className="w-[180px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
          onClick={() => onSort("volume")}
        >
          <div className="flex items-center gap-1">
            <span>Volume Load</span>
            <SortHeaderIcon active={sortKey === "volume"} direction={sortDirection} />
          </div>
        </TableHead>
        <TableHead
          className="w-[100px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
          onClick={() => onSort("departure")}
        >
          <div className="flex items-center gap-1">
            <span>Departure</span>
            <SortHeaderIcon active={sortKey === "departure"} direction={sortDirection} />
          </div>
        </TableHead>
        <TableHead
          className="w-[100px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
          onClick={() => onSort("status")}
        >
          <div className="flex items-center gap-1">
            <span>Status</span>
            <SortHeaderIcon active={sortKey === "status"} direction={sortDirection} />
          </div>
        </TableHead>
        <TableHead className="w-[60px] text-right font-bold text-foreground text-xs">
          Action
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
