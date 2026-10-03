import { TruckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { VehicleTrackingData } from "@/types";

interface LiveMapFleetMenuProps {
  vehicles: VehicleTrackingData[];
  selectedVehicleStatuses: string[];
  onToggleVehicleStatus: (status: string) => void;
}

export function LiveMapFleetMenu({
  vehicles,
  selectedVehicleStatuses,
  onToggleVehicleStatus,
}: LiveMapFleetMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 cursor-pointer rounded-xl font-medium"
          />
        }
      >
        <TruckIcon weight="bold" className="size-3.5 text-primary" />
        <span>Fleet</span>
        <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px] font-bold">
          {selectedVehicleStatuses.length}
        </Badge>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56 p-2">
        <DropdownMenuLabel className="flex items-center gap-1.5 text-xs">
          <TruckIcon className="size-3.5" /> Vehicle Status
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={selectedVehicleStatuses.includes("en_route")}
          onCheckedChange={() => onToggleVehicleStatus("en_route")}
        >
          <span className="size-2 rounded-full bg-primary" />
          <span>En Route ({vehicles.filter((v) => v.status === "en_route").length})</span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={selectedVehicleStatuses.includes("at_stop")}
          onCheckedChange={() => onToggleVehicleStatus("at_stop")}
        >
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>At Stop ({vehicles.filter((v) => v.status === "at_stop").length})</span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={selectedVehicleStatuses.includes("delayed")}
          onCheckedChange={() => onToggleVehicleStatus("delayed")}
        >
          <span className="size-2 rounded-full bg-amber-500" />
          <span>Delayed ({vehicles.filter((v) => v.status === "delayed").length})</span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
