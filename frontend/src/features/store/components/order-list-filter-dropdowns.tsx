import { CalendarBlankIcon, CaretDownIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrderListFilterDropdownsProps {
  dateFilter: string;
  onDateSelect: (date: string) => void;
  statusFilter: string;
  onStatusSelect: (status: string) => void;
  hubFilter: string;
  onHubSelect: (hub: string) => void;
}

export function OrderListFilterDropdowns({
  dateFilter,
  onDateSelect,
  statusFilter,
  onStatusSelect,
  hubFilter,
  onHubSelect,
}: OrderListFilterDropdownsProps) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs gap-1.5 rounded-lg border-border font-normal text-muted-foreground hover:text-foreground cursor-pointer"
            />
          }
        >
          <CalendarBlankIcon className="size-4 text-primary shrink-0" />
          <span className="font-medium text-foreground">
            {dateFilter === "today" ? "Today, Oct 01" : dateFilter === "tomorrow" ? "Tomorrow, Oct 02" : "All Dates"}
          </span>
          <CaretDownIcon className="size-3 text-muted-foreground ml-0.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 text-xs">
          <DropdownMenuItem onClick={() => onDateSelect("today")}>Today, Oct 01</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDateSelect("tomorrow")}>Tomorrow, Oct 02</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDateSelect("all")}>All Upcoming Runs</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs gap-1.5 rounded-lg border-border font-normal text-muted-foreground hover:text-foreground cursor-pointer"
            />
          }
        >
          <span>Status:</span>
          <span className="font-medium text-foreground capitalize">
            {statusFilter === "all" ? "All Statuses" : statusFilter.replace("_", " ")}
          </span>
          <CaretDownIcon className="size-3 text-muted-foreground ml-0.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 text-xs">
          <DropdownMenuItem onClick={() => onStatusSelect("all")}>All Statuses</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusSelect("pending")}>Pending</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusSelect("loading")}>Loading</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusSelect("in_transit")}>In Transit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusSelect("served")}>Served</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusSelect("deferred")}>Deferred</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs gap-1.5 rounded-lg border-border font-normal text-muted-foreground hover:text-foreground cursor-pointer"
            />
          }
        >
          <span>Hubs:</span>
          <span className="font-medium text-foreground capitalize">
            {hubFilter === "all" ? "All Depots" : `${hubFilter} Depot`}
          </span>
          <CaretDownIcon className="size-3 text-muted-foreground ml-0.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 text-xs">
          <DropdownMenuItem onClick={() => onHubSelect("all")}>All Depots</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onHubSelect("peliyagoda")}>Peliyagoda Depot</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onHubSelect("kandy")}>Kandy Depot</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
