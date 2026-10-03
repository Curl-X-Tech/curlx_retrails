import { SnowflakeIcon, ArrowSquareOutIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import { IconButton } from "@/components/ui/icon-button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CircularProgressRing } from "@/components/shared/circular-progress-ring";
import type { VehicleAllocation } from "../types";

export function getAllocationStatusBadge(status: VehicleAllocation["status"]) {
  switch (status) {
    case "dispatched":
      return (
        <Badge variant="default" className="text-[10px] h-5 px-2 font-semibold">
          Dispatched
        </Badge>
      );
    case "loading":
      return (
        <Badge variant="warning" className="text-[10px] h-5 px-2 font-semibold">
          Loading Bay
        </Badge>
      );
    case "allocated":
      return (
        <Badge variant="secondary" className="text-[10px] h-5 px-2 font-semibold">
          Allocated
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="success" className="text-[10px] h-5 px-2 font-semibold">
          Completed
        </Badge>
      );
    case "delayed":
      return (
        <Badge variant="destructive" className="text-[10px] h-5 px-2 font-semibold">
          Delayed
        </Badge>
      );
    default:
      return null;
  }
}

interface AllocationTableRowProps {
  alloc: VehicleAllocation;
  onSelect: (alloc: VehicleAllocation) => void;
}

export function AllocationTableRow({ alloc, onSelect }: AllocationTableRowProps) {
  const isColdChain =
    alloc.temperatureZone === "frozen" ||
    alloc.temperatureZone === "chilled" ||
    alloc.vehicleCategory === "freeze_lorry";

  return (
    <TableRow
      onClick={() => onSelect(alloc)}
      className="hover:bg-muted/30 cursor-pointer border-border/30"
    >
      <TableCell className="whitespace-nowrap relative">
        {alloc.status === "delayed" ? (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-destructive rounded-r" />
        ) : alloc.status === "loading" ? (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r" />
        ) : alloc.status === "dispatched" ? (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" />
        ) : alloc.status === "completed" ? (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-500 rounded-r" />
        ) : null}
        <div className="min-w-0 pl-1">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-heading font-black text-xs text-foreground shrink-0">
              # {alloc.plateNumber}
            </span>
            {isColdChain && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div className="size-4 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 cursor-help">
                      <SnowflakeIcon weight="fill" className="size-2.5" />
                    </div>
                  }
                />
                <TooltipContent>
                  <span>Reefer Cold Chain Compartment (0°C to 4°C)</span>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5 truncate max-w-[130px]">
            {alloc.vehicleModel}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <span className="font-medium text-xs text-foreground block truncate max-w-[180px]">
            {alloc.routeName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {alloc.assignedStops.length} stops scheduled
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <span className="font-medium text-xs text-foreground block truncate">
            {alloc.driverName}
          </span>
          <span className="text-[10px] text-muted-foreground">{alloc.driverPhone}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="secondary" className="text-[11px] font-bold px-2 py-0.5">
          {alloc.cratesAllocated}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <CircularProgressRing
            value={alloc.weightPercentage}
            size={22}
            strokeWidth={3}
          />
          <div>
            <span className="font-bold text-xs text-foreground block leading-tight">
              {alloc.allocatedWeightKg.toLocaleString()} kg
            </span>
            <span className="text-[10px] text-muted-foreground font-medium block">
              {alloc.weightPercentage}% of {alloc.maxWeightKg.toLocaleString()} kg
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <CircularProgressRing
            value={alloc.volumePercentage}
            size={22}
            strokeWidth={3}
          />
          <div>
            <span className="font-bold text-xs text-foreground block leading-tight">
              {alloc.allocatedVolumeCbm} m³
            </span>
            <span className="text-[10px] text-muted-foreground font-medium block">
              {alloc.volumePercentage}% of {alloc.maxVolumeCbm} m³
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-xs font-medium text-foreground">{alloc.departureTime}</span>
      </TableCell>
      <TableCell>{getAllocationStatusBadge(alloc.status)}</TableCell>
      <TableCell className="text-right">
        <IconButton
          variant="ghost"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(alloc);
          }}
          className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
          title="View Details"
        >
          <ArrowSquareOutIcon className="size-3.5" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
