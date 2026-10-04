import { StorefrontIcon, SnowflakeIcon, FunnelIcon } from "@phosphor-icons/react";
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

interface QueueFilterDropdownsProps {
  brandFilter: string;
  tempFilter: string;
  statusFilter: string;
  onBrandChange: (val: string) => void;
  onTempChange: (val: string) => void;
  onStatusChange: (val: string) => void;
}

export function QueueFilterDropdowns({
  brandFilter,
  tempFilter,
  statusFilter,
  onBrandChange,
  onTempChange,
  onStatusChange,
}: QueueFilterDropdownsProps) {
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
          <StorefrontIcon className="size-3 text-muted-foreground" />
          <span className="capitalize">
            Brand: {brandFilter === "all" ? "All Brands" : brandFilter}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
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
          <SnowflakeIcon className="size-3 text-muted-foreground" />
          <span className="capitalize">
            Temp: {tempFilter === "all" ? "All Zones" : tempFilter}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuLabel className="text-xs">Temperature</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={tempFilter}
            onValueChange={(val) => onTempChange(val ?? "all")}
          >
            <DropdownMenuRadioItem value="all" className="text-xs">
              All Zones
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="chilled" className="text-xs">
              Chilled
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="ambient" className="text-xs">
              Ambient
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
          <FunnelIcon className="size-3 text-muted-foreground" />
          <span className="capitalize">
            Status: {statusFilter === "all" ? "All Statuses" : statusFilter}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-xs">Priority & Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={statusFilter}
            onValueChange={(val) => onStatusChange(val ?? "all")}
          >
            <DropdownMenuRadioItem value="all" className="text-xs">
              All Statuses
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="urgent" className="text-xs">
              Urgent Only
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="deferred" className="text-xs">
              Deferred Yesterday
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
