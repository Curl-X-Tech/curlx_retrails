import { Badge } from "@/components/ui/badge";
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
