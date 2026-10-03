import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { SortHeaderIcon } from "@/components/shared/sort-header-icon";
import type { QueueSortKey } from "../types";

interface QueueTableHeaderProps {
  groupByStore: boolean;
  sortKey: QueueSortKey | null;
  sortDirection: "asc" | "desc";
  onSort: (key: QueueSortKey) => void;
}

export function QueueTableHeader({
  groupByStore,
  sortKey,
  sortDirection,
  onSort,
}: QueueTableHeaderProps) {
  return (
    <TableHeader className="sticky top-0 z-20 bg-card shadow-2xs border-b border-border/80">
      <TableRow className="border-b border-border/80 hover:bg-transparent">
        <TableHead
          className="w-[150px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
          onClick={() => onSort("orderRef")}
        >
          <div className="flex items-center gap-1">
            <span>Order</span>
            <SortHeaderIcon active={sortKey === "orderRef"} direction={sortDirection} />
          </div>
        </TableHead>

        {!groupByStore && (
          <TableHead
            className="w-[200px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
            onClick={() => onSort("outlet")}
          >
            <div className="flex items-center gap-1">
              <span>Destination</span>
              <SortHeaderIcon active={sortKey === "outlet"} direction={sortDirection} />
            </div>
          </TableHead>
        )}

        <TableHead className="w-[100px] font-bold text-foreground text-xs">Temp Zone</TableHead>
        <TableHead className="w-[85px] text-center font-bold text-foreground text-xs">Packages</TableHead>

        <TableHead
          className="w-[120px] text-right cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
          onClick={() => onSort("weight")}
        >
          <div className="flex items-center justify-end gap-1">
            <span>Total Weight</span>
            <SortHeaderIcon active={sortKey === "weight"} direction={sortDirection} />
          </div>
        </TableHead>

        <TableHead
          className="w-[110px] text-right cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
          onClick={() => onSort("volume")}
        >
          <div className="flex items-center justify-end gap-1">
            <span>Volume</span>
            <SortHeaderIcon active={sortKey === "volume"} direction={sortDirection} />
          </div>
        </TableHead>

        <TableHead
          className="w-[130px] text-right cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
          onClick={() => onSort("value")}
        >
          <div className="flex items-center justify-end gap-1">
            <span>Order Value</span>
            <SortHeaderIcon active={sortKey === "value"} direction={sortDirection} />
          </div>
        </TableHead>

        <TableHead
          className="w-[130px] cursor-pointer hover:text-primary select-none transition-colors font-bold text-foreground text-xs"
          onClick={() => onSort("window")}
        >
          <div className="flex items-center gap-1">
            <span>Delivery Window</span>
            <SortHeaderIcon active={sortKey === "window"} direction={sortDirection} />
          </div>
        </TableHead>

        <TableHead className="w-[50px] text-right font-bold text-foreground text-xs">Action</TableHead>
      </TableRow>
    </TableHeader>
  );
}
