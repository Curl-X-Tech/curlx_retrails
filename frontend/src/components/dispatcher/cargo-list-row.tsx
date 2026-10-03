import { TableRow, TableCell } from "@/components/ui/table";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { CargoItem } from "@/data/mock-allocation-details";

interface CargoListRowProps {
  item: CargoItem;
}

export function CargoListRow({ item }: CargoListRowProps) {
  const isCold = item.shc === "COL";
  const isFragile = item.shc === "FRG";
  const isMall = item.shc === "MAL";
  const isHazard = item.shc === "HAZ";

  return (
    <TableRow className="border-border/40 hover:bg-muted/30 transition-colors text-xs">
      <TableCell className="font-semibold text-foreground py-2.5 px-4 whitespace-nowrap relative">
        {isCold ? (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-sky-500 rounded-r" />
        ) : isHazard ? (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r" />
        ) : isFragile ? (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-rose-500 rounded-r" />
        ) : null}
        <div className="flex items-center gap-2 pl-1">
          <span
            className={`size-1.5 rounded-full shrink-0 ${
              isCold
                ? "bg-sky-500"
                : isHazard
                  ? "bg-amber-500"
                  : isFragile
                    ? "bg-rose-500"
                    : "bg-primary"
            }`}
          />
          <span>{item.code}</span>
        </div>
      </TableCell>
      <TableCell className="font-bold text-foreground py-2.5 px-4 whitespace-nowrap">
        {item.weightKg} kg
      </TableCell>
      <TableCell className="text-muted-foreground py-2.5 px-4 whitespace-nowrap">
        {item.store}
      </TableCell>
      <TableCell className="font-medium text-foreground py-2.5 px-4 truncate max-w-[240px]">
        {item.destination}
      </TableCell>
      <TableCell className="text-right py-2.5 px-4 whitespace-nowrap">
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-help ${
                  isCold
                    ? "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                    : isHazard
                      ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                      : isFragile
                        ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                        : "bg-muted text-foreground"
                }`}
              >
                {item.shc}
              </span>
            }
          />
          <TooltipContent>
            <span>
              {isCold
                ? "Cold Chain Cargo (0°C to 4°C)"
                : isFragile
                  ? "Fragile Goods Handling"
                  : isMall
                    ? "Mall Bay Delivery Access"
                    : isHazard
                      ? "Hazardous Freight Requirements"
                      : item.shc}
            </span>
          </TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
