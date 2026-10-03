import { FunnelIcon, RowsIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { CarryoverGroupBy } from "../types";

interface DeferralsFilterDropdownsProps {
  brandFilter: string;
  groupBy: CarryoverGroupBy;
  onBrandChange: (val: string) => void;
  onGroupByChange: (group: CarryoverGroupBy) => void;
}

export function DeferralsFilterDropdowns({
  brandFilter,
  groupBy,
  onBrandChange,
  onGroupByChange,
}: DeferralsFilterDropdownsProps) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="xs"
              className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
            />
          }
        >
          <FunnelIcon className="size-3 text-muted-foreground" />
          <span>Brand: {brandFilter === "all" ? "All" : `Waypoint ${brandFilter}`}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuLabel className="text-xs">Filter Brand</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={brandFilter}
            onValueChange={(val) => onBrandChange(val ?? "all")}
          >
            <DropdownMenuRadioItem value="all" className="text-xs">
              All Brands
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="Fresh" className="text-xs">
              Waypoint Fresh
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="Style" className="text-xs">
              Waypoint Style
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="Tech" className="text-xs">
              Waypoint Tech
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="xs"
              className="h-7 text-[11px] gap-1 cursor-pointer rounded-lg bg-card"
            />
          }
        >
          <RowsIcon className="size-3 text-muted-foreground" />
          <span>
            Group:{" "}
            {groupBy === "none"
              ? "None"
              : groupBy === "action"
                ? "By Action"
                : "By Reason"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuLabel className="text-xs">Group Orders</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={groupBy}
            onValueChange={(val) => onGroupByChange((val as CarryoverGroupBy) ?? "none")}
          >
            <DropdownMenuRadioItem value="none" className="text-xs">
              None (Flat Table)
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="action" className="text-xs">
              Group by Action
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="reason" className="text-xs">
              Group by Deferral Reason
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
